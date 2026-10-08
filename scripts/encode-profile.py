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
    palette = contact.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
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
    encode("header", "research-orbit.gif")
    encode("footer", "signal-flow.gif")
