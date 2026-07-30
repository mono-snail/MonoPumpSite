# MonoPump Website

Standalone static website for MonoPump.

This is not a Next.js project. It is a pure HTML/CSS/JavaScript site with no Node.js dependency and no build step.

## Structure

- `index.html` - marketing landing page
- `launch.html` - App Store launch article and shareable canonical page
- `privacy.html` - privacy policy
- `support.html` - support and FAQ page
- `assets/app-store-link.js` - locale-aware App Store storefront links
- `assets/i18n.js` - language detection, switching, persistence, and RTL behavior
- `assets/translations.js` - generated static translations for all public pages
- `assets/i18n.css` - shared language selector and RTL styles
- `assets/images/` - optimized website images used by the pages
- `ASSET_REPORT.md` - image size and dimension report

## Localization

The website supports English, Simplified Chinese, Traditional Chinese, Japanese,
Korean, French, German, Spanish, Portuguese, and Arabic. English remains the
static HTML fallback. The selected language is stored locally in the browser and
is also added to internal links as a `lang` query parameter.

After changing English source copy, regenerate the static translation resource:

```sh
ruby scripts/generate-translations.rb
```

The generator requires Ruby, Nokogiri, and network access to the translation
endpoint. Review privacy, medical-boundary, and product-capability statements
before publishing regenerated copy.

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
