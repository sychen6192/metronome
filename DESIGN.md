---
name: 節拍器 Metronome
description: The bar drawn as a conductor's beat pattern on a music-room chalkboard; tempo set as a score prints it.
colors:
  slate: "#172036"
  slate-raised: "#1d2742"
  slate-deep: "#111a2d"
  chalk: "#eceff6"
  chalk-soft: "#b4bdd2"
  chalk-faint: "#8792ad"
  slate-rule: "#33405f"
  chalk-path: "rgb(236 239 246 / 0.6)"
  baton-yellow: "#fccf3f"
  coffee-yellow: "#ffdd00"
  paper: "#f3f5f9"
  paper-raised: "#e7ebf3"
  paper-deep: "#d9dfeb"
  navy-ink: "#172036"
  navy-ink-soft: "#44506c"
  navy-ink-faint: "#56617c"
  paper-rule: "#c6cddc"
  navy-path: "rgb(23 32 54 / 0.6)"
typography:
  display:
    fontFamily: "'Metronome Engraved', 'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "min(8rem, calc((100cqi - 2 * 52px - 16px) / 2.15))"
    lineHeight: 0.6
    fontFeature: "tnum"
  display-signature:
    fontFamily: "'Metronome Engraved', 'Old Standard TT', Georgia, serif"
    fontSize: "2.25rem"
    lineHeight: 0.56
  headline:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  headline-tempo-change:
    fontFamily: "'Metronome Score Italic', 'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 400
    lineHeight: 1.2
  title-numeral:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "lnum"
  title-numeral-crowded:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "lnum"
  display-signature-fallback:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.25rem"
    lineHeight: 1
  label-coffee:
    fontFamily: "'Metronome Coffee', cursive"
    fontSize: "1.5rem"
    lineHeight: 1
  label-score:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
  title-wordmark:
    fontFamily: "'Old Standard TT', 'Metronome Wordmark', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 700
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Metronome Sans TC', system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label-field:
    fontFamily: "'Metronome Sans TC', system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    fontFeature: "tnum"
  label-strong:
    fontFamily: "'Metronome Sans TC', system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
  label:
    fontFamily: "'Metronome Sans TC', system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  label-note:
    fontFamily: "'Metronome Sans TC', system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label-small:
    fontFamily: "'Metronome Sans TC', system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  weight: "7px"
  coffee: "8px"
  field: "10px"
  toast: "14px"
  panel: "20px"
  pill: "999px"
  round: "50%"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  gutter-wide: "48px"
components:
  button-start:
    backgroundColor: "{colors.baton-yellow}"
    textColor: "{colors.slate}"
    typography: "{typography.label-strong}"
    rounded: "{rounded.pill}"
    height: "64px"
    padding: "0 clamp(16px, 5.5cqi, 28px)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 clamp(8px, 3.3cqi, 14px)"
  button-secondary-stacked:
    rounded: "{rounded.panel}"
    height: "64px"
    padding: "0 10px"
  button-secondary-hover:
    backgroundColor: "{colors.slate-raised}"
  button-step:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.round}"
    size: "52px"
  button-step-meter:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.round}"
    size: "44px"
  beat-numeral:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
    typography: "{typography.title-numeral}"
    rounded: "{rounded.round}"
    size: "44px"
  beat-numeral-accent:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.baton-yellow}"
  beat-numeral-accent-active:
    backgroundColor: "{colors.baton-yellow}"
    textColor: "{colors.slate}"
  beat-numeral-active:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.slate}"
  segment:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-soft}"
    rounded: "{rounded.field}"
    height: "48px"
  segment-selected:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.slate}"
  switch:
    backgroundColor: "{colors.slate}"
    rounded: "{rounded.pill}"
    width: "52px"
    height: "32px"
  switch-on:
    backgroundColor: "{colors.chalk}"
  field:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.field}"
    height: "46px"
    padding: "0 12px"
  language-switch:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-soft}"
    rounded: "{rounded.pill}"
    height: "34px"
    padding: "0 10px"
  language-switch-current:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.slate}"
    rounded: "{rounded.pill}"
    height: "34px"
  settings-band:
    backgroundColor: "{colors.slate-raised}"
    padding: "8px 16px"
  settings-panel:
    backgroundColor: "{colors.slate-raised}"
    rounded: "{rounded.panel}"
    padding: "8px 32px 12px"
  toast:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.slate}"
    rounded: "{rounded.toast}"
    padding: "8px 8px 8px 16px"
