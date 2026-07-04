---
name: Academic Precision
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-xs:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system is engineered for the rigors of university research—balancing high-level academic professionalism with the effortless utility of modern enterprise tools. The aesthetic is **Academic Minimalism**: a fusion of Apple’s spatial clarity, Stripe’s vibrant precision, and Notion’s functional honesty.

The UI targets a highly focused user base (researchers, lab leads, and students) who require high information density without cognitive load. By utilizing generous whitespace and a "content-first" hierarchy, the system evokes a sense of calm, reliability, and technological sophistication. The emotional response is one of organized efficiency—transforming the administrative chore of time-tracking into a premium, tactile experience.

## Colors
The palette is rooted in a professional "Research Blue" that signals institutional trust. 

- **Primary (#2563EB):** Used for primary actions, active states, and brand presence.
- **Secondary (#0EA5E9):** Employed for supportive data visualizations and non-critical interactive elements.
- **Semantic Colors:** Emerald Green for successful time-log submissions and Rose Red for overtime alerts or deletion actions.
- **Surface Strategy:** The background utilizes a cool Slate 50 to reduce glare, while interactive cards and containers use pure White to "pop" via elevation.
- **Text:** Slate 900 ensures WCAG AAA compliance for maximum legibility in variable lighting conditions (labs, libraries, outdoors).

## Typography
The design system utilizes **Inter** for its exceptional legibility and systematic weight distribution. 

The type scale is optimized for Portuguese (Brazil), accounting for longer word lengths (e.g., "Pesquisadores" vs "Researchers") by maintaining generous line-heights. **Display** and **Headline** roles use tighter letter-spacing and heavier weights to create a structured "Editorial" feel. **Labels** are frequently set in medium weights with slight tracking to ensure they remain readable even at 10px on low-density mobile screens.

## Layout & Spacing
This system employs a **fluid 4-column grid** for mobile devices. 

- **Horizontal Rhythm:** A 20px safe area (margin) on both sides of the screen keeps content away from the bezel, providing a premium "airy" feel.
- **Vertical Rhythm:** An 8px baseline grid ensures consistent alignment between text and iconography.
- **Safe Areas:** Adhere strictly to iOS/Android system safe areas for bottom navigation and top status bars. 
- **Grouping:** Use `lg` (24px) spacing between distinct sections/categories and `sm` (12px) for elements within a single card or component.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Ambient Shadows**. This design system avoids harsh borders in favor of soft, diffused shadows that mimic natural light.

- **Level 0 (Background):** Slate 50. Flat.
- **Level 1 (Cards/Inputs):** White surface with a 1px border (#E2E8F0) and a subtle 4px blur shadow at 2% opacity.
- **Level 2 (Active/Floating):** White surface with an 8px blur shadow at 6% opacity. Used for snackbars and active buttons.
- **Glassmorphism:** Use a 20px backdrop blur with 80% opacity on the bottom navigation bar and top header to maintain context of the content scrolling beneath.

## Shapes
The shape language is "Hyper-Softened." 

Standard components (Cards, Input Fields) use a **16px radius** (`rounded-lg`), while larger containers or bottom sheets may go up to **24px**. This high corner radius contrasts with the professional typography to create a tool that feels modern and approachable rather than cold or "legacy enterprise." Small elements like Badges and Checkboxes utilize a **4px radius** to maintain crispness.

## Components

### Cards
Cards are the primary container. They feature a 1px Slate-200 border and the Level 1 shadow. Headers within cards should use `title-md` and have a consistent 16px internal padding.

### Buttons
- **Primary:** Solid #2563EB with white text. 12px vertical padding, 16px radius.
- **Ghost:** No background, #2563EB text. Used for secondary actions like "Cancelar".

### Inputs
Fields should have a height of 48px to be touch-friendly. Use a light Slate 100 background and a 1px border that turns Primary Blue on focus. Labels sit above the input in `label-sm`.

### Progress Bars
Used for tracking hours against a weekly goal. 8px height, rounded caps. Background is Slate 200, foreground is Secondary Sky Blue or Success Emerald depending on the context.

### Bottom Navigation
A minimalist bar with 4-5 items. Use **Outline Icons** (24px). The active state is indicated by the Primary Blue color and a small 4px dot below the icon. Use a frosted glass (backdrop-blur) effect.

### Avatars & Badges
Research lead avatars feature a 2px white border. Status badges (e.g., "Ativo", "Pausado") use a "Pill" shape with 10% opacity of the semantic color and 100% opacity text of the same hue.

### Snackbars
Floating 8px above the bottom nav. Dark Slate 900 background with 90% opacity, white text, and a single "Desfazer" (Undo) action in Secondary Sky Blue.