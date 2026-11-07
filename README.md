# Affinity Universe Consulting.

An English-language company profile with black and deep-gray backgrounds, white text, and a local five-step scroll section.

## Run

No installation or build is required. From this folder, run:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/ in your browser. The site also works from a subdirectory on static hosting.

## Replace the video and logo

| Asset | File to replace | Used by |
| --- | --- | --- |
| Background video | `assets/media/bg.mp4` | The opening cover section |
| Video poster / fallback | `assets/images/hero-poster.jpg` | The cover before playback or if the video cannot load |
| Shared logo | `assets/brand/logo.png` | Both the header and footer |
| Main hero title artwork | `assets/brand/logo2.png` | Large hero headline (optional image) |
| Process background | `assets/images/process-bg.jpg` | The five-step scroll section |

Keep the same filenames when replacing these files. Use an MP4 with H.264 video for broad browser support. Replace the poster as well if you want the still image to match your new video.

`logo.png` is currently a transparent placeholder. Until you supply a logo, the header and footer show the text **Affinity Universe Consulting.** Replace it with your own transparent PNG, larger than one pixel; the site will display it in both locations automatically. Logos and channel marks are rendered white to match the monochrome theme. Refresh the page after replacing an asset.

The process background is included locally from the image URL you supplied:

https://images.unsplash.com/photo-1780845973846-251dc55c6826?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D

## Edit the content

- `index.html`: English copy, service sections, five process steps, footer, and inquiry form labels.
- `assets/profile.css`: monochrome colors, layout, responsive rules, and the process background overlay.
- `assets/profile.js`: header menu, Seoul clock, video controls, shared logo handling, and process scrolling.
- `assets/js/inquiry.js`: form validation and submission settings.

The old portfolio, reference library, and brands/organizations sections and their assets have been removed. The header now shows only Contact ↗; it opens the existing inquiry popup without navigating away. The footer is pure black (#000), and contains the email link and Back to top.

## Process section

The five steps are **Understand → Plan → Build → Integrate → Support**. Their headings and descriptions are present in the HTML immediately; they do not wait for an iframe, remote CMS, animation library, or hydration step.

On desktop, the five process numbers travel around a circular arc in response to scrolling, like the VELDY profile reference. Scroll through the section or use the numbered steps and arrow controls. Keyboard arrow keys also work when a numbered step is focused. Without JavaScript, on narrow/short screens, when reduced motion is preferred, or without sticky-position support, all five steps remain visible in a normal scrolling list.

## Contact and inquiries

The footer email and form recipient are both **affinity.financeteam@gmail.com**. To change the recipient, update `RECIPIENT_EMAIL` in `assets/js/inquiry.js` and the `mailto:` link in `index.html`.

The form uses FormSubmit over HTTPS. Its network request occurs only when a visitor submits a valid inquiry. Page rendering, the process background, logos, and video use the included local files. Form submission requires an internet connection.

## Deploy

Upload this folder's contents to any static host. For GitHub Pages, select the branch and repository root in Settings → Pages. `.nojekyll` is included. No custom domain or previous site's configuration is included.

## November 7 refinements

- The header only shows **Contact ↗**, which opens the pre-existing project inquiry dialog.
- The closing footer background is `#000000`.
- The process stage now animates the five numbers along a circular arc, tied to the scroll progress. The list remains accessible without JS and on small screens.
- The monday.com, KakaoTalk and Google Drive marks now sit inside the right-hand BUSINESS OPERATIONS column and align with its left edge.

## November 7 additional revisions

- The five-step orbital process **holds each active number and description**, then turns to the next step. Desktop wheel input advances one step at a time; touch, narrow screens, keyboard and reduced-motion users retain accessible alternatives.
- The channel carousel preserves the cutout in the YouTube play icon and crops the Kakao wordmark's large SVG margins, making its actual lettering properly sized.
- [12] Selected Solutions numerical labels are vertically centered against their text.
- The three repeated "Discuss a partnership" CTAs are removed from Engagement Models.
- The Engagement Models headline has a controlled, two-line desktop layout.
- The Back to top link now includes a smooth-scroll click handler and an HTML anchor fallback.
- The three [03] Capabilities cards are plain informational elements, no longer links.
- The hero headline references `assets/brand/logo2.png` (same directory as `logo.png`). **That image was not supplied with the ZIP**, so a text fallback remains visible until you upload `logo2.png` to that path. Neither the header nor footer logo changes.

## November 7 layout alignment (v3)

- The active orbital number is vertically aligned with the visible process headline. The orbital circle and its ticks also follow that measured headline center after resize or step changes.
- BUSINESS OPERATIONS partner marks use a wider three-column arrangement on desktop, with the first aligned left and the last aligned flush with the table's right edge. Logos are larger, with more breathing room; mobile falls back to a wrapped row.
- The hero's main headline and optional `logo2.png` graphic are about half the former desktop size, leaving more open space above them. Mobile has a readable size override.
- `index.html` now includes updated CSS/JS cache version parameters (`v=5`) for reliable refreshes after deployment.

## November 7 interaction and header refinement (v4)

- Removed both visible “Explore our expertise” calls to action: the rounded cover button and the underlined About-section link. Kept the adjacent explanatory copy.
- Moved the Seoul clock out of the center grid cell and into the right-hand navigation, immediately to the left of Contact, including compact/mobile layouts.
- Slowed each desktop orbital wheel gesture to approximately 1.4 seconds per step plus a short lock. A seven-detent easing curve now gives the orbit a mechanical catch-and-release progression; each numbered step holds, rotates, and visibly settles. Outside that section (and with reduced motion), native scrolling is unchanged.
- Incremented the local CSS and JavaScript asset query versions to v6.


## v5 layout refinement

- Cover introduction copy shares the same right-hand grid starting point as the About section on desktop.
- On narrow mobile screens, the footer height follows its content (no forced full-viewport height), with a 36px bottom padding.
- CSS cache token updated to `v=7`; no other content or interactions changed.

## v6 mobile cover spacing

- On screens up to 600px wide, the opening cover height now follows content instead of forcing a full viewport with an automatic top margin on the headline.
- The gap from the company-profile label to the main title is now capped at 160px (responsive from 110px), roughly a third of the prior tall-mobile gap.
- Desktop cover, video, process scroll, contact modal, and footer remain unchanged.
- CSS cache token increased to `v=8`.
