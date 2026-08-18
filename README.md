# Hello People, website

The marketing site for Hello People, an AI automation and growth studio.
Static HTML, no build step, built entirely on the Hello People design system.

> Say hello to less busywork.

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `services.html` | Services (what we automate, process, pricing, FAQ) |
| `about.html` | About (story, values, how we work) |
| `contact.html` | Contact (audit request form) |
| `404.html` | Friendly not-found page |

## How it is built

Everything reads from the design system, so the site can never drift from the brand:

```
assets/css/fonts.css        embedded Poppins + Inter (offline-ready, base64)
assets/css/tokens.css       design tokens (color, type, space, radius, motion)
assets/css/components.css   buttons, cards, badges, forms, notes
assets/css/site.css         site-only layout (header, footer, hero, sections)
assets/js/site.js           theme toggle, mobile nav, reveal-on-scroll, form
assets/logo/                logo variants (light + on-dark) and favicon
assets/icons/               brand icons used on the site
```

Load order in every page is `fonts -> tokens -> components -> site`. To restyle
the brand, change the token files, not the pages.

Light and dark mode both work out of the box: dark follows the visitor's OS
setting, and the header toggle saves a preference in `localStorage`.

The contact form validates in the browser and shows a confirmation. It has **no
backend** (a static host cannot process a POST). To make it send real enquiries,
point it at a form service (Formspree, Basin, Netlify Forms) or your own endpoint,
see "Wire up the form" below.

## Run it locally

Any static server works. For example:

```bash
cd website
python3 -m http.server 8080
# open http://localhost:8080
```

## Put it in its own repo + GitHub Pages

This folder is self-contained and ready to become the `hellopeople-website` repo.

1. **Create the repo** on GitHub: `hellopeople-website` (public).
2. **Move these files to the repo root** (the site should not sit inside a
   `website/` subfolder in the new repo, so `index.html` is at the top level).
3. Push:
   ```bash
   git init && git add . && git commit -m "Hello People website"
   git branch -M main
   git remote add origin https://github.com/<you>/hellopeople-website.git
   git push -u origin main
   ```
4. **Enable Pages**: repo **Settings -> Pages -> Source: Deploy from a branch ->
   Branch: `main` / `/ (root)` -> Save.** Your site goes live at
   `https://<you>.github.io/hellopeople-website/` in a minute or two.
5. **Custom domain (optional)**: to serve at `hellopeople.ca`, add a `CNAME` file
   containing `hellopeople.ca`, then set the DNS records GitHub shows you.
   Update the two `REPLACE-WITH-YOUR-DOMAIN` placeholders in `robots.txt` and
   `sitemap.xml` to your real domain.

`.nojekyll` is included so GitHub Pages serves every file as-is.

## Wire up the form (optional)

In `contact.html`, the `<form data-contact-form>` currently confirms in the
browser only. To collect real submissions with no server, sign up for a form
service and set the form `action` and `method`, for example:

```html
<form data-contact-form action="https://formspree.io/f/yourid" method="POST" novalidate>
```

Then remove the `e.preventDefault()` path in `site.js`, or keep the JS validation
and let the service handle delivery.
