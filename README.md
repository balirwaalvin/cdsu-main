# CDSU Website

A static website for The Career Development Society of Uganda. It needs no build step: open `index.html` in a browser, or run a local server:
```bash
python3 -m http.server 8000
# Then open http://localhost:8000 in your browser
```
Or upload the folder to any web host (cPanel, Netlify, Vercel, Firebase Hosting, GitHub Pages).

## Multi-Page Structure
- `index.html`: Home page (Hero, Partners Marquee, Explore CDSU Hub, and the 5 Rules to a Super Career)
- `about.html`: About CDSU, Vision & Mission, 4 Core Objectives, 5 Authors, and Editorial Review Board
- `programme.html`: The 3-Phase Career Development Programme (CDP), 5 Core Products, and Interactive Career Cluster Self-Assessment (Annexure 3)
- `book.html`: Flagship Manual (*Career Development: A Path to Wealth*), Keynote Endorsements, 8-Chapter Syllabus, and Book Serial Number Registration
- `stories.html`: Youth Transformation & Success Stories (with full-story modal reader)
- `gallery.html`: Filterable Activities & Outreach Gallery (with Lightbox viewer)
- `join.html`: 6 Membership & Impact Tiers + Direct Bank (ABSA UGX/USD) & Mobile Money Support Portal
- `contact.html`: Secretariat Contact Details + Interactive School Referral & Partnership Form
- `terms.html`: Terms & Conditions for payments, book orders, memberships, the National Seminar, donations and personal data
- `account.html` + `js/account.js`: Member accounts (sign up / sign in, payments, memberships, redeem a book serial)
- `reader.html` + `js/reader.js` + `css/reader.css`: Protected online reader for the book
- `admin/`: Admin portal at `/admin` (payments queue, serials, inbox, members, book upload, staff, mailboxes, activity log)
- `mail/`: CDSU Mail at `/mail`, webmail for ed@, info@ and support@cdsu.online (see *CDSU Mail* below)
- `supabase/`: Database migrations and Edge Functions for CDSU Mail
- `js/supa.js`: Connection to the Supabase backend (publishable key only)
- `css/styles.css`: Brand kit (colours sampled from the logo and book cover) and responsive multi-page styles
- `js/cdsuData.js`: **All text, contacts, prices, payments, partners, stories, and gallery items. Edit this file to change content.**
- `js/app.js`: Conditional page rendering, navigation active-state detection, and interactive components
- `assets/images/`: Authentic logo, book cover, author, endorser, and story photos extracted from the supplied PDFs

## Things to fill in or confirm (in `js/cdsuData.js`)
1. **Mobile Money**: MTN MoMo (merchant code 7232094, `*165*3#`) and Airtel Money (merchant ID 7261407, `*185*9#`) are live in `payments.mobileMoney`. Setting a `merchantCode` to `null` shows "coming soon" again.
2. **Partners/sponsors** (`sponsors`): the list currently holds only institutions named in the book. Confirm each one's status and add a `url`. A chip is clickable only when it has a URL. You can add logos with `logo: "assets/images/…"`.
3. **Gallery** (`galleryItems`): it currently uses brochure and book images. Add real outreach photos as they become available.
4. **Office address / phones**: edit `contact` when the office moves.

## Notes
- Forms have no server. They open WhatsApp (to the WhatsApp-only number) or the visitor's email app with the message already filled in.
- The book's chapters appear only as summaries, so the full content stays in the paid book.

## Backend (Supabase project "CDSU", ref `kmkankeawivfduiumtnb`)
- **Payments:** the payment pop-up's confirmation form calls `submit_payment`; every confirmation lands in `/admin` as *pending*. Confirming it (`review_payment`) unlocks what was bought: a book serial (`CDSU-XXXX-XXXX-XXXX`), a membership/registration, a seminar seat, or a recorded donation.
- **Book serials:** sent to the buyer with one-click WhatsApp/email buttons in the portal; the buyer redeems it in *My Account*. Printed copies get serials from *Book serials → Generate*.
- **Online book:** upload the PDF in *Admin → Online book*. The browser converts pages to images and stores them in the private `book` bucket; the PDF is never uploaded or committed. Readers get 60-second links to one page at a time, watermarked with their email and serial.
- **Messages:** the contact form saves to the portal inbox (`submit_message`).
- **Security:** every table has row-level security; visitors can only submit, members see only their own records, and staff actions go through permission-checked functions recorded in the activity log. Only the publishable key is in this repo — never add the service-role key.
- **Staff:** a person creates an account on the site, then an administrator adds their email under *Admin → Staff* (roles: Administrator, Secretariat).

## CDSU Mail (`/mail`)
Webmail for three mailboxes: **ed@cdsu.online**, **info@cdsu.online** and **support@cdsu.online**. Mail is sent and
received through [Resend](https://resend.com); messages and attachments are stored in Supabase.

- **Signing in:** each mailbox has its own password. An administrator sets or resets it in *Admin → Mailboxes*;
  the mailbox's user can change it later in *CDSU Mail → Settings*. Only a mailbox's own sign-in can read its mail —
  administrators manage passwords but cannot read anyone's messages. CDSU Mail keeps its own session, separate from
  the admin portal and member accounts.
- **Features:** Inbox, Starred, Sent, Drafts, Archive, Spam and Trash; conversations; search; replies, reply-all and
  forwards; attachments up to 28 MB; drafts saved as you type; per-mailbox name and signature; new mail appears live.
  Pictures in received mail stay hidden until you choose to show them. Keyboard: `c` compose, `/` search,
  `j`/`k` next/previous, `r` reply, `a` reply all, `f` forward, `e` archive, `#` trash, Ctrl+Enter send.
- **Routing:** mail to any other @cdsu.online address goes to info@. Mail that fails the sender's DMARC check goes to Spam.

How it works (`supabase/`):
| Piece | What it does |
|---|---|
| `migrations/…_mail_schema.sql` | `mailboxes` and `mail_messages` tables with row-level security |
| `migrations/…_mail_storage_realtime.sql` | private `mail` storage bucket, live updates, `mail_counts`, `list_mailboxes` |
| `functions/mail-send` | sends from the signed-in mailbox through the Resend API and files a copy in Sent |
| `functions/mail-inbound` | Resend webhook: files received mail and records delivery/bounce updates |
| `functions/mail-admin` | administrators set mailbox passwords and check the Resend connection |

Setting up Resend (once):
1. Add the domain `cdsu.online` in Resend, turn on **receiving** for it, and add the DNS records Resend lists
   (DKIM, SPF/return-path and the receiving MX) in Cloudflare DNS.
2. Create a **full access** API key and save it as the Supabase Edge Function secret `RESEND_API_KEY`.
3. Create a Resend webhook to
   `https://kmkankeawivfduiumtnb.supabase.co/functions/v1/mail-inbound` with the events `email.received`,
   `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained` and `email.failed`, and save its
   signing secret as `RESEND_WEBHOOK_SECRET`.
4. Set each mailbox's password in *Admin → Mailboxes*. That page also shows whether the key, secret and domain are ready.
5. Publish a DMARC policy so receiving servers can align SPF/DKIM with the From domain. cdsu.online has
   `_dmarc.cdsu.online` TXT `v=DMARC1; p=none;` (monitor only). Once mail has been delivering cleanly for a few
   weeks it can be tightened to `p=quarantine`.

The receiving MX record replaces whatever currently receives mail for cdsu.online, so mail stops going to any
previous mail host once it is switched.

## Hosting (Cloudflare)
The site lives at https://cdsu.online as a static-assets Cloudflare Worker named `cdsu-site`, configured by
`cloudflare.config.ts` and `wrangler.config.ts`. Every push to `main` builds and deploys it through Cloudflare's Workers
Builds (build command `npm run build`, deploy command `npx cf deploy`). To publish by hand instead:

```sh
npm ci            # first time only; needs Node.js 22.18+
npx cf auth login # first time only
npm run deploy
```

`npm run build` copies only the website files (`*.html`, `css`, `js`, `assets`, `admin`, `mail`, `_headers`) into `dist/`, so
notes and scripts in this repository are not published. `_headers` sets the security and cache headers. Plain page
addresses are canonical: `/about.html` redirects to `/about`.

**Domain and DNS:** `cdsu.online` is registered at Namecheap with its nameservers pointed at Cloudflare, so DNS records
are edited in Cloudflare. `www.cdsu.online` serves the same site, while canonical and share links use `cdsu.online`. The MX, SPF, `mail`, `autodiscover` and
`autoconfig` records belong to Namecheap Private Email and must stay DNS-only.

**Other hosts:** `Dockerfile` + `Caddyfile` package the same site as a container for any container host:
`podman build -t cdsu-site . && podman run --rm -e PORT=8080 -p 8080:8080 cdsu-site`

## Link previews (WhatsApp, Facebook, LinkedIn, X, Telegram)
Every public page carries Open Graph / Twitter Card tags (between `<!-- share:start -->` and `<!-- share:end -->`)
and its own 1200×630 preview image in `assets/images/share/`. Both come from `tools/share_preview.py`, which holds
the site address and each page's preview wording; the images are drawn from `tools/share-card.html`.
- Change wording or the site address (e.g. a new CDSU domain): edit `tools/share_preview.py`, run `python3 tools/share_preview.py`.
- Redraw the images too: `python3 tools/share_preview.py --render` (needs Google Chrome and ImageMagick), then bump `IMAGE_VERSION`.
