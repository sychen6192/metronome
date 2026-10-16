"""Builds the app's font subsets.

src/fonts/metronome-engraved.woff2, from Bravura (SIL OFL 1.1, Steinberg): the app sets its tempo,
time signature and tuplet numerals in engraved music type. This keeps only the glyphs it uses:
the SMuFL time-signature digits (U+E080-E089, also mapped to ASCII 0-9 so the page text stays
plain digits), the metronome-mark notes (U+ECA5 quarter, U+ECA7 eighth, U+ECB7 dot) and the
tuplet 3 (U+E883). Bravura centres the digits on a staff line; here they are raised to sit on the
baseline and given one width (tabular, so the tempo doesn't shift as it changes), and the
music-sized vertical metrics are replaced with text-like ones, so the font lays out like ordinary
text in CSS.

Bravura's Reserved Font Name means a modified version must not be called "Bravura", so the subset
is renamed "Metronome Engraved". Its licence is in src/fonts/LICENSE-Bravura.txt.

src/fonts/metronome-wordmark.woff2, from Noto Serif TC Bold (SIL OFL 1.1, Google / Adobe): only
the three glyphs of the Chinese app name, 節拍器, so the wordmark is set in a Ming serif that
matches the score face. Renamed "Metronome Wordmark"; licence in src/fonts/LICENSE-NotoSerifTC.txt.
The stylesheet's unicode-range for it lists the same characters (tests/fonts.test.ts checks them).

src/fonts/metronome-score-italic.woff2, from Old Standard TT Italic (SIL OFL 1.1, the Old Standard
Project Authors): only the letters of the tempo changes the speed trainer writes on the stage,
"accel." and "rit." (TEMPO_CHANGES in src/core/tempo.ts), set in the score's italic as a score sets
them. Renamed "Metronome Score Italic" like the other subsets; licence in
src/fonts/LICENSE-OldStandardTT.txt. The stylesheet's unicode-range for it lists the same characters
(tests/fonts.test.ts checks them).

src/fonts/metronome-coffee.woff2, from Cookie (SIL OFL 1.1, Ania Kruk): only the letters of "Buy me
a coffee", the support link's label, set in the face Buy Me a Coffee's own buttons use. Cookie's
Reserved Font Name means the subset is renamed "Metronome Coffee"; licence in
src/fonts/LICENSE-Cookie.txt. The stylesheet's unicode-range for it lists the same characters
(tests/fonts.test.ts checks them).

src/fonts/metronome-sans-tc.woff2, from Noto Sans TC (SIL OFL 1.1, Google / Adobe): the interface
text, Chinese and Latin, so it looks the same on every device instead of each system's own fonts.
A variable font kept to weights 400-700 (one file for every weight the stylesheet uses). Only the
characters the interface can show are kept: printable ASCII, plus every character of index.html and
the TypeScript sources (the strings live there) that is Latin-1, general punctuation, an arrow, the
minus sign, CJK or a full-width form, except ± (full-width only in this font; the next font in the
stack sets it).
They are listed in src/fonts/metronome-sans-tc.txt, which a test compares with the sources
(tests/fonts.test.ts). Renamed "Metronome Sans TC"; licence in
src/fonts/LICENSE-NotoSansTC.txt. Re-run after adding text with new characters.

Usage (needs fonttools and brotli; build what you pass):
    python3 scripts/build-fonts.py [--bravura Bravura.woff2] [--serif NOTO_SERIF_TC] [--sans NOTO_SANS_TC]
                                   [--italic OLD_STANDARD_ITALIC] [--coffee COOKIE]
Bravura: https://github.com/steinbergmedia/bravura (redist/woff/Bravura.woff2)
Old Standard TT Italic, from Google Fonts,
https://raw.githubusercontent.com/google/fonts/1d0e46c7933245c8180fe83e47917961c913bbdb/ofl/oldstandardtt/OldStandard-Italic.ttf
(sha256 4b9522f4711317fc06e2413a58b4662c249cb707df193d682b9d640e365ef564)
Cookie, from Google Fonts,
https://raw.githubusercontent.com/google/fonts/1d0e46c7933245c8180fe83e47917961c913bbdb/ofl/cookie/Cookie-Regular.ttf
(sha256 9daf3cc9e5efe1b65094cdf1f14729ef6f07a70c27ee0679bf7f544a828b080e)
Noto Serif TC: the variable font from Google Fonts, version 2.003 (instanced at weight 700),
https://raw.githubusercontent.com/google/fonts/1d0e46c7933245c8180fe83e47917961c913bbdb/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf
(sha256 0077e18f57c6908f4a000969880940bdb0dad057c0e8d98b49dc364c3d1b09c6)
Noto Sans TC: the variable font from Google Fonts, version 2.004,
https://raw.githubusercontent.com/google/fonts/1d0e46c7933245c8180fe83e47917961c913bbdb/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf
(sha256 864727d210d54f2537bbe23b3a839436c3992af72de9322af5270897246bd44f)
"""

