-- CDSU Mail, part 1: the three mailboxes and the messages in them.
-- Each mailbox (ed@, info@, support@cdsu.online) is tied to one sign-in account. Only that account can read the
-- mailbox; staff administrators can set its password from /admin but cannot read its mail.
-- Nothing is ever removed outright: "remove forever" sets mail_messages.purged.

create table public.mailboxes (
  id uuid primary key default gen_random_uuid(),
  address text not null unique check (address ~ '^[a-z0-9._-]+@cdsu\.online$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  purpose text not null default '',
  signature text not null default '' check (char_length(signature) <= 2000),
  user_id uuid unique references auth.users (id),
  catch_all boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
-- Mail sent to an @cdsu.online address that has no mailbox lands in the catch-all mailbox
create unique index mailboxes_one_catch_all on public.mailboxes (catch_all) where catch_all;

insert into public.mailboxes (address, display_name, purpose, catch_all) values
  ('ed@cdsu.online', 'CDSU Executive Director', 'The Executive Director''s office', false),
  ('info@cdsu.online', 'CDSU', 'General enquiries. Also receives mail sent to any other @cdsu.online address.', true),
  ('support@cdsu.online', 'CDSU Support', 'Help with payments, accounts and the online book', false);

create or replace function public.my_mailbox_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.mailboxes where user_id = auth.uid() and active
$$;

create table public.mail_messages (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid not null references public.mailboxes (id),
  direction text not null check (direction in ('in', 'out')),
  folder text not null default 'inbox' check (folder in ('inbox', 'sent', 'drafts', 'archive', 'spam', 'trash')),
  status text not null default 'received'
    check (status in ('received', 'draft', 'sent', 'delivered', 'delayed', 'bounced', 'complained', 'failed')),
  resend_id text,                 -- Resend's id for the email (sent or received)
  message_id text,                -- the RFC 5322 Message-ID header
  in_reply_to text,
  ref_headers text,               -- the References header
  thread_id uuid,                 -- messages in one conversation share this
  parent_id uuid references public.mail_messages (id), -- for drafts: the message being replied to or forwarded
  from_address text not null default '',
  from_name text not null default '',
  to_addrs text[] not null default '{}',
  cc_addrs text[] not null default '{}',
  bcc_addrs text[] not null default '{}',
  reply_to text,
  subject text not null default '' check (char_length(subject) <= 998),
  body_html text,
  body_text text,
  snippet text not null default '',
  attachments jsonb not null default '[]', -- [{name, type, size, path, inline, cid}]; files live in the private "mail" bucket
  auth_results jsonb,                       -- SPF / DKIM / DMARC verdicts for received mail
  is_read boolean not null default false,
  is_starred boolean not null default false,
  purged boolean not null default false,
  error text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mail_messages_folder_idx on public.mail_messages (mailbox_id, folder, sent_at desc) where not purged;
create index mail_messages_thread_idx on public.mail_messages (thread_id);
create index mail_messages_msgid_idx on public.mail_messages (mailbox_id, message_id);
create index mail_messages_resend_idx on public.mail_messages (resend_id);
create index mail_messages_parent_idx on public.mail_messages (parent_id);
-- A webhook delivered twice must not file the same email twice
create unique index mail_messages_received_once on public.mail_messages (mailbox_id, resend_id) where direction = 'in';

-- Row-level security: a mailbox's account sees only its own mailbox and messages
alter table public.mailboxes enable row level security;
alter table public.mail_messages enable row level security;

create policy "Owners see their mailbox" on public.mailboxes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Owners rename their mailbox and edit the signature" on public.mailboxes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Owners read their mail" on public.mail_messages
  for select to authenticated using (mailbox_id = (select public.my_mailbox_id()) and not purged);
create policy "Owners write drafts" on public.mail_messages
  for insert to authenticated
  with check (mailbox_id = (select public.my_mailbox_id()) and direction = 'out' and status = 'draft' and folder = 'drafts');
create policy "Owners file, flag and edit drafts" on public.mail_messages
  for update to authenticated
  using (mailbox_id = (select public.my_mailbox_id())) with check (mailbox_id = (select public.my_mailbox_id()));

revoke all on public.mailboxes from anon, authenticated;
grant select on public.mailboxes to authenticated;
grant update (display_name, signature) on public.mailboxes to authenticated;

revoke all on public.mail_messages from anon, authenticated;
grant select on public.mail_messages to authenticated;
grant insert (mailbox_id, direction, folder, status, parent_id, from_address, from_name, to_addrs, cc_addrs, bcc_addrs,
  subject, body_html, body_text, snippet, attachments) on public.mail_messages to authenticated;
grant update (folder, is_read, is_starred, purged, parent_id, to_addrs, cc_addrs, bcc_addrs, subject, body_html,
  body_text, snippet, attachments) on public.mail_messages to authenticated;

-- Keep users' edits sensible: only drafts can be rewritten, and messages can only move to folders that fit them.
-- The Edge Functions (service role) are not limited by this.
create or replace function public.mail_messages_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if current_user <> 'authenticated' then return new; end if;
  if old.status <> 'draft' and (
       new.subject is distinct from old.subject or new.body_html is distinct from old.body_html
    or new.body_text is distinct from old.body_text or new.to_addrs is distinct from old.to_addrs
    or new.cc_addrs is distinct from old.cc_addrs or new.bcc_addrs is distinct from old.bcc_addrs
    or new.attachments is distinct from old.attachments or new.parent_id is distinct from old.parent_id) then
    raise exception 'Only drafts can be edited.' using errcode = '42501';
  end if;
  if new.folder is distinct from old.folder and not (
       (old.direction = 'in' and new.folder in ('inbox', 'archive', 'spam', 'trash'))
    or (old.direction = 'out' and old.status = 'draft' and new.folder in ('drafts', 'trash'))
    or (old.direction = 'out' and old.status <> 'draft' and new.folder in ('sent', 'archive', 'trash'))) then
    raise exception 'That message cannot go in that folder.' using errcode = '42501';
  end if;
  if new.purged and not old.purged and old.folder <> 'trash' and not (old.status = 'draft') then
    raise exception 'Move the message to Trash first.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger mail_messages_guard before update on public.mail_messages
  for each row execute function public.mail_messages_guard();
