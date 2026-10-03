# Robert Andrews Millikan

The discovery record already described Millikan's 1913 oil-drop result but had no scientist profile or publication links. The new `millikan` profile supplies a photographic portrait, a transparent Wry Engraver illustration, their 192px WebP timeline thumbnails, two original papers, and the discovery's bidirectional scientist link. The timeline anchor is the 1913 paper; the existing historical discovery date and charge trail are preserved.

## Verified sources

- [Nobel biography](https://www.nobelprize.org/prizes/physics/1923/millikan/biographical/) and [National Academy of Sciences memoir](https://www.nasonline.org/wp-content/uploads/2024/06/millikan-robert.pdf): identity, life dates, American nationality, and academic appointments. The affiliation list covers Oberlin, Columbia, Chicago and Caltech; it does not attempt to list every visit or honorary association.
- [Original 1913 journal record](https://journals.aps.org/pr/abstract/10.1103/PhysRev.2.109): *On the Elementary Electrical Charge and the Avogadro Constant*, Physical Review 2, 109–143.
- [Original 1916 journal record](https://journals.aps.org/pr/abstract/10.1103/PhysRev.7.355): *A Direct Photoelectric Determination of Planck's "h"*, Physical Review 7, 355–388.
- [Photograph provenance and rights](https://commons.wikimedia.org/wiki/File:Millikan.jpg): Nobel Foundation, 1923, marked public domain under PD-Sweden. The original 1692×2048 JPEG was cropped to a square and reduced to 640×640 for `images/millikan.jpg`.

## Illustration

Built-in image generation used the prepared photograph as the identity reference and `rutherford.png`, `bohr.png`, and `alfven.png` as style references. The original generated PNG is retained outside the repository. Its 1254×1254 output was normalized with the repository's approved deterministic finisher; it removed zero background pixels. The final `images/cartoons/millikan.png` passes the alpha and 1024×1024 validation.

Exact generation prompt:

```text
Use case: style-transfer. Asset type: Paper Trails circular timeline portrait. Image 1 is the identity reference of Robert Andrews Millikan, the American experimental physicist (1868–1953); images 2–4 are approved house-style examples, NOT identity references. Create ONE newly drawn 1024x1024 head-and-shoulders editorial caricature of Millikan. Recognition anchors: broad oval clean-shaven face with a rounded strong chin, neatly side-parted silver-grey hair and high forehead, slightly asymmetrical small knowing smile with soft direct eyes; retain his dark bow tie and early-1920s suit. Affectionate restrained humour only in the wry smile and modestly oversized bow tie; no additional prop. Wry Engraver house style: near-black charcoal-teal bold ink contours, simplified graphic shapes, modest 10% caricature, flat restrained colour with at most one shallow shadow, faint paper grain inside shapes. Natural light skin undertones, NOT yellow, bronze, orange or globally sepia. Centered bust with hair beginning at 8% from top and shoulders at bottom, all facial features inside central 76%, safe for 42px grayscale and 92px colour circular crops. Match the rutherford, bohr and alfven references in contour weight, silhouette and graphic simplicity. Background: genuine alpha transparency; empty pixels outside the bust; never draw or depict a checkerboard, transparency grid, studio backdrop, halo, or background colour. Output 1024x1024 PNG with real alpha. No captions, labels, text, equations, logos, watermarks, floating apparatus or full-body pose. Do not colourise the photo or add photographic skin texture.
```
