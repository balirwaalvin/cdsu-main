#!/usr/bin/env python3
"""Social-media link previews for the CDSU site.

Writes Open Graph / Twitter Card tags into each page (between <!-- share:start --> and <!-- share:end -->)
and, with --render, draws the 1200x630 preview images from tools/share-card.html using headless Chrome.

When the site moves to its own domain, change SITE_URL below and run:
    python3 tools/share_preview.py            # update the tags only
    python3 tools/share_preview.py --render   # also redraw the images (needs Google Chrome + ImageMagick)
"""
import pathlib
import re
import subprocess
import sys
import tempfile
from html import escape
from urllib.parse import urlencode

SITE_URL = "https://cdsu.online/"
SITE_NAME = "The Career Development Society of Uganda (CDSU)"
IMAGE_VERSION = "20261101"  # bump after redrawing so platforms fetch the new images

ROOT = pathlib.Path(__file__).resolve().parent.parent

# page file: (preview title, description, card text, picture in assets/images, how to show it)
PAGES = {
    "index.html": (
        "The Career Development Society of Uganda (CDSU)",
        "Building people first, for wealth to follow. CDSU runs a structured Career Development Programme for learners, parents, teachers and schools across Uganda.",
        ("Non-partisan, non-profit · Uganda", "The Career Development", "Society of Uganda", "Career guidance, skills and enterprise for all."),
        "students_laptop.jpg", "photo"),
    "about.html": (
        "About CDSU — Who We Are & Our Leadership",
        "Our vision, mission and core objectives, the Executive Committee, and the authors behind Career Development: A Path to Wealth.",
        ("About CDSU", "Who We Are &", "Our Leadership", "Vision, mission, objectives and the people behind the CDP."),
        "students_reading.jpg", "photo"),
    "programme.html": (
        "The Career Development Programme (CDP) — CDSU",
        "Three phases, six career clusters and five core products — plus the free Career Cluster self-check and the National Training Seminar for teachers, 19–21 January 2027.",
        ("Career Development Programme", "3 Phases. 6 Clusters.", "One Path to Wealth.", "Take the free Career Cluster self-check."),
        "students_laptop.jpg", "photo"),
    "book.html": (
        "Career Development: A Path to Wealth — CDSU",
        "The 8-chapter practical manual and self-assessment workbook (ISBN 978-9913-678-02-5). Buy it for UGX 50,000 and read it online with your serial number.",
        ("Flagship publication", "Career Development:", "A Path to Wealth", "8 practical chapters · Read it online with your serial."),
        "book_3d.png", "float"),
    "stories.html": (
        "Success Stories — Ordinary Ugandan Youth, Real Results | CDSU",
        "How career guidance, TVET skilling and the new curriculum took young Ugandans into global science and thriving enterprises.",
        ("Success stories", "Ugandan Youth,", "Real Results", "From career guidance to science and enterprise."),
        "story_safari_daniel.jpg", "photo"),
    "gallery.html": (
        "Activities & Outreach Gallery — CDSU",
        "Photos from CDSU school career seminars, Career Cluster clubs, TVET practical skilling and youth enterprise showcases.",
        ("Activities & outreach", "CDSU in", "Action", "Seminars, career clubs, TVET skilling and enterprise."),
        "students_reading.jpg", "photo"),
    "join.html": (
        "Join, Subscribe or Donate — CDSU",
        "Memberships from UGX 20,000, school and corporate packages, and donations by MTN MoMo, Airtel Money or ABSA Bank.",
        ("Join · Subscribe · Donate", "Partner With CDSU", "for Impact", "Memberships from UGX 20,000 · Pay by MoMo or bank."),
        "book_3d.png", "float"),
    "contact.html": (
        "Contact the CDSU Secretariat",
        "Reach CDSU in Gayaza, Wakiso: refer a school for the Career Development Programme, order books or become a partner.",
        ("Contact the Secretariat", "Let's Talk", "Careers", "Refer a school, order books or become a partner."),
        "cdsu_emblem.png", "emblem"),
    "terms.html": (
        "Terms & Conditions — CDSU",
        "The terms for book orders, memberships, training, the National Seminar and donations to CDSU, including refunds and personal data.",
        ("Policies", "Terms &", "Conditions", "Payments, refunds, the National Seminar and your data."),
        "cdsu_emblem.png", "emblem"),
    "account.html": (
        "My CDSU Account",
        "Sign in to read Career Development: A Path to Wealth online, follow your payments and see your memberships.",
        ("Members", "My CDSU", "Account", "Read the book online and follow your payments."),
        "book_3d.png", "float"),
}

