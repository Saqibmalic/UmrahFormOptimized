# Media used by the landing page

## Images (all WebP, all from @umrahinsights)

| File | Size | Where it appears |
|---|---|---|
| `madinah-moon.webp` | 1179×1561 | **Hero background** behind the green wash, and the second Instagram tile |
| `ig-post-planning.webp` | 1080×1350 | First Instagram tile |
| `madinah-rays.webp` | 514×640 | Third Instagram tile |
| `madinah-crescent.webp` | 526×701 | Ramadan section image, and the fourth Instagram tile |
| `madinah-day.webp` | 526×702 | 4-star hotel card |
| `story-1-poster.jpg` | 405×720 | Poster frame for video 1 (auto-extracted) |
| `story-2-poster.jpg` | 405×720 | Poster frame for video 2 (auto-extracted) |

**Why the placements are what they are:** only `madinah-moon` and
`ig-post-planning` are over 1000px wide. A ~520px image stretched across a
full-width section looks soft on a desktop screen, so the smaller four are
used only where they are displayed small — Instagram tiles (~300px), the
Ramadan image (230px) and the hotel card. If you re-export any of them at
1600px+ on the long edge, tell me and I will promote them to full-bleed
backgrounds.

**Still wanted:** a Makkah / Kaaba post. The 5-star hotel card is about
walking distance to the Haram and currently has no photo. Save one as
`makkah-haram.webp` and it goes straight in.

## Videos — see `assets/video/`

`story-1.mp4` (21s, Madinah) and `story-2.mp4` (34s, Bushra in Makkah).
Re-encoded from the 19MB and 21MB originals to 720×1280 H.264/AAC at
3.2MB and 4.0MB, with the moov atom moved to the front so playback starts
before the file finishes downloading. The originals remain in git history
at commit 50523d0 if you ever need them.

Nothing downloads until a visitor taps play — each tile is only a poster
frame until then.

### Adding another video

1. Drop the file in `assets/video/`.
2. Copy a `<figure class="vid">` block in `index.html` (`#reviews`).
3. Set `data-video` to the path with `data-video-type="file"` — or to an
   11-character YouTube ID with `data-video-type="youtube"`.
4. Add a poster frame and write a caption naming the person and the city.

Keep new files under ~5MB: 720×1280, H.264, CRF 28-30, AAC 96kbps.
