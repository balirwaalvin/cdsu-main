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
- `css/styles.css`: Brand kit (colours sampled from the logo and book cover) and responsive multi-page styles
- `js/cdsuData.js`: **All text, contacts, prices, payments, partners, stories, and gallery items. Edit this file to change content.**
- `js/app.js`: Conditional page rendering, navigation active-state detection, and interactive components
- `assets/images/`: Authentic logo, book cover, author, endorser, and story photos extracted from the supplied PDFs

## Things to fill in or confirm (in `js/cdsuData.js`)
1. **Mobile Money**: set `payments.mobileMoney.mtn.merchantCode` and `.airtel.merchantCode`. While they are `null`, the site shows "coming soon".
2. **Partners/sponsors** (`sponsors`): the list currently holds only institutions named in the book. Confirm each one's status and add a `url`. A chip is clickable only when it has a URL. You can add logos with `logo: "assets/images/…"`.
3. **Gallery** (`galleryItems`): it currently uses brochure and book images. Add real outreach photos as they become available.
4. **Office address / phones**: edit `contact` when the office moves.

## Notes
- Forms have no server. They open WhatsApp (to the WhatsApp-only number) or the visitor's email app with the message already filled in.
- The book's chapters appear only as summaries, so the full content stays in the paid book.
