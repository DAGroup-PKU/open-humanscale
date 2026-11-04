# Open-HumanScale project page

Static project website for Open-HumanScale, including its images, fonts, and demo videos.

Test website: https://jiankai-ss.github.io/open-humanscale/

## Local preview

Run from this repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open http://127.0.0.1:8765/ in a browser.

## GitHub Pages

Publish the `main` branch and `/ (root)` folder through **Settings → Pages → Deploy from a branch**.
The `.nojekyll` file keeps the website as plain static files. No build step or external video hosting is required.

## Updating

Update the website files and commit them to `main`; GitHub Pages republishes the site automatically.
When moving to a different site address, update the canonical URL, `og:url`, and `og:image` in `index.html`.

## Demo media

The zero-shot gallery lists 20 recordings in `assets/zero-shot-gallery.json`. Visible previews play muted and loop; offscreen previews pause. The pause button and reduced-motion preference control automatic playback.

Goal comparisons use clean robot footage from `assets/videos/clean-goals/`, with one goal image and playback-speed label displayed by the page. The complete introduction remains available through the **Film** button.

To regenerate the media from the original research recordings:

```sh
python3 tools/prepare_zero_shot_media.py --source /path/to/paper/videos/zero-shot/processed
python3 tools/prepare_clean_goal_media.py --paper-dir /path/to/paper
```

Both scripts require FFmpeg; the clean-goal script also requires `cwebp`. They write website copies and preserve the source recordings.
