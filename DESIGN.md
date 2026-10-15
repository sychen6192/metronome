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
    fontSize: "3.4rem"
    lineHeight: 0.56
  headline:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
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
    fontSize: "1.5rem"
    lineHeight: 1
  label-score:
    fontFamily: "'Old Standard TT', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 650
    letterSpacing: "0.01em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label-strong:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
  label-note:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  label-small:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', 'PingFang TC', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
rounded:
  weight: "7px"
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
    padding: "0 clamp(16px, 5vw, 28px)"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "52px"
    padding: "0 clamp(8px, 3vw, 14px)"
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
  beat-numeral:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
    typography: "{typography.title-numeral}"
    rounded: "{rounded.round}"
    size: "44px"
  beat-numeral-accent:
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
  field:
    backgroundColor: "{colors.slate}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.field}"
    height: "46px"
    padding: "0 12px"
  language-switch-pressed:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.slate}"
    rounded: "{rounded.pill}"
    height: "34px"
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

Music notation is the type voice wherever the app speaks musically. The tempo is set as a score prints it, an Italian marking over an engraved metronome mark ("Allegro / ♩ = 120"); the meter is a real stacked time signature; the tempo slider is an engraved metronome scale whose thumb is the pendulum's sliding weight. Everything operational (labels, buttons, settings) is quiet system sans, so the notation reads as the content and the chrome recedes.

Density is low and glance-first: the figure takes the upper half of the screen, the tempo mark sits at arm's-length size between large − and + discs, and Start is the one filled object in the transport. Settings sit beneath as a diagram's legend on a slightly raised slate. Motion exists only to show time: the baton's travel, a held strike state, one ripple per beat. Nothing flashes.

**Key Characteristics:**
- Navy slate (dark) or cool paper (light) surface, chalk/ink strokes, a single yellow.
- The beat-pattern figure is the hero and the accent control at once.
- Engraved Bravura-derived numerals and Old Standard TT for everything musical; system sans for chrome.
- Round and pill forms throughout; flat surfaces with one soft lift under Start.
- Strike states are held, not flashed; reduced motion keeps the information and drops the travel.

## Colors

A two-theme monochrome-navy system with exactly one chromatic accent, yellow, shared by both themes.