import argparse
import sys
from pathlib import Path

from fontTools import subset
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FAMILY = 'Metronome Engraved'
ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / 'src' / 'fonts'
OUT = FONTS / 'metronome-engraved.woff2'
WORDMARK_FAMILY = 'Metronome Wordmark'
WORDMARK_OUT = FONTS / 'metronome-wordmark.woff2'
# The Chinese app name (zh-Hant appTitle in src/i18n.ts).
WORDMARK_TEXT = '節拍器'
WORDMARK_WEIGHT = 700
ITALIC_FAMILY = 'Metronome Score Italic'
ITALIC_OUT = FONTS / 'metronome-score-italic.woff2'
# The letters of "accel." and "rit." (TEMPO_CHANGES in src/core/tempo.ts).
ITALIC_TEXT = 'accel.rit'
COFFEE_FAMILY = 'Metronome Coffee'
COFFEE_OUT = FONTS / 'metronome-coffee.woff2'
# The support link's label (index.html).
COFFEE_TEXT = 'Buy me a coffee'
SANS_FAMILY = 'Metronome Sans TC'
SANS_OUT = FONTS / 'metronome-sans-tc.woff2'
SANS_CHARS = FONTS / 'metronome-sans-tc.txt'
# The weights the stylesheet uses (regular, semibold labels, bold headings), default first.
SANS_WEIGHTS = (400, 400, 700)
# Where the interface's text lives.
TEXT_SOURCES = ('index.html', 'src/**/*.ts')
# Ranges of the characters the interface font covers (tests/fonts.test.ts has the same list):
# printable ASCII, Latin-1, general punctuation, arrows, the minus sign, CJK punctuation, ideographs,
# full-width forms.
SANS_RANGES = ((0x20, 0x7E), (0xA0, 0xFF), (0x2000, 0x206F), (0x2190, 0x21FF), (0x2212, 0x2212),
               (0x3000, 0x303F), (0x3400, 0x9FFF), (0xFF00, 0xFFEF))
# Left to the next font in the stack: Noto Sans TC has only a full-width ± (no proportional form),
# and here it always sits next to Latin digits ("Shift ±10").
SANS_SKIP = '±'

TIME_SIG_DIGITS = [0xE080 + i for i in range(10)]
# Bravura's digits span -250..250 (centred on the staff line); this puts them on 0..500.
STAFF_TO_BASELINE = 250
METRONOME_MARKS = [0xECA5, 0xECA7, 0xECB7]
TUPLET_THREE = 0xE883


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
    codepoints = TIME_SIG_DIGITS + METRONOME_MARKS + [TUPLET_THREE]
    glyphs = [cmap[cp] for cp in codepoints]

    options = subset.Options()
    options.layout_features = []
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options)
    subsetter.populate(glyphs=glyphs, unicodes=codepoints)
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

    rename(font, FAMILY, 'MetronomeEngraved-Regular', 'Bravura by Steinberg Media Technologies GmbH',
           '(glyph subset, ASCII digit mapping, digits on the baseline at one width, vertical metrics). '
           'Not the original Bravura.')

    save(font, OUT)


def rename(font: TTFont, family: str, postscript: str, origin: str, changes: str) -> None:
    """A modified OFL font must not keep its Reserved Font Name: give the subset its own."""
    name = font['name']
    for record in list(name.names):
        if record.nameID in (1, 4, 16, 21):
            name.setName(family, record.nameID, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 6:
            name.setName(postscript, 6, record.platformID, record.platEncID, record.langID)
        elif record.nameID == 3:
            name.setName(f'{family} (subset)', 3, record.platformID, record.platEncID, record.langID)
    name.setName(f'Subset of {origin}, modified for the Metronome app {changes}', 5, 3, 1, 0x409)


def set_style(font: TTFont, style: str) -> None:
    """The style names of an instance (a variable source names its own default, e.g. Thin)."""
    name = font['name']
    for record in list(name.names):
        if record.nameID in (2, 17):
            name.setName(style, record.nameID, record.platformID, record.platEncID, record.langID)


def save(font: TTFont, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = 'woff2'
    font.save(out)
    print(f'{out.relative_to(out.parents[2])}: {out.stat().st_size} bytes, {len(font.getGlyphOrder())} glyphs')


def build_wordmark(source: str) -> None:
    font = TTFont(source)
    options = subset.Options()
    options.layout_features = []
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=WORDMARK_TEXT)
    subsetter.subset(font)
    missing = [c for c in WORDMARK_TEXT if ord(c) not in font.getBestCmap()]
    if missing:
        sys.exit(f'{source} lacks {"".join(missing)}')
    if 'fvar' in font:  # the variable source: keep the bold instance only
        font = instancer.instantiateVariableFont(font, {'wght': WORDMARK_WEIGHT})
        font['OS/2'].usWeightClass = WORDMARK_WEIGHT
    rename(font, WORDMARK_FAMILY, 'MetronomeWordmark-Bold', 'Noto Serif TC Bold by Google and Adobe',
           f'(only the glyphs of {WORDMARK_TEXT}). Not the original Noto Serif TC.')
    set_style(font, 'Bold')
    save(font, WORDMARK_OUT)


def build_italic(source: str) -> None:
    font = TTFont(source)
    missing = [c for c in ITALIC_TEXT if ord(c) not in font.getBestCmap()]
    if missing:
        sys.exit(f'{source} lacks {"".join(missing)}')
    options = subset.Options()
    options.layout_features = ['kern']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=ITALIC_TEXT)
    subsetter.subset(font)
    rename(font, ITALIC_FAMILY, 'MetronomeScoreItalic-Italic', 'Old Standard TT Italic by the Old Standard Project Authors',
           '(only the letters of accel. and rit.). Not the original Old Standard TT.')
    set_style(font, 'Italic')
    save(font, ITALIC_OUT)


