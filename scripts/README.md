# Profile animations

The profile uses original GIFs, with source assets stored in this repository. The published copies are hosted at `https://kirito14it.github.io/github-profile/` so GitHub's image proxy can serve them without a direct connection to raw.githubusercontent.com. No animation service or scheduled workflow is required.

To regenerate, install Node.js with `sharp` and Python with `Pillow`, then run from the repository root:

```sh
node scripts/render-profile.cjs
python scripts/encode-profile.py
```

The generator renders 80 frames at 1200 pixels wide. The encoder uses a shared palette, checks for visible motion and a smooth loop, and enforces a 5 MB budget per image. Intermediate PNGs in `output/` are ignored by Git.

`assets/research-orbit.svg` is an editable static vector version of the banner. Update the text and visual parameters in `scripts/render-profile.cjs` before regenerating the published GIFs.

After regeneration, copy both GIFs to `public/github-profile/` in the `Kirito14IT.github.io` repository and deploy that site.
