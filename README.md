# Open-HumanScale project page

Static project website for Open-HumanScale, including its images, fonts, and demo videos.

Test website: https://jiankai-ss.github.io/open-humanscale/

## Local preview

Run from this repository root:

```sh
python3 tools/preview.py
```

Open http://127.0.0.1:8876/ in a browser.

## GitHub Pages

Publish the `main` branch and `/ (root)` folder through **Settings → Pages → Deploy from a branch**.
The `.nojekyll` file keeps the website as plain static files. No build step or external video hosting is required.

## Updating

Update the website files and commit them to `main`; GitHub Pages republishes the site automatically.
When moving to a different site address, update the canonical URL, `og:url`, and `og:image` in `index.html`.

## Demo media

The zero-shot gallery lists 21 recordings in `assets/zero-shot-gallery.json`. Visible previews play muted and loop; offscreen previews pause. The pause button and reduced-motion preference control automatic playback.

Goal comparisons use clean robot footage from `assets/videos/clean-goals/`. Four Goal ICL experiments and two human-goal experiments are shown in document order, each with its own paired playback controls. The goal images have responsive highlights from `goal-annotations.js`, including when enlarged; original images are unchanged.

The complete `Open-HumanScale_v4.mp4` opens the page with sound enabled. The 1920×1080 source is copied byte-for-byte (SHA256 and size in `assets/project-film.json`). Browsers that block audible autoplay show a play button; the Sound button toggles mute. Scrolling fades the film into the paper title and authors; offscreen playback pauses. The **Film** navigation link returns to it. Reduced-motion preferences disable the crossfade and automatic film playback.

To regenerate the media from the original research recordings:

```sh
python3 tools/prepare_zero_shot_media.py --source /path/to/paper/videos/zero-shot/processed
python3 tools/prepare_clean_goal_media.py --paper-dir /path/to/paper
```

Both scripts require FFmpeg; the clean-goal script also requires `cwebp`. They write website copies and preserve the source recordings.

## Local review updates (2026-11-04)

- The preview server supports HTTP byte ranges for video seeking. Use `tools/preview.py`; Python's stock `http.server` ignores range requests. The film also has an accessible draggable timeline, with keyboard controls. Existing same-origin Blob fallback remains available on hosts with broken seek ranges.
- The title now reaches 88px, with a 40px paper subtitle on large screens. The method section uses a full-width neutral background and aligned content gutters. Evaluation details are removed and leaderboard captions are concise; the snowy figures and results are unchanged.
- Twelve of the 21 zero-shot recordings have verified input-goal thumbnails, extracted from fixed goal panes. The remaining recordings show no goal placeholder. The additional bottle-handover recording is cropped to the original 640×360 robot-view pane; the source recording remains untouched.
- Comparison goals are smaller than execution videos. Highlights remain available in enlarged figures; the middle-drawer label sits beside the highlight. Paired controls are below the videos. Visible comparisons loop muted and pause offscreen, when a dialog opens, or when requested by the viewer.
- Household tasks come first and use the two new original recordings (2560×1440 third-person, 1280×720 first-person). Both household and desk tasks display their two camera views together. Recordings retain their own timings; paired restart does not claim frame synchronization.
- Navigation hides while reading and appears at the top edge, with keyboard and compact touch/small-screen access. Speed descriptions are removed from page captions and dialogs.

Regenerate the verified goals from the original `videos/zero-shot` directory:

```sh
python3 tools/prepare_zero_shot_goals.py --source /path/to/paper/videos/zero-shot
```

The gallery regeneration tool preserves separately added recordings and goal mappings. New long-horizon media provenance is in `assets/additional-demos-v24.json`.

## Follow-up: research introduction and household camera correction

- Expanded the HumanWAM-Vanilla introduction into three consecutive parts: study protocol and architecture, data scaling with both attention configurations, and task/scene diversity. Figures are full-page 3,200-pixel renders from the latest `Ego_Centric_Data_Beats_Real_Robot_Pretraining_in_Embodied_Brain_Scaling 3/figs`; provenance is in `assets/figures/ego-study-v25/sources.json`. Robot-data efficiency remains available in a disclosure.
- Replaced the household third-person recording with `videos/长程任务/long1.mp4`. Its browser copy retains 3840 × 2160 resolution, using H.264/AAC and faststart. The project film is unchanged.
- Long-horizon pairs share playback, pause, restart and seeking controls. The shorter recording defines the common loop boundary; playback drift is corrected while playing. Household action landmarks match at equal source timestamps; the ego recording has an extra trailing segment.
- The final browser review was stopped at the user's request to publish immediately.
