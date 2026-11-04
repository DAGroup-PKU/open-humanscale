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