---

# Design System: 節拍器 Metronome

## Overview

**Creative North Star: "The Conductor's Board"**

The bar is drawn the way a conductor draws it in a textbook: a beat-pattern figure (downbeat falling straight, the upbeat rising, side beats on the plane of beating) traced by a single yellow baton point that strikes each ictus on the click. The world is a music-room chalkboard: icon-navy slate owns the surface, strokes and numerals are chalk, and one yellow marks the baton and the accents. In light mode the same drawing becomes a conducting-textbook page: navy ink on cool paper, with yellow kept as a highlighter fill that always carries an ink edge.

Music notation is the type voice wherever the app speaks musically. The tempo is set as a score prints it, an Italian marking over an engraved metronome mark ("Allegro / ♩ = 120"); the meter is a real stacked time signature, captioning the figure between its own − and +; a tempo change from the speed trainer is written as a score writes one ("accel. → ♩ = 160"), in the score's italic; the app's own name is set in the score voice; the tempo slider is an engraved metronome scale whose thumb is the pendulum's sliding weight. Everything operational (labels, buttons, settings) is a quiet sans, bundled so every device sets it the same way, so the notation reads as the content and the chrome recedes.

Density is low and glance-first: the figure takes the upper half of the screen, the tempo mark sits at arm's-length size between large − and + discs, and Start is the one filled object in the transport. Settings sit beneath as a diagram's legend on a slightly raised slate and close the page; the instrument explains itself, not small print around it. Motion exists only to show time: the baton's travel, a held strike state, one ripple per beat. Nothing flashes. The figure itself is drawn as a pen draws it, light through each rebound and pressing into each ictus, with one arrowhead on each fall and a short printed bar where the baton strikes.

**Key Characteristics:**
- Navy slate (dark) or cool paper (light) surface, chalk/ink strokes, a single yellow.
- The beat-pattern figure is the hero and the accent control at once.
- Engraved Bravura-derived numerals and Old Standard TT (with its italic for tempo changes) for everything musical and for the wordmark; Metronome Sans TC (bundled Noto Sans TC) for chrome.
- Pen-weighted strokes, arrowheads and ictus bars hold their on-screen size at every figure size.
- Round and pill forms throughout; flat surfaces with one soft lift under Start.
- Strike states are held, not flashed; reduced motion keeps the information and drops the travel.

## Colors

A two-theme monochrome-navy system with exactly one chromatic accent, yellow, shared by both themes.

