"""Generate the small WebP images the timeline loads instead of full-size art.

Portraits are drawn at 30-92px, so the timeline uses 192px thumbnails:
images/example.jpg becomes images/thumbs/example.webp, and
images/cartoons/example.png becomes images/thumbs/cartoons/example.webp.
Both Landscape and Bayeux tapestry atlases get full-size WebP copies beside
their PNG masters. Archived original panoramas retain their WebP copies.

Requires Python 3 and Pillow. Run from the repository root:

    python tools/generate-thumbnails.py

Only missing or outdated outputs are regenerated. The originals are kept as
masters and as fallbacks if a thumbnail fails to load.
"""

import argparse
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
LEGACY_ATLASES = ('early-panorama.png', 'revolutions-panorama-v2.png', 'modern-panorama.png')


def tapestry_masters():
    folder = IMAGES / 'tapestry'
    return sorted({*(folder / name for name in LEGACY_ATLASES),
                   *folder.glob('landscape-b-*.png'), *folder.glob('bayeux-*.png'),
                   *folder.glob('scientific-borders-*.png')})


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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tapestry-only', action='store_true', help='Update both historical artwork sets without touching portraits')
    args = parser.parse_args()
    written = 0
    portrait_folders = () if args.tapestry_only else ((IMAGES, THUMBS), (IMAGES / 'cartoons', THUMBS / 'cartoons'))
    for folder, prefix in portrait_folders:
        for source in sorted(folder.iterdir()):
            if source.suffix.lower() not in PORTRAIT_SUFFIXES or source.name in SKIP:
                continue
            target = prefix / f'{source.stem}.webp'
            if is_stale(source, target):
                thumbnail(source, target)
                written += 1

    for source in tapestry_masters():
        target = source.with_suffix('.webp')
        if is_stale(source, target):
            with Image.open(source) as image:
                save_webp(image, target, quality=80)
            written += 1

    print(f'{written} image(s) written')


if __name__ == '__main__':
    main()
