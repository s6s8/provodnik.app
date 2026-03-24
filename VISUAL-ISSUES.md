1. The navbar sits in a solid white strip above the hero instead of floating over the hero image as a frosted glass bar. The top of the page composition does not match the reference screenshot.
2. Navbar styling is off: nav links render in `#0F172A` instead of the specified `#475569`, and the active underline reads as a light slate border instead of a teal active underline.
3. The hero background image/crop does not match the reference. The live page shows a dark mountain-above-clouds scene, while the target composition is a brighter shoreline/lake hero with hikers.
4. The hero reads too dark overall. The overlay treatment does not preserve the bright, airy look from the spec, so the headline loses contrast against the image.
5. Primary teal buttons use dark text instead of white. Verified on `Создать запрос` where the live button is `background-color: rgb(15, 118, 110)` with `color: rgb(15, 23, 42)`.
6. Section and card headings that should use Inter are rendering in `Cormorant Garamond`. Verified on `Биржа запросов`, `Готовые предложения`, `Популярные направления`, and `Как это работает`.
7. The featured destination title `Озеро Байкал` uses Inter instead of the serif display treatment from the spec/reference.
8. Multiple Russian copy blocks are corrupted placeholder/gibberish text instead of the designed copy. This affects at least the left gateway subtitle, right gateway subtitle, featured destination subtitle, trust card subtitles, and footer text/links.
9. Two overlapping avatar portraits in the request mini-cards are broken network images. `_next/image` requests for the Unsplash assets `photo-1438761681033` and `photo-1506794778202` returned `404`, so the avatar row renders as broken/tiny icons instead of portrait circles.
10. The request-card avatar chips are also undersized relative to the spec/reference, rendering at roughly `14px` wide instead of the intended `18px` overlapping circles.
11. The right gateway listings rail over-clips the third card into a very thin sliver with broken vertical content flow, instead of a clean partially visible card.
12. The gateway cards read as mostly solid white panels rather than visibly translucent frosted-glass cards, so they feel flatter than the target design.
13. The `Как это работает` section is too sparse compared with the reference: the steps sit as loose text on the page instead of the tighter card/pill presentation in the mock, and the connectors/arrows are barely visible.
14. The footer structure is present, but its copy is still wrong and placeholder-like, so the section does not match the reference even though the layout shell exists.