### Primary
- **Baton Yellow** (#fccf3f): The baton point (dark), accent beat discs, the Start button, the ruler's sliding weight, the accent ripple, text selection, the toast action and the Trainer-on tint (18% mixed into the ground). On slate it needs no edge (10.9:1); on paper it is 1.36:1, so every yellow shape there carries a navy edge or sits under navy text. Text on yellow is always slate navy.

### Neutral (dark: the slate)
- **Icon Navy Slate** (#172036): The page ground, taken from the app icon tile. Also the text colour on yellow and on chalk fills.
- **Raised Slate** (#1d2742): The settings legend panel and hover fill for stage controls.
- **Deep Slate** (#111a2d): Hover fill for controls inside the raised settings panel.
- **Chalk** (#eceff6): Primary text, numerals, ictus dots, the struck-beat fill, selected segment and pressed language fill, the toast surface.
- **Soft Chalk** (#b4bdd2): Row labels, ruler markings, unselected segment icons, the language buttons, the select chevron.
- **Faint Chalk** (#8792ad): Hints, shortcut list, muted-beat numerals, subdivision ticks, ruler tick marks (5.2:1 on slate).
- **Slate Rule** (#33405f): Hairlines between legend rows and the borders of step, secondary, segment and field controls. Decorative only.
- **Chalk Path** (chalk at 60%): The drawn beat-pattern stroke and the ring of a normal beat numeral.

### Neutral (light: the textbook page)
- **Cool Paper** (#f3f5f9), **Raised Paper** (#e7ebf3), **Deep Paper** (#d9dfeb): the same three ground roles as the slate set.
- **Navy Ink** (#172036), **Soft Navy** (#44506c), **Faint Navy** (#56617c): the same three ink roles; Faint Navy stays at 5.2:1 or better on both papers.
- **Paper Rule** (#c6cddc) and **Navy Path** (navy at 60%): the rule and stroke roles.
- In light mode the baton is navy with a yellow ring, the focus ring is navy, and yellow shapes take a navy edge.

### Named Rules
**The One Yellow Rule.** Yellow is the only hue. It marks the baton, accents and the single primary action; it never decorates, never tints a surface beyond the 18% pressed-toggle mix, and never appears as text on a light ground.

**The Ink-Edged Highlighter Rule.** On paper, yellow is a fill that always carries a navy edge (3px on the ruler weight, 2px on accent beats, a ring on the baton) or navy text inside it. Yellow alone never stands as a shape on the light ground.

**The Rule Is Not State Rule.** The rule colours (1.5:1 against their grounds) only separate and outline; no state is ever carried by a rule-coloured border alone. Selection and strike are fills (chalk/ink or yellow), muting is a dashed ring.

## Typography

**Display Font:** Metronome Engraved (a subset of Bravura: SMuFL time-signature digits mapped to ASCII 0-9 and the metronome-mark note glyphs), falling back to Old Standard TT and the serif stack
**Score Font:** Old Standard TT Bold (with Iowan Old Style, Palatino, Georgia)
**Body Font:** system-ui with PingFang TC / Noto Sans TC / Microsoft JhengHei for Traditional Chinese

**Character:** Engraved music numerals and a Didone-flavoured score serif carry every musical value; a neutral system sans carries every instruction, so the two never compete.

### Hierarchy
- **Display, metronome mark** (engraved, up to 8rem, fitted to the space between − and + via container units; line-height 0.6; tabular digits): the BPM only. The quarter-note glyph sits at 0.5em and the "=" (Old Standard, 0.34em) is raised to the middle of the digits.
- **Display, time signature** (engraved, 3.4rem, line-height 0.56): the stacked meter in the legend.
- **Headline, tempo marking** (Old Standard 700, 1.375rem, 1.2, +0.01em): the Italian marking above the mark.
- **Title, beat numerals** (Old Standard 700, 1.25rem, lining figures): the numerals on the figure.
- **Title, crowded numerals** (Old Standard 700, 0.875rem, lining figures): beat numerals in bars of more than 8 beats, sitting on their ictus.
- **Display, signature fallback** (Old Standard, 1.5rem, line-height 1): the time signature as plain digits when the engraved face is unavailable.
- **Label, score** (Old Standard 700, 0.8125rem): Italian markings engraved on the ruler.
- **Title, brand** (sans 650, 1.0625rem, +0.01em): the app name beside the icon.
- **Body** (sans 400, 1rem, 1.5): base text; long notes cap at 60ch.
- **Label strong** (sans 700, 1.125rem): the Start / Stop label only.
- **Label** (sans 600, 0.9375rem): row labels and secondary buttons.
- **Label note** (sans, 0.875rem): trainer state, the trainer note paragraph, the Install text-button label.
- **Label small** (sans, 0.8125rem): the accent hint under the figure, language switch, trainer field labels, shortcuts, and the stacked secondary labels at 380px and below.

### Named Rules
**The Notation Voice Rule.** Any musical quantity (tempo, meter, beat number, tempo marking) is set in the engraved face or Old Standard; any instruction or setting name is set in system sans. Never swap them.

**The Engraved Fallback Rule.** If the engraved face fails to load (detected through `document.fonts.load`, e.g. iOS Lockdown Mode), the root takes a `no-engraved` class: the note and "=" are hidden, the BPM drops to plain numerals at up to 5rem with line-height 1, and the time signature takes the signature-fallback step. The tight engraved metrics are never applied to a substitute face.

## Layout

A single column, centred, max 1080px wide with 16px side padding (32px from 900px). The playing stage comes first and fills the first viewport: the pattern figure (aspect 20:13, sized `min(100%, clamp(320px, (100svh - 448px) * 20/13, 720px))` so the tempo, ruler and Start still fit beneath), then the tempo block (max 440px, a three-column grid of − / mark / +), the ruler, and the transport (a 1fr / auto / 1fr grid with Start centred between Tap and Trainer). From 900px the stage narrows to 760px and the settings become a two-column legend panel (48px column gap) with the trainer and shortcuts spanning both.

Spacing runs on a 4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48, with 14px as the stage's internal gap and the meter gap. Legend rows are at least 64px tall with a hairline beneath.

Responsive steps: at 400px and below the install button drops its label to icon-only; at 380px the secondary buttons stack icon over label at Start's 64px height; at 360px legend rows stack label over control, the step discs shrink to 46px and the trainer fields go single-column. Touch-only devices hide the keyboard-shortcut line. Safe-area insets pad the body and the toast.

## Elevation & Depth

Flat by default. Depth comes from tonal grounds (slate, raised slate for the legend panel, deep slate for hovers inside it; the same three papers in light) rather than shadows. Exactly one control is lifted: Start, so the primary action reads as a physical object above the board. The toast floats above content with a larger ambient shadow. Forced-colours mode removes both shadows and gives Start a 2px border instead.

### Shadow Vocabulary
- **Start lift** (`box-shadow: 0 6px 18px rgb(0 0 0 / 0.22)`, pressing to `0 2px 8px rgb(0 0 0 / 0.2)`): the Start/Stop button only.
- **Floating toast** (`box-shadow: 0 10px 30px rgb(0 0 0 / 0.3)`): transient status messages at the bottom of the screen.

### Named Rules
**The One Lifted Object Rule.** Only the primary action casts a shadow on the board; everything else is drawn on it.

## Shapes

Circles and pills. Beat numerals, step (−/+) buttons, ictus dots, the baton and slider thumbs are true circles; Start, secondary buttons, the language switch and the volume track are full pills (999px); at 380px and below the stacked secondary buttons become 20px rounded panels. Rectangular containers use gently rounded corners: 10px for segments, the select, number fields and toast buttons; 14px for the toast; 20px for the wide-screen legend panel, the text button and the stacked secondary buttons. The ruler's sliding weight is the one rounded rectangle (7px), a deliberate pendulum-weight silhouette. Borders are 1.5px for controls, 2px for beat rings (1.5px when crowded), 1px for hairlines. Line icons are 24-unit SVG strokes at 2px with round caps and joins, drawn at 18-24px.

## Components

### Buttons
Few, large, round and forgiving.
- **Start / Stop:** Baton Yellow pill, 64px tall, min-width `min(148px, 32vw)`, slate text in label strong with a filled 24px play triangle or rounded stop square. Carries the Start lift; presses to scale 0.97 with the reduced shadow (100ms ease-out).
- **Secondary (Tap, Trainer):** transparent 52px full pill with a 1.5px rule border, chalk text at 0.9375rem 600 and a 20px line icon. Hover fills raised slate; press scales to 0.97. Trainer on: yellow edge and an 18% yellow tint. Tap also pulses 0.94 to 1 over 120ms when tapped. At 380px and below the icon stacks over a label-small label at Start's 64px height with a 20px radius.
- **Step (− / +):** 52px circle with a 1.5px rule border and a 22px line glyph; 44px inside the legend, 46px at 360px and below. Hover fills raised slate; press scales to 0.94 with the raised fill. Supports hold-to-repeat.
- **Text button (Install):** 40px tall, 20px radius, soft chalk 0.875rem 600 with an 18px icon; icon-only at 400px and below.
- **Disabled:** 38% opacity, default cursor.

### Chips / Segmented control
- **Language switch:** a 1px-ruled pill holding two 34px pills; the pressed language fills chalk (ink in light) with ground-coloured text.
- **Subdivision segments:** five equal 48px cells, 10px radius, 1.5px rule border, each holding a drawn SVG note group (quarter, beamed eighths, triplet, sixteenths, swing). Selected fills chalk with ground-coloured notes; native radio inputs sit invisibly on top.

### Cards / Containers
- **Settings legend:** raised slate (raised paper) panel; full-bleed on narrow screens, 20px radius and 8px 32px 12px padding from 900px. No shadow. Rows separated by 1px rules.

### Inputs / Fields
- **Select and number fields:** 46px tall, 1.5px rule border, 10px radius, ground-coloured fill (so they read as cut into the raised panel); the select draws its chevron with two gradients in soft chalk. Number fields use tabular figures at 1.0625rem.
- **Volume slider:** 4px pill track filled chalk up to the thumb, rule beyond; 22px chalk thumb with a 3px ground-coloured ring.
- **Tempo ruler:** an engraved scale, not a track: a tick every 20 BPM over a 1px baseline, Italian markings (Old Standard 700) alternating above and below on hairline flags so neighbours never collide, and a 26×30px Baton Yellow weight with a 3px ground (dark) or navy (light) edge.
- **Focus:** a 2px outline in the focus colour (yellow on slate, navy on paper) at 3px offset (2px on segments and slider thumbs). Inside the chalk toast the ring turns ground-coloured.

### Navigation
- **Top bar:** 60px minimum, the 28px app icon beside the name in sans 650, the install button and language switch at the right; wraps only on the narrowest screens.

### Beat-Pattern Figure (signature)
The conductor's diagram for 1 to 16 beats, drawn in a fixed 400×260 SVG box that scales with the figure. Strokes are non-scaling.
- **Path:** a 2.4px chalk-path stroke with round caps; the downbeat falls vertically to the bottom centre, the last beat rises to the upbeat, side beats step out along the plane, lifting into two or three tiers when a side has three or more beats.
- **Ictus:** 5-unit chalk dots; the struck one scales to 1.5 (160ms ease-out). Subdivision ticks are 3.2-unit faint-chalk dots at 35% opacity that brighten to full and fade back over 180ms on each sub-click.
- **Beat numerals = accent buttons:** 44px circles beside each ictus (30px with crowded numerals, on the ictus above 8 beats, with hit areas widened to 44px). Normal: chalk-path ring on ground. Accent: yellow disc (navy-edged on paper). Mute: dashed ring, faint numeral. Struck: solid chalk fill with ground numeral at scale 1.14, landing instantly and held until the next beat; struck accent keeps a yellow ring; struck mute is a 14% chalk tint with soft-chalk ring. Hover sharpens the ring to chalk. Tapping cycles accent → normal → mute.
- **Baton:** a filled circle 12-16px in radius on screen (figure width / 30), yellow with a 4px slate ring on slate, navy with a yellow ring on paper. It travels each segment with the velocity profile `t + 0.72/(2π)·sin(2πt)`: fastest into the ictus, slowest at the rebound top, as a conductor's hand moves. Stopped, it rests raised above the downbeat.
- **Ripple:** one ring per strike, expanding from 0.5 to 1.5 (accent 1.9, 3px yellow) and fading over 420ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Muted beats get none.

### Tempo Mark (signature)
"Marking over ♩ = BPM" between the step discs; the engraved BPM scales with its container to fill the space between − and + up to 8rem, with tabular digits so the width holds as the tempo changes.

### Toast
Chalk (ink in light) rounded box at the bottom centre, 0.9375rem text, an optional yellow 40px action and a 40px close button, with the floating shadow. Used for update-ready and install messages; it never interrupts playback.

### Theme, motion and access modes
- **Light/dark:** follows `prefers-color-scheme`; both themes share every token role, and `theme-color` matches the ground.
- **Reduced motion:** all transitions off; the struck beat and ictus do not scale; the baton jumps to each ictus instead of travelling; no ripple. The held strike fill still shows the beat.
- **Forced colours:** path, dots and ticks become CanvasText; the baton and ripples Highlight; normal beats get CanvasText rings, accent beats a CanvasText fill, struck beats a Highlight fill; every control border becomes ButtonText; selected segment, Trainer-on and pressed language become Highlight fills, never outlines, so they cannot be mistaken for focus; slider thumbs become ButtonText on ButtonFace; Start loses its shadow for a 2px border.

## Do's and Don'ts

### Do:
- **Do** draw anything musical in notation: engraved numerals for tempo and meter, Old Standard TT for markings and beat numbers, drawn SVG notes for rhythmic values.
- **Do** keep Baton Yellow (#fccf3f) for the baton, accents and the single primary action, and give it a navy edge on paper.
- **Do** show beat state with held fills (chalk/ink for struck, yellow for accent, dashed ring for mute), landing at once and releasing with a 140-160ms ease-out.
- **Do** keep touch targets at 44px or larger (52px step discs, 64px Start) and let the figure, tempo mark and Start share the first viewport.
- **Do** give every state a fill or border that survives forced colours, and keep selected states as fills distinct from the focus outline.
- **Do** degrade to plain numerals when the engraved face is unavailable rather than squeezing a fallback into engraved metrics.

### Don't:
- **Don't** flash, pulse or loop decoration on the beat; motion only shows the baton's travel and one ripple per strike, and none of it may delay the click.
- **Don't** introduce a second accent hue or tint surfaces with yellow.
- **Don't** add shadows to anything except Start and the toast.
- **Don't** fall back to the big-number-and-dot-row metronome layout; the beat pattern is the beat display.
- **Don't** use Unicode music symbols (♩ ♫ ♬) as UI text; they render inconsistently, so notes are engraved glyphs or drawn SVG.
- **Don't** carry state with a rule-coloured border alone.