def build_coffee(source: str) -> None:
    font = TTFont(source)
    missing = [c for c in COFFEE_TEXT if ord(c) not in font.getBestCmap()]
    if missing:
        sys.exit(f'{source} lacks {"".join(missing)}')
    options = subset.Options()
    options.layout_features = ['kern', 'liga', 'calt']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=COFFEE_TEXT)
    subsetter.subset(font)
    rename(font, COFFEE_FAMILY, 'MetronomeCoffee-Regular', 'Cookie by Ania Kruk',
           f'(only the letters of "{COFFEE_TEXT}"). Not the original Cookie.')
    set_style(font, 'Regular')
    save(font, COFFEE_OUT)


def in_sans(char: str) -> bool:
    code = ord(char)
    return char not in SANS_SKIP and any(low <= code <= high for low, high in SANS_RANGES)


def interface_text() -> str:
    chars = {chr(code) for code in range(0x20, 0x7F)}
    for pattern in TEXT_SOURCES:
        for path in sorted(ROOT.glob(pattern)):
            chars.update(c for c in path.read_text(encoding='utf-8') if in_sans(c))
    return ''.join(sorted(chars))


def build_sans(source: str) -> None:
    text = interface_text()
    font = TTFont(source)
    missing = [c for c in text if ord(c) not in font.getBestCmap()]
    if missing:
        sys.exit(f'{source} lacks {"".join(missing)}')
    options = subset.Options()
    # Kerning for the Latin text; halt, which Chrome's text-spacing-trim uses on CJK punctuation;
    # pwid, the proportional quotes and ellipsis the stylesheet turns on for English text (the
    # defaults are full-width, for Chinese).
    options.layout_features = ['ccmp', 'liga', 'kern', 'halt', 'pwid']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    low, default, high = SANS_WEIGHTS
    font = instancer.instantiateVariableFont(font, {'wght': (low, default, high)})
    font['OS/2'].usWeightClass = default
    set_style(font, 'Regular')
    rename(font, SANS_FAMILY, 'MetronomeSansTC-Regular', 'Noto Sans TC by Google and Adobe',
           f'(only the characters the interface uses, weights {low}-{high}). Not the original Noto Sans TC.')
    # The named instances keep their style names but not Noto's PostScript names.
    for instance in font['fvar'].instances:
        instance.postscriptNameID = 0xFFFF
    font['name'].removeUnusedNames(font)
    save(font, SANS_OUT)
    SANS_CHARS.write_text(text + '\n', encoding='utf-8')
    print(f'{SANS_CHARS.relative_to(ROOT)}: {len(text)} characters')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Build the font subsets in src/fonts.')
    parser.add_argument('--bravura', help='Bravura.woff2, for metronome-engraved.woff2')
    parser.add_argument('--serif', help='Noto Serif TC (variable, or a bold build), for metronome-wordmark.woff2')
    parser.add_argument('--sans', help='Noto Sans TC variable font, for metronome-sans-tc.woff2')
    parser.add_argument('--italic', help='Old Standard TT Italic, for metronome-score-italic.woff2')
    parser.add_argument('--coffee', help='Cookie, for metronome-coffee.woff2')
    args = parser.parse_args()
    if not (args.bravura or args.serif or args.sans or args.italic or args.coffee):
        parser.error('nothing to build: pass --bravura, --serif, --sans, --italic and/or --coffee')
    if args.bravura:
        main(args.bravura)
    if args.serif:
        build_wordmark(args.serif)
    if args.sans:
        build_sans(args.sans)
    if args.italic:
        build_italic(args.italic)
    if args.coffee:
        build_coffee(args.coffee)
