# MonoPump Website

Standalone static website for MonoPump.

This is not a Next.js project. It is a pure HTML/CSS/JavaScript site with no Node.js dependency and no build step.

## Structure

- `index.html` - marketing landing page
- `launch.html` - App Store launch article and shareable canonical page
- `privacy.html` - privacy policy
- `support.html` - support and FAQ page
- `assets/app-store-link.js` - locale-aware App Store storefront links
- `assets/images/` - optimized website images used by the pages
- `ASSET_REPORT.md` - image size and dimension report

## Local Preview

Run from this directory:

```sh
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Deploy

Upload this directory to any static hosting service.

Examples:

- GitHub Pages
- Cloudflare Pages
- Vercel static project
- Netlify
- Any CDN or object storage static site

## Performance Notes

- Total directory size is about `936K`.
- Image assets are about `840K`.
- Only images referenced by the current pages are included.
- Large original PNG screenshots from `Doc/App截图/` are intentionally excluded.
- The app icon was resized from `256x256` to `180x180` for the website package.
- Screenshot JPEGs are kept at `645x1398` because recompression produced minimal savings and visible quality risk.