### Primary
- **Baton Yellow** (#fccf3f): The baton point, accent beats (on slate a ring and numeral at rest and a solid disc when struck; on paper the highlighter disc), the Start button, the ruler's sliding weight and the dashed outline of the trainer's target on slate, the accent ripple, text selection, the toast action and the Trainer-on tint (18% mixed into the ground). On slate it needs no edge (10.9:1); on paper it is 1.36:1, so every yellow shape there carries a navy edge or sits under navy text. Text on yellow is always slate navy.

### Neutral (dark: the slate)
- **Icon Navy Slate** (#172036): The page ground, taken from the app icon tile. Also the text colour on yellow and on chalk fills.
- **Raised Slate** (#1d2742): The settings band (legend panel from 900px) and hover fill for stage controls.
- **Deep Slate** (#111a2d): Hover fill for controls inside the raised settings panel.
- **Chalk** (#eceff6): Primary text, numerals, the caption time signature, ictus bars, the struck-beat fill, the struck accent's ring, selected segment, trainer switch (on) and current-language fill, the toast surface.
- **Soft Chalk** (#b4bdd2): Row labels, the tempo change's arrow and step rule, ruler markings, unselected segment icons, the language links, the select chevron.
- **Faint Chalk** (#8792ad): The accent hint, muted-beat numerals, subdivision ticks, ruler tick marks, the knob of the switch when off (5.2:1 on slate).
- **Slate Rule** (#33405f): Hairlines between legend rows, and the borders of step, secondary, segment, field and switch (off) controls. Decorative only.
- **Chalk Path** (chalk at 60%): The beat-pattern pen strokes and their arrowheads (one evenly filled path) and the ring of a normal beat numeral.

### Neutral (light: the textbook page)
- **Cool Paper** (#f3f5f9), **Raised Paper** (#e7ebf3), **Deep Paper** (#d9dfeb): the same three ground roles as the slate set.
- **Navy Ink** (#172036), **Soft Navy** (#44506c), **Faint Navy** (#56617c): the same three ink roles; Faint Navy stays at 5.2:1 or better on both papers.
- **Paper Rule** (#c6cddc) and **Navy Path** (navy at 60%): the rule and stroke roles.
- In light mode the baton is yellow with a navy ring, the focus ring is navy, and yellow shapes take a navy edge. An accent beat rests as the highlighter disc (yellow, 2px navy edge, navy numeral) and strikes navy with a yellow ring and a paper numeral.

### Named Rules
**The One Yellow Rule.** Yellow is the only hue. It marks the baton, accents and the single primary action; it never decorates, never tints a surface beyond the 18% pressed-toggle mix, and never appears as text on a light ground. The one exception is Buy Me a Coffee's own button at the foot of the settings band, in its brand yellow (#ffdd00) by the owner's choice: small, last, and never on the stage.

**The Ink-Edged Highlighter Rule.** On paper, yellow is a fill that always carries a navy edge (3px on the ruler weight, 2px on resting accent beats, a navy ring on the baton) or navy text inside it. Yellow alone never stands as a shape on the light ground.

**The Brightest Strike Rule.** A struck beat is the largest change on the board. On slate, yellow to chalk is only 1.3:1, so an accent rests as a 3px yellow ring around a yellow numeral on the ground and strikes solid yellow with a chalk ring and slate numeral (10.9:1); on paper it rests yellow and strikes navy. Crowded accents thin their edge to max(1.5px, edge − 1px).

**The Rule Is Not State Rule.** The rule colours (1.5:1 against their grounds) only separate and outline; no state is ever carried by a rule-coloured border alone. Selection and strike are fills (chalk/ink or yellow), muting is a dashed ring.

## Typography

**Display Font:** Metronome Engraved (a subset of Bravura: SMuFL time-signature digits mapped to ASCII 0-9, the metronome-mark note glyphs and the tuplet 3, U+E883), falling back to Old Standard TT and the serif stack
**Score Font:** Old Standard TT Bold (with Iowan Old Style, Palatino, Georgia)
**Wordmark Font:** Old Standard TT for Latin, with Metronome Wordmark for the Chinese of the score voice (a subset of Noto Serif TC Bold, SIL OFL 1.1, holding only 節拍器, the wordmark, and limited to it by `unicode-range`), then the score stack
**Italic Score Font:** Metronome Score Italic (a subset of Old Standard TT Italic 400, SIL OFL 1.1, holding only the letters of "accel." and "rit." and limited to them by `unicode-range`; built by `scripts/build-fonts.py --italic`), then the score stack
**Support Lettering:** Metronome Coffee (a subset of Cookie, SIL OFL 1.1, holding only the letters of "Buy me a coffee", renamed for Cookie's Reserved Font Name, limited by `unicode-range`; built by `scripts/build-fonts.py --coffee`): the lettering Buy Me a Coffee's own buttons use, for that button only.
**Body Font:** Metronome Sans TC (a bundled variable subset of Noto Sans TC 2.004, SIL OFL 1.1, wght 400-700, about 54 KB, holding only the characters the interface uses; built by `scripts/build-fonts.py`), leading `--sans` for Chinese and Latin alike so every device sets the interface the same way; then system-ui, -apple-system, Segoe UI, PingFang TC, Noto Sans TC, Microsoft JhengHei. ± is deliberately left out of the subset (the font has only a full-width form, and it always sits beside Latin digits) so it falls through to the system face; the minus sign (U+2212), which the trainer's step rule writes, is in it. Weights in use: 400, 500, 600, 650, 700.

**Character:** Engraved music numerals and a Didone-flavoured score serif carry every musical value; a neutral sans carries every instruction, so the two never compete.

### Hierarchy
- **Display, metronome mark** (engraved, up to 8rem, fitted to the space between − and + via container units; line-height 0.6; tabular digits): the BPM only. The quarter-note glyph sits at 0.5em and the "=" (Old Standard, 0.34em) is raised to the middle of the digits.
- **Display, time signature** (engraved, 2.25rem, line-height 0.56, chalk): the stacked meter that opens the figure's caption; it is the metre control's value, between its 44px − and + discs.
- **Headline, tempo marking** (Old Standard 700, 1.375rem, 1.2, +0.01em, never wrapping): the Italian marking above the mark.
- **Headline, tempo change** (Metronome Score Italic 400 at the marking's 1.375rem): "accel." or "rit." in place of the marking while the speed trainer is heading somewhere, then a soft-chalk sans arrow at 0.75em, a miniature engraved metronome mark (note, "=" and target at 1.4em) and the step rule in label small.
- **Title, beat numerals** (Old Standard 700, 1.25rem, lining figures): the numerals on the figure.
- **Title, crowded numerals** (Old Standard 700, 0.875rem, lining figures): beat numerals in bars of more than 8 beats, sitting on their ictus.
- **Display, signature fallback** (Old Standard, 1.25rem, line-height 1): the time signature as plain digits when the engraved face is unavailable.
- **Label, coffee** (Metronome Coffee, 1.5rem, line-height 1): "Buy me a coffee" on the support button, in both languages, as Buy Me a Coffee prints it.
- **Label, score** (Old Standard 700, 0.8125rem): Italian markings engraved on the ruler.
- **Title, wordmark** (Old Standard / Metronome Wordmark 700, 1.125rem, +0.02em): the app name beside the icon, in the score voice like the tempo marking.
- **Body** (sans 400, 1rem, 1.5): base text; long notes cap at 60ch.
- **Label field** (sans 400, 1.0625rem, tabular figures): values typed into the trainer's number fields.
- **Label strong** (sans 700, 1.125rem): the Start / Stop label only.
- **Label** (sans 600, 0.9375rem): row labels and secondary buttons.
- **Label note** (sans, 0.875rem): the trainer note paragraph, the Install text-button label.
- **Label small** (sans, 0.8125rem, balanced wrapping): the accent hint beside the caption's metre (Chinese breaking only at punctuation and arrows), the language switch (at 650), the trainer's step rule ("每 4 小節 +5", "+5 every 4 bars"), trainer field labels, and the stacked secondary labels in a narrow transport.

### Named Rules
**The Notation Voice Rule.** Any musical quantity (tempo, meter, beat number, tuplet number, tempo marking, tempo change) and the app's wordmark are set in the engraved face or the score serif; any instruction or setting name is set in the sans. Never swap them.

**The Proportional English Rule.** The interface face's quotes and ellipsis are full-width, for Chinese; English text takes their proportional forms through `:lang(en) { font-variant-east-asian: proportional-width }`. Every English run carries `lang="en"`.

**The Engraved Fallback Rule.** If the engraved face fails to load (detected through `document.fonts.load`, e.g. iOS Lockdown Mode), the root takes a `no-engraved` class: the note and "=" are hidden, the BPM drops to plain numerals at up to 5rem with line-height 1, the time signature takes its fallback size, and the subdivision icons' tuplet 3 becomes a plain Old Standard digit. The tight engraved metrics are never applied to a substitute face.

## Layout

A single column, centred, max 1080px wide with 16px side padding (32px from 900px). The playing stage comes first and fills the first viewport. Each stage size names a reserve (the height the header and everything below the figure need) and a figure minimum, and the pattern figure (aspect 20:13) is sized `min(100%, clamp(figure-min, (100svh - reserve) * 20/13, 720px))`: by default a 476px reserve and a 320px minimum. Below the figure come its caption row 20px down ("− 4/4 +", the metre control, then the hint), the tempo block (max 440px, a three-column grid of − / mark / + with the marking row spanning all three columns), the ruler, and the transport (a 1fr / auto / 1fr grid with Start centred between Tap and Trainer; a size container, so its buttons size from its own width). From 900px the stage narrows to 760px and the settings become a two-column legend panel (48px column gap): subdivision, sound and volume take the left column, and the trainer spans the right column for those three rows, its bottom rule level with the volume row's; the support line spans both beneath.

Spacing runs on a 4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48, with 14px as the stage's internal gap and 8px inside the metre control. Legend rows are at least 64px tall with a hairline beneath: subdivision, sound, volume, then the trainer group, then the support line, which is last and has no rule; the band's own edge closes it.

Responsive steps: at 400px and below the install button drops its label to icon-only; when the transport is 348px wide or less the secondary buttons stack icon over label at Start's 64px height; at 360px and below the header tightens (wordmark 1rem, gaps 8px and 4px), legend rows stack label over control, the step discs shrink to 46px and the trainer fields go single-column.

Short screens (max-height 700px): the header drops to 52px, the reserve to 348px and the figure minimum to 288px, the stage gap to 8px and the figure's top margin to 4px; the BPM caps at 72px; the ruler keeps its ticks but drops its Italian markings and flags (padding 0), since the marking above already names the tempo; the transport loses its top margin.

A phone on its side (landscape, max-height 600px, min-width 600px): two columns, 24px apart. The figure spans every row on the left; the tempo, ruler and transport are grouped and centred on the right (rows 1fr auto auto auto 1fr). Safe-area insets pad the body and the toast.

## Elevation & Depth

Flat by default. Depth comes from tonal grounds (slate, raised slate for the legend panel, deep slate for hovers inside it; the same three papers in light) rather than shadows. Exactly one control is lifted: Start, so the primary action reads as a physical object above the board. The toast floats above content with a larger ambient shadow. Forced-colours mode removes both shadows and gives Start a 2px border instead.

### Shadow Vocabulary
- **Start lift** (`box-shadow: 0 6px 18px rgb(0 0 0 / 0.22)`, pressing to `0 2px 8px rgb(0 0 0 / 0.2)`): the Start/Stop button only.
- **Floating toast** (`box-shadow: 0 10px 30px rgb(0 0 0 / 0.3)`): transient status messages over the header row (under the language switch from 900px).

### Named Rules
**The One Lifted Object Rule.** Only the primary action casts a shadow on the board; everything else is drawn on it.

## Shapes

Circles and pills. Beat numerals, step (−/+) buttons, the baton and slider thumbs are true circles; Start, secondary buttons, the language links and the volume track are full pills (999px), as is the trainer switch's 52×32 track around its 21px round knob; in a narrow transport the stacked secondary buttons become 20px rounded panels. Rectangular containers use gently rounded corners: 10px for segments, the select, number fields and toast buttons; 14px for the toast; 20px for the wide-screen legend panel, the text button and the stacked secondary buttons. The ruler's sliding weight is the one rounded rectangle (7px), a deliberate pendulum-weight silhouette; the trainer's target repeats it as a 2px dashed outline. Borders are 1.5px for controls, 2px for beat rings (1.5px when crowded), 3px for resting accent rings on slate (2px on paper; one less when crowded, never under 1.5px), 1px for hairlines. The figure's pen strokes are filled outlines with round ends that swell from 1.5px to 3.4px (4.8px into the downbeat); ictus marks are 3px round-capped bars; arrowheads are plain filled triangles. Line icons are 24-unit SVG strokes at 2px with round caps and joins, drawn at 18-24px.

## Components

### Buttons
Few, large, round and forgiving.
- **Start / Stop:** Baton Yellow pill, 64px tall, min-width `min(148px, 35cqi)` of the transport, slate text in label strong with a filled 24px play triangle or rounded stop square. Carries the Start lift; presses to scale 0.97 with the reduced shadow (100ms ease-out).
- **Secondary (Tap, Trainer):** transparent 52px full pill, min-width `min(92px, 26cqi)`, with a 1.5px rule border, chalk text at 0.9375rem 600 and a 20px line icon. Hover fills raised slate; press scales to 0.97. Trainer on: yellow edge and an 18% yellow tint. Tap also pulses 0.94 to 1 over 120ms when tapped. Trainer is labelled 加速 / Trainer. When the transport is 348px wide or less the icon stacks over a label-small label at Start's 64px height with a 20px radius.
- **Step (− / +):** 52px circle with a 1.5px rule border and a 22px line glyph; 44px in the caption's metre control, 46px beside the tempo at 360px and below. Hover fills raised slate; press scales to 0.94 with the raised fill. Supports hold-to-repeat.
- **Text button (Install):** 44px tall, 20px radius, soft chalk 0.875rem 600 with an 18px icon; icon-only at 400px and below.
- **Disabled:** 38% opacity, default cursor.
- **Keyboard:** shortcuts are never printed on the page. The buttons declare them through `aria-keyshortcuts` (Start: Space; Tap: T; − / +: ArrowDown / ArrowUp, ±10 with Shift), and the tooltips of Start, Tap and − / + name them. Space presses a control the user reached with the keyboard (Tab or arrows, tracked by input modality; focus returning after leaving the window doesn't count); anywhere else it starts and stops playback. T taps unless a keyboard-reached control other than Tap has focus.

### Chips / Segmented control
- **Language switch:** a 1px-ruled pill holding two 34px link pills (`<a>`, one URL per language: `/` and `/en/`), each reaching 44px tall to the touch beyond its pill, label small at 650 in soft chalk, no underline. The current page's pill (`aria-current="page"`) fills chalk (ink in light) with ground-coloured text. It navigates; it is not a toggle.
- **Subdivision segments:** five equal 48px cells, 10px radius, 1.5px rule border, each holding a drawn SVG note group (quarter, beamed eighths, triplet, sixteenths, swing); the triplet and swing groups carry Bravura's engraved tuplet 3. Selected fills chalk with ground-coloured notes; native radio inputs sit invisibly on top.

### Cards / Containers
- **Settings legend:** raised slate (raised paper) band; full-bleed with 8px 16px padding on narrow screens, a panel with 20px radius and 8px 32px 12px padding from 900px. No shadow. Rows separated by 1px rules, in order: subdivision, sound, volume, the speed trainer group, and the support line, which is last and has none, since the band's edge closes it.
- **Speed trainer group:** a header row with the label (加速練習 / Speed trainer) and its switch at the right, then the three number fields (step, every N bars, target) and a note in label note saying that Stop returns to the starting tempo. From 900px it is the legend's right column.

### Inputs / Fields
- **Select and number fields:** 46px tall, 1.5px rule border, 10px radius, ground-coloured fill (so they read as cut into the raised panel); the select draws its chevron with two gradients in soft chalk. Number fields use tabular figures at 1.0625rem.
- **Trainer switch** (`role="switch"`, one setting with the transport's Trainer button): a 52×32 pill track with a 1.5px border and a 21px round knob, 44px tall to the touch. Off: rule border, ground fill, faint knob at the left. On: chalk (ink on paper) fill and border with a ground-coloured knob at the right, like a selected segment; fill and knob move over 160ms ease-out. The fill, not the rule, carries the state.
- **Volume slider:** 44px tall; 4px pill track filled chalk up to the thumb, rule beyond; 22px chalk thumb with a 3px ground-coloured ring.
- **Tempo ruler:** an engraved scale, not a track: a tick every 20 BPM over a 1px baseline, Italian markings (Old Standard 700) alternating above and below on hairline flags so neighbours never collide, and a 26×30px Baton Yellow weight with a 3px ground (dark) or navy (light) edge. While the speed trainer is heading somewhere, its target is pencilled on the scale as the weight's outline, 2px dashed in the yellow edge colour (yellow on slate, navy on paper), under the slider so the weight slides over it as the run arrives. Short screens drop the markings and keep the ticks.
- **Focus:** a 2px outline in the focus colour (yellow on slate, navy on paper) at 3px offset (2px on segments and slider thumbs). Inside the chalk toast the ring turns ground-coloured.

### Navigation
- **Top bar:** 60px minimum (52px on short screens), the 28px app icon beside the wordmark (title-wordmark), the install button and language switch at the right; at 360px and below the wordmark drops to 1rem and the gaps to 8px and 4px so it holds one row.

### Beat-Pattern Figure (signature)
The conductor's diagram for 1 to 16 beats, drawn in a fixed 400×260 SVG box that scales with the figure. Pen widths, arrowheads, ictus marks and the baton are computed in screen px, so they keep their size at every figure size.
- **Path:** the downbeat falls vertically to the bottom centre, the last beat rises to the upbeat, side beats step out along the plane, lifting into two or three tiers when a side has three or more beats.
- **Pen strokes:** each segment is a filled outline in chalk path, all in one path wound the same way so overlapping 60% ink stays even. Width runs 1.5px through the rebound and presses to 3.4px into each ictus (4.8px on the fall into the downbeat), a smoothstep from u = 0.3 along the segment.
- **Arrowheads:** at most one per stroke, on the fall, placed from the top of the rebound at the first spot clear of the numerals (at struck size), the struck ictus bars, the ticks, the resting baton and the other strokes. Half-width max(4px, 1.4 × local pen width), length max(10px, 2.2 × half-width), in the same fill as the strokes. Crowded bars (9+ beats) carry none; the numerals' order gives the direction.
- **Ictus:** printed 16px bars, 3px with round caps, in chalk (ink in light), centred on the ictus; the upbeat's bar runs left from its ictus, away from the numeral beside it. The struck bar widens 1.5× horizontally (160ms ease-out). Subdivision ticks are 3.2-unit faint-chalk dots at 35% opacity that brighten to full and fade back over 180ms on each sub-click.
- **Beat numerals = accent buttons:** 44px circles 38 units below each ictus (beside it for the upbeat; 30px with crowded numerals, on the ictus above 8 beats, with hit areas 44px wide and as tall as the tiers allow, min(44px, 44 drawing units × scale), from the `--unit` the figure sets). Normal: chalk-path ring on ground. Accent: on slate a 3px yellow ring around a yellow numeral on the ground; on paper the highlighter disc. Mute: dashed ring, faint numeral. Struck: solid chalk fill with ground numeral at scale 1.14, landing instantly and held until the next beat; a struck accent turns solid yellow with a chalk ring and slate numeral on slate, navy with a yellow ring on paper; struck mute is a 14% chalk tint with soft-chalk ring. On release the numeral's colour swaps 55ms into the fill's 160ms release (`color 0s 55ms`), so it never matches its fill. Hover sharpens the ring to chalk. Tapping cycles accent → normal → mute.
- **Baton:** a filled circle 12-16px in radius on screen (figure width / 30), yellow with a 4px slate ring on slate, yellow with a navy ring on paper. It travels each segment with the velocity profile `t + 0.72/(2π)·sin(2πt)`: fastest into the ictus, slowest at the rebound top, as a conductor's hand moves. Stopped, it rests raised above the downbeat.
- **Ripple:** one ring per strike, expanding from 0.5 to 1.5 (accent 1.9, 3px yellow) and fading over 420ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Muted beats get none.
- **Caption:** a centred row 20px below the figure, captioned as a textbook captions its diagram: the metre control ("− 4/4 +": 44px step discs either side of the engraved time signature, 8px apart; the only place the beat count is set), a 12px gap, then the accent hint in label small (faint chalk, balanced wrapping, Chinese breaking only at punctuation and arrows). The hint is for the first visit: it retires for good after the first accent change (remembered in storage), leaving the metre alone.

**The Pen Rule.** The pattern is drawn, not stroked: light on the rebound, heavy into the ictus, heaviest into the downbeat, at fixed screen widths. Never draw it as a uniform line.

**The Clear Arrow Rule.** An arrowhead appears only where it is clear of every numeral, mark, tick, the baton and the other strokes; where nothing is clear, the stroke goes without. Better no arrow than one hidden or misread.

### Tempo Mark (signature)
"Marking over ♩ = BPM" between the step discs; the marking row spans all three columns and never wraps. The engraved BPM scales with its container to fill the space between − and + up to 8rem (72px on short screens), with tabular digits so the width holds as the tempo changes. While the speed trainer is on and its target differs from the tempo, the marking gives way to the tempo change, "accel. → ♩ = 160" plus the step rule ("每 4 小節 +5", "+5 every 4 bars"); when the trainer is off or the target is reached, the marking returns. Stop returns to the tempo the run started from, and only that tempo is stored; a tempo set by hand mid-run becomes the start, and switching off mid-run keeps the tempo reached.

### Support link
The settings band closes with Buy Me a Coffee's own button, centred and kept small: 40px tall (44px to the touch), 8px radius, its brand yellow (#ffdd00), its cup logo (Simple Icons, CC0) at 20px and "Buy me a coffee" in the Cookie lettering its buttons use (Metronome Coffee, 1.5rem), in slate navy. The same English button on both language pages, as the service prints it; hover darkens it slightly. It opens buymeacoffee.com in a new tab so playback carries on. Nothing else in the app asks for anything. A transparent 1px edge gives it an outline in forced colours.

### Toast
Chalk (ink in light) rounded box, 0.9375rem text, an optional yellow 44px action (its label never wraps) and a 44px close button, with the floating shadow. Every toast sits in one place, never over the instrument (not the figure, whose baton rests at its top, nor Start): under 900px over the header row (4px below the top plus the safe area), from 900px under the header at the right, beneath the language switch (placed from the header's measured height). Used for update-ready and install messages, the offer of the page in the other language (its text carries that language's `lang`; starting playback passes over it, as if closed), and on iPhone and iPad, where browsers have no install prompt, the Add to Home Screen steps behind the Install button, which stay until closed. It never interrupts playback. Messages wrap in balanced lines; Chinese breaks with `line-break: strict`, never before its punctuation. It carries `data-nosnippet` so status text never appears in a search result.

### Link-preview image
`public/og-image.png`, 1200×630, rendered from the running app by `scripts/generate-og-image.mjs` (dark theme, reduced motion): the icon with the bilingual name (節拍器 over a soft-chalk "Metronome"), the tempo mark set flush left beneath it, and the 4/4 pattern frozen on the downbeat strike (the struck accent 1 solid yellow), on the slate ground; the generator undoes the landscape stage placement, since the card is short and wide like a phone on its side. The card is laid out at 1/1.5 size and enlarged so pen strokes and ictus bars read at the ~500 px a preview is shown; the baton is shrunk to clear the lit 1. One image serves both languages, so it carries no sentences.

### Theme, motion and access modes
- **Light/dark:** follows `prefers-color-scheme`; both themes share every token role, and `theme-color` matches the ground.
- **Reduced motion:** all transitions off; the struck beat does not scale and the struck ictus bar does not widen; the baton jumps to each ictus instead of travelling; no ripple. The held strike fill still shows the beat.
- **Forced colours:** the pen strokes, arrowheads and ticks fill CanvasText and the ictus bars stroke it; the baton and ripples Highlight; normal beats get CanvasText rings, accent beats a CanvasText fill, struck beats a Highlight fill; the trainer's target outline is CanvasText; every control border becomes ButtonText; selected segment, Trainer-on, the switch when on (with a HighlightText knob; ButtonText border and knob when off) and the current language become Highlight fills, never outlines, so they cannot be mistaken for focus; slider thumbs become ButtonText on ButtonFace; Start loses its shadow for a 2px border.

## Do's and Don'ts

### Do:
- **Do** draw anything musical in notation: engraved numerals for tempo and meter, Old Standard TT for markings, beat numbers and the wordmark, drawn SVG notes with the engraved tuplet 3 for rhythmic values.
- **Do** keep Baton Yellow (#fccf3f) for the baton, accents and the single primary action, and give it a navy edge on paper.
- **Do** show beat state with held fills (chalk/ink for struck; for accent a yellow ring that strikes solid yellow on slate, a highlighter disc that strikes navy on paper; dashed ring for mute), landing at once and releasing with a 140-160ms ease-out, the numeral's colour swapping 55ms into the release.
- **Do** keep touch targets at 44px or larger (52px tempo discs, 44px metre discs, toast buttons, switch, language links and sliders, 64px Start) and let the figure, tempo mark and Start share the first viewport at every stage size, by its reserve and figure minimum.
- **Do** give every state a fill or border that survives forced colours, and keep selected states as fills distinct from the focus outline.
- **Do** draw the pattern with pen weight (1.5px rebound, 3.4px ictus, 4.8px downbeat) and printed 16px ictus bars, sized in screen px.
- **Do** degrade to plain numerals when the engraved face is unavailable rather than squeezing a fallback into engraved metrics.
- **Do** keep small text around the instrument minimal; small text that teaches retires once it has been used, and keyboard shortcuts live in `aria-keyshortcuts` and tooltips, not on the page.
- **Do** add any new interface character to the Metronome Sans TC subset (`scripts/build-fonts.py`), any new score-voice Chinese to Metronome Wordmark, and any new tempo-change letters to Metronome Score Italic, rather than letting it fall through to a system face.

### Don't:
- **Don't** flash, pulse or loop decoration on the beat; motion only shows the baton's travel and one ripple per strike, and none of it may delay the click.
- **Don't** introduce a second accent hue or tint surfaces with yellow.
- **Don't** add shadows to anything except Start and the toast.
- **Don't** set a toast over the figure or Start; it belongs over the header row, or under the language switch on wide screens.
- **Don't** fall back to the big-number-and-dot-row metronome layout; the beat pattern is the beat display.
- **Don't** use Unicode music symbols (♩ ♫ ♬) as UI text; they render inconsistently, so notes are engraved glyphs or drawn SVG.
- **Don't** carry state with a rule-coloured border alone.
