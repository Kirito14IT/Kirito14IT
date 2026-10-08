"""Encode the generated frames into looping, palette-stable GitHub animations."""

from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parent.parent


def encode(kind, filename):
    paths = sorted((ROOT / "output" / "profile" / kind).glob("*.png"))
    if len(paths) != 80:
        raise ValueError(f"Expected 80 {kind} frames, found {len(paths)}")
    frames = [Image.open(path).convert("RGB") for path in paths]
    width, height = frames[0].size

    # A shared palette prevents colors from flickering between GIF frames.
    contact = Image.new("RGB", (width, height * 4))
    for i, index in enumerate((0, 20, 40, 60)):
        contact.paste(frames[index], (0, height * i))
    palette = contact.quantize(colors=232, method=Image.Quantize.MEDIANCUT)
    # Reserve highlights so the large dark background cannot desaturate neon trails.
    neon = [(0, 240, 255), (168, 121, 255), (255, 77, 166), (255, 179, 71), (87, 155, 255)]
    highlights = [tuple(round(c * strength) for c in color)
                  for strength in (0.45, 0.7, 1.0) for color in neon]
    highlights += [(244, 241, 255), (152, 234, 255), (192, 250, 255),
                   (182, 187, 218), (214, 202, 255), (8, 11, 25),
                   (22, 11, 39), (7, 30, 43), (16, 14, 37)]
    palette.putpalette(palette.getpalette()[:232 * 3] + [c for color in highlights for c in color])
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]

    target = ROOT / "assets" / filename
    indexed[0].save(
        target,
        save_all=True,
        append_images=indexed[1:],
        duration=100,
        loop=0,
        optimize=True,
        disposal=1,
    )

    with Image.open(target) as animation:
        assert animation.n_frames == 80
        assert animation.info["loop"] == 0
        animation.seek(40)
        halfway = animation.convert("RGB")
        animation.seek(0)
        start = animation.convert("RGB")
        assert ImageChops.difference(start, halfway).getbbox(), "Animation is static"

    seam = sum(ImageStat.Stat(ImageChops.difference(frames[0], frames[-1])).mean) / 3
    step = sum(ImageStat.Stat(ImageChops.difference(frames[0], frames[1])).mean) / 3
    assert seam < step * 2, "Loop has a discontinuous seam"
    assert target.stat().st_size < 5_000_000, "Animation exceeds the image size budget"
    print(f"{filename}: {width}x{height}, 80 frames, 8s loop, {target.stat().st_size:,} bytes")
    print(f"Loop seam / first step: {seam:.4f} / {step:.4f}")


if __name__ == "__main__":
    encode("header", "research-orbit-neon.gif")
    encode("footer", "signal-flow-neon.gif")
