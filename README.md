# Open-HumanScale project page

Static website: https://dagroup-pku.github.io/open-humanscale/

## Preview and publish

```sh
python3 tools/preview.py
```

Open http://127.0.0.1:8876/. The preview server supports HTTP byte ranges for video seeking.

The current checkout publishes the `page` branch to the `dagroup` remote (`DAGroup-PKU/open-humanscale`). GitHub Pages serves the repository root. Commit and push updates to this branch; `.nojekyll` keeps the site static.

## Repository layout

- `index.html`, root JavaScript and CSS: page content, styling, galleries and playback controls. All are loaded by the page.
- `assets/figures`, `assets/logos`, `assets/fonts`: displayed figures, institution logos and the locally hosted font with its license.
- `assets/videos/presentation`: film, long-horizon camera pairs, continuous human-follow recordings, hero recording and additional camera views.
- `assets/videos/clean-goals`: 20 execution clips for goal comparisons and their camera variants.
- `assets/videos/zero-shot`: the 21-recording zero-shot gallery.
- `assets/videos/*.mp4`: 13 reviewed inputs still required by `prepare_clean_goal_media.py`. These are retained for regeneration, although the webpage plays the clean derivatives.
- `assets/posters`, `assets/goals`: displayed video posters and visual goals. Twelve zero-shot recordings have goal images; the rest have no placeholder.
- Asset JSON/CSV files: gallery data, source hashes, reviewed edit intervals and experiment data.
- `tools`: preview server, media preparation scripts and a read-only asset audit.

## Current media

The opening film is `Open-HumanScale_v5.mp4`, copied byte-for-byte at 1920×1080 with no transcoding. Its hash, size and duration are recorded in `assets/project-film.json`. Sound is enabled by default; viewers can mute it. Browsers that block audible autoplay show a play button. The shared custom timeline supports dragging and keyboard seeking.

The HumanWAM-Goal architecture was refreshed from the November 5 `GoalWAM_arch.pdf` as a 3200-pixel-wide lossless WebP. Its source and output hashes are recorded in `assets/figures/paper-current-manifest.json`.

Household tasks appear before desk organization. Both have first- and third-person views with shared playback, pause, seek and restart controls. The household third-person source is `long1.mp4`; its web copy retains 3840×2160 resolution. Both views loop at the shorter recording's endpoint.

## Maintenance

```sh
node tools/audit_assets.mjs
python3 tools/prepare_zero_shot_media.py --source /path/to/paper/videos/zero-shot/processed
python3 tools/prepare_zero_shot_goals.py --source /path/to/paper/videos/zero-shot
python3 tools/prepare_clean_goal_media.py --paper-dir /path/to/paper
```

Media preparation requires FFmpeg and `cwebp`. The gallery generator preserves separately added recordings and goal mappings. Original research recordings outside this repository are not modified.

The audit reports missing and unused assets without deleting anything. It covers static references, dynamically generated camera paths, the gallery, licenses, provenance and regeneration inputs. Update its dynamic-path rules when changing the media rendering scheme in `app.js`; review its results before removing files.

The November 5 cleanup removed obsolete media versions, unused figure exports and duplicate posters. Earlier versions remain available in Git history.
