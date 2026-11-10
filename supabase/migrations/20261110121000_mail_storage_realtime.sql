-- CDSU Mail, part 2: attachment storage, live updates and helper functions.

-- Attachments live in a private bucket, one folder per mailbox:
--   <mailbox id>/in/<message id>/<file>        written by the mail-inbound function
--   <mailbox id>/outgoing/<upload id>/<file>   uploaded by the mailbox owner while writing
insert into storage.buckets (id, name, public, file_size_limit)
values ('mail', 'mail', false, 26214400)
on conflict (id) do nothing;

create policy "Mailbox owners read their attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'mail' and (storage.foldername(name))[1] = (select public.my_mailbox_id())::text);

create policy "Mailbox owners upload outgoing attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'mail'
    and (storage.foldername(name))[1] = (select public.my_mailbox_id())::text
    and (storage.foldername(name))[2] = 'outgoing');

-- New mail appears without a refresh (row-level security still applies to live updates)
alter publication supabase_realtime add table public.mail_messages;

-- Unread and draft counts for the folder list
create or replace function public.mail_counts()
returns jsonb language sql stable security invoker set search_path = public as $$
  select jsonb_build_object(
    'inbox', count(*) filter (where folder = 'inbox' and not is_read),
    'spam', count(*) filter (where folder = 'spam' and not is_read),
    'drafts', count(*) filter (where folder = 'drafts'))
  from public.mail_messages
  where mailbox_id = public.my_mailbox_id() and not purged
$$;

-- For administrators in /admin: who can sign in to each mailbox (never the mail itself)
create or replace function public.list_mailboxes()
returns table (id uuid, address text, display_name text, purpose text, catch_all boolean, has_login boolean,
  last_sign_in_at timestamptz, unread bigint, last_received_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.id, m.address, m.display_name, m.purpose, m.catch_all, m.user_id is not null, u.last_sign_in_at,
    (select count(*) from public.mail_messages x where x.mailbox_id = m.id and x.folder = 'inbox' and not x.is_read and not x.purged),
    (select max(x.sent_at) from public.mail_messages x where x.mailbox_id = m.id and x.direction = 'in')
  from public.mailboxes m left join auth.users u on u.id = m.user_id
  where public.is_admin() and m.active
  order by m.address
$$;

revoke execute on function public.list_mailboxes() from public, anon;
revoke execute on function public.mail_counts() from public, anon;
revoke execute on function public.my_mailbox_id() from public, anon;
grant execute on function public.list_mailboxes(), public.mail_counts(), public.my_mailbox_id() to authenticated;
