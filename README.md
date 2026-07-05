# SRRA Multispeciality Hospital — Website

Plain HTML/CSS/JS, no build step, no frameworks. Open `index.html` in a browser
or serve the folder with any static server.

## Folder structure

```
/
  index.html
  style.css
  script.js
  /images/
    og-cover.jpg          ← social share preview image (add this)
    /sequence/
      frame_0001.jpg       ← Apple-style scroll sequence frames
      frame_0002.jpg
      ...
      frame_0150.jpg
```

## Adding the real Apple-style scroll sequence

The hero section (`.hero-scroll`) is wired to look for 150 sequential JPEGs at
`images/sequence/frame_0001.jpg` through `frame_0150.jpg` (4-digit, zero-padded).

- **If those files don't exist** (a fresh checkout), the site automatically
  falls back to a smooth procedural gradient animation — the scroll mechanism,
  text fades, and 60fps rendering all still work, just without real photography.
- **To use real photography**: render or export ~150 frames of a single
  continuous shot (hospital entrance, a doctor walking a corridor, equipment in
  use, etc.) at 16:9, drop them into `images/sequence/` with that exact naming
  pattern, and the fallback disables itself automatically — no code changes
  needed.
- Frame count can be tuned in `script.js` via the `FRAME_COUNT` constant.

## Other images to add

- `images/og-cover.jpg` — 1200×630 image used for social sharing previews
  (referenced in the `<meta property="og:image">` tags).
- The About section and hospital exterior currently use a styled placeholder
  (`.about__image`). Replace it with a real `<img>` tag once you have hospital
  photography, or set it as a `background-image` in CSS.

## Notes

- Google Map: the contact section has a placeholder div (`.contact__map`) —
  swap it for a real `<iframe>` embed once you have the hospital's Google Maps
  share link.
- Contact form: `script.js` validates fields client-side and shows a success
  message, but does **not** send data anywhere yet. Wire the `submit` handler
  in `initContactForm()` to your backend, or a service like Formspree/EmailJS.
- Phone numbers, address, and specialities are already filled in from the
  brief — update `index.html` directly if any of these change.