START, END = "<!-- share:start -->", "<!-- share:end -->"


def page_url(name: str) -> str:
    return SITE_URL if name == "index.html" else SITE_URL + name[:-5]  # the host serves clean URLs: /about


def tags(name: str) -> str:
    title, desc, card, _img, _fit = PAGES[name]
    image = f"{SITE_URL}assets/images/share/{name[:-5]}.jpg?v={IMAGE_VERSION}"
    alt = f"{card[1]} {card[2]} — {SITE_NAME}"
    e = lambda s: escape(s, quote=True)
    lines = [
        START,
        f'<link rel="canonical" href="{e(page_url(name))}" />',
        '<meta name="theme-color" content="#0B1F54" />',
        '<meta property="og:type" content="website" />',
        f'<meta property="og:site_name" content="{e(SITE_NAME)}" />',
        '<meta property="og:locale" content="en_GB" />',
        f'<meta property="og:url" content="{e(page_url(name))}" />',
        f'<meta property="og:title" content="{e(title)}" />',
        f'<meta property="og:description" content="{e(desc)}" />',
        f'<meta property="og:image" content="{e(image)}" />',
        '<meta property="og:image:type" content="image/jpeg" />',
        '<meta property="og:image:width" content="1200" />',
        '<meta property="og:image:height" content="630" />',
        f'<meta property="og:image:alt" content="{e(alt)}" />',
        '<meta name="twitter:card" content="summary_large_image" />',
        f'<meta name="twitter:title" content="{e(title)}" />',
        f'<meta name="twitter:description" content="{e(desc)}" />',
        f'<meta name="twitter:image" content="{e(image)}" />',
        f'<meta name="twitter:image:alt" content="{e(alt)}" />',
        END,
    ]
    return "\n  ".join(lines)


def write_tags() -> None:
    for name in PAGES:
        path = ROOT / name
        html = path.read_text()
        block = tags(name)
        if START in html:
            html = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, html, flags=re.S)
        else:
            desc = re.search(r'\n(\s*)<meta name="description"[^>]*>', html)
            if not desc:
                sys.exit(f"{name}: no description meta tag to anchor the share tags")
            html = html[: desc.end()] + "\n  " + block + html[desc.end():]
        path.write_text(html)
        print(f"tags   {name}")


def render_images() -> None:
    out_dir = ROOT / "assets/images/share"
    out_dir.mkdir(parents=True, exist_ok=True)
    template = (ROOT / "tools/share-card.html").as_uri()
    with tempfile.TemporaryDirectory() as tmp:
        for name, (_t, _d, card, img, fit) in PAGES.items():
            kicker, title, accent, sub = card
            query = urlencode({"kicker": kicker, "title": title, "accent": accent, "sub": sub, "img": img, "fit": fit})
            png = pathlib.Path(tmp) / "card.png"
            subprocess.run(
                ["google-chrome", "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                 "--window-size=1200,630", "--virtual-time-budget=8000", f"--screenshot={png}", f"{template}?{query}"],
                check=True, capture_output=True)
            jpg = out_dir / f"{name[:-5]}.jpg"
            subprocess.run(["magick", str(png), "-crop", "1200x630+0+0", "+repage", "-strip", "-interlace", "Plane",
                            "-quality", "84", str(jpg)], check=True)
            print(f"image  {jpg.relative_to(ROOT)}  {jpg.stat().st_size // 1024} KB")


if __name__ == "__main__":
    if "--render" in sys.argv:
        render_images()
    write_tags()
