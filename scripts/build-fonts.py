"""Builds src/fonts/metronome-engraved.woff2 from Bravura (SIL OFL 1.1, Steinberg).

The app sets its tempo and time signature in engraved music numerals. This keeps only the glyphs
it uses from Bravura: the SMuFL time-signature digits (U+E080-E089, also mapped to ASCII 0-9 so
the page text stays plain digits) and the metronome-mark notes (U+ECA5 quarter, U+ECA7 eighth,
U+ECB7 dot). Bravura centres the digits on a staff line; here they are raised to sit on the
baseline and given one width (tabular, so the tempo doesn't shift as it changes), and the
music-sized vertical metrics are replaced with text-like ones, so the font lays out like ordinary
text in CSS.

Bravura's Reserved Font Name means a modified version must not be called "Bravura", so the subset
is renamed "Metronome Engraved". Its licence is in src/fonts/LICENSE-Bravura.txt.

Usage (needs fonttools and brotli):
    python3 scripts/build-fonts.py path/to/Bravura.woff2
Bravura: https://github.com/steinbergmedia/bravura (redist/woff/Bravura.woff2)
"""

import sys
from pathlib import Path

from fontTools import subset
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FAMILY = 'Metronome Engraved'
OUT = Path(__file__).resolve().parent.parent / 'src' / 'fonts' / 'metronome-engraved.woff2'

TIME_SIG_DIGITS = [0xE080 + i for i in range(10)]
# Bravura's digits span -250..250 (centred on the staff line); this puts them on 0..500.
STAFF_TO_BASELINE = 250
METRONOME_MARKS = [0xECA5, 0xECA7, 0xECB7]


def retune_digits(font: TTFont, names: list[str]) -> None:
    """Raise the digits from the staff line onto the baseline and centre each in one width."""
    top = font['CFF '].cff.topDictIndex[0]
    char_strings = top.CharStrings
    glyph_set = font.getGlyphSet()
    width = max(font['hmtx'][name][0] for name in names)
    rebuilt = {}
    for name in names:
        advance, lsb = font['hmtx'][name]
        dx = (width - advance) / 2
        private = char_strings[name].private
        pen = T2CharStringPen(width - private.nominalWidthX, glyph_set)
        glyph_set[name].draw(TransformPen(pen, (1, 0, 0, 1, dx, STAFF_TO_BASELINE)))
        rebuilt[name] = (pen.getCharString(private=private, globalSubrs=top.GlobalSubrs), int(lsb + dx + 0.5))
    for name, (char_string, lsb) in rebuilt.items():
        char_strings[name] = char_string
        font['hmtx'][name] = (width, lsb)


def main(source: str) -> None:
    font = TTFont(source)
    cmap = font.getBestCmap()
    glyphs = [cmap[cp] for cp in TIME_SIG_DIGITS + METRONOME_MARKS]

    options = subset.Options()
    options.layout_features = []
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options)
    subsetter.populate(glyphs=glyphs, unicodes=TIME_SIG_DIGITS + METRONOME_MARKS)
    subsetter.subset(font)

    retune_digits(font, [cmap[cp] for cp in TIME_SIG_DIGITS])

    # ASCII digits render as the engraved time-signature digits.
    for table in font['cmap'].tables:
        if table.isUnicode():
            for i in range(10):
                table.cmap[0x30 + i] = cmap[TIME_SIG_DIGITS[i]]

    # The digits now sit on the baseline and are 500 units (two staff spaces) tall.
    ascent, descent = 560, -60
    font['hhea'].ascent, font['hhea'].descent, font['hhea'].lineGap = ascent, descent, 0
    os2 = font['OS/2']
    os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap = ascent, descent, 0
    os2.usWinAscent, os2.usWinDescent = ascent, -descent
    os2.fsSelection |= 1 << 7  # USE_TYPO_METRICS

    name = font['name']
    for record in list(name.names):
        if record.nameID in (1, 4, 16, 21):
            name.setName(FAMILY, record.nameID, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 6:
            name.setName('MetronomeEngraved-Regular', 6, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 3:
            name.setName(f'{FAMILY} (subset of Bravura)', 3, record.platformID, record.platEncID, record.langID)
    name.setName(
        'Subset of Bravura by Steinberg Media Technologies GmbH, modified for the Metronome app '
        '(glyph subset, ASCII digit mapping, vertical metrics). Not the original Bravura.',
        5, 3, 1, 0x409,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(OUT)
    print(f'{OUT.relative_to(OUT.parents[2])}: {OUT.stat().st_size} bytes, {len(font.getGlyphOrder())} glyphs')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'Bravura.woff2')
