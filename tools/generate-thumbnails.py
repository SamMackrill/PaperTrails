"""Generate the small WebP images the timeline loads instead of full-size art.

Portraits are drawn at 30-92px, so the timeline uses 192px thumbnails:
images/example.jpg becomes images/thumbs/example.webp, and
images/cartoons/example.png becomes images/thumbs/cartoons/example.webp.
Tapestry panoramas get full-size WebP copies beside their PNG masters.

Requires Python 3 and Pillow. Run from the repository root:

    python tools/generate-thumbnails.py

Only missing or outdated outputs are regenerated. The originals are kept as
masters and as fallbacks if a thumbnail fails to load.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / 'images'
THUMBS = IMAGES / 'thumbs'
THUMB_SIZE = 192
PORTRAIT_SUFFIXES = {'.jpg', '.jpeg', '.png', '.webp'}
SKIP = {'icon.png', 'brand-mark.png'}
# The panoramas the timeline draws. Other PNGs in images/tapestry are kept
# only as provenance sources (see images/tapestry/README.md).
TAPESTRY_ATLASES = ('early-panorama.png', 'revolutions-panorama-v2.png', 'modern-panorama.png')


def is_stale(source, target):
    return not target.exists() or target.stat().st_mtime < source.stat().st_mtime


def save_webp(image, target, quality):
    target.parent.mkdir(parents=True, exist_ok=True)
    if image.mode not in ('RGB', 'RGBA'):
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
    image.save(target, 'WEBP', quality=quality, method=6)


def thumbnail(source, target):
    with Image.open(source) as image:
        image.thumbnail((THUMB_SIZE, THUMB_SIZE), Image.Resampling.LANCZOS)
        save_webp(image, target, quality=82)


def main():
    written = 0
    for folder, prefix in ((IMAGES, THUMBS), (IMAGES / 'cartoons', THUMBS / 'cartoons')):
        for source in sorted(folder.iterdir()):
            if source.suffix.lower() not in PORTRAIT_SUFFIXES or source.name in SKIP:
                continue
            target = prefix / f'{source.stem}.webp'
            if is_stale(source, target):
                thumbnail(source, target)
                written += 1

    for name in TAPESTRY_ATLASES:
        source = IMAGES / 'tapestry' / name
        target = source.with_suffix('.webp')
        if is_stale(source, target):
            with Image.open(source) as image:
                save_webp(image, target, quality=80)
            written += 1

    print(f'{written} image(s) written')


if __name__ == '__main__':
    main()
