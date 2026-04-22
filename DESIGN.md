# Design System — Talkivo

## Product Context
- **What this is:** AI English tutor for working professionals in India
- **Who it's for:** IT professionals, physicians, grad students prepping for interviews, client calls, visa processes
- **Space/industry:** EdTech / AI tutoring
- **Project type:** Web app + marketing site
- **Memorable thing:** "This is serious software, not a toy." Premium, precise, Jarvis HUD aesthetic.

## Aesthetic Direction
- **Direction:** Retro-Futuristic / Industrial HUD — Tony Stark's heads-up display rendered with restraint
- **Decoration level:** Intentional — corner ticks, module racks with UNIT headers, mono labels. ONE expressive element (ReactorOrb). No mascots, no emojis, no stock photos, no gradients.
- **Mood:** Precision instrument. Military-grade telemetry. The user feels like an operator, not a student.
- **Anti-patterns:** No purple gradients, no 3-column icon grids, no centered-everything, no rounded badges, no achievement confetti, no streak flames, no Duolingo energy.

## Typography
- **Display/Hero:** Sora 700/800 — geometric, sharp, -0.03em tracking. Used for all headings.
- **Body/UI:** Geist Sans — clean readability, pairs well with Sora's geometry.
- **Data/Labels/Mono:** JetBrains Mono — tabular figures always. Used for timestamps, stats, UNIT headers, overlines, status indicators.
- **Code:** JetBrains Mono
- **Loading:** Google Fonts (Sora, JetBrains Mono), Vercel (Geist)
- **Killed fonts:** Lexend, Newsreader, Material Symbols Outlined. Do not use.
- **Scale:** Module headers mono 10-12px uppercase / Body 14-17px / Subhead 18-22px / Heading 28-48px / Display 56-96px

## Color

### Dark Mode (primary, default)
| Token | Hex | Usage |
|-------|-----|-------|
| Paper | `#0D131B` | Page background |
| Surface-1 | `#141A22` | Cards, panels, sidebar |
| Surface-2 | `#1F242D` | Hover states, user message boxes |
| Surface-3 | `#2A2F38` | Active/selected states |
| Ink | `#E6EEF8` | Primary text |
| Ink Muted | `#BCC8CF` | Secondary text, descriptions |
| Ink Subtle | `#879299` | Tertiary text, timestamps, labels |
| Accent Cyan | `#4FD1FF` | Primary accent, links, active states, CTAs |
| Cyan Dim | `#2A6C88` | Secondary accent, tag backgrounds |
| Hairline | `rgba(79, 209, 255, 0.2)` | Subtle borders, dividers |
| Amber Warn | `#E8B64C` | Warnings, errors flagged for attention |
| Sage OK | `#7A9A6B` | Success, improvements, positive deltas |
| Error | `#F87171` | Destructive actions, auth failures |
| Border Rack | `#3D484E` | Module rack borders (3px) |

### Color Rules
- Cyan is the ONLY accent. No secondary brand colors.
- Amber for warnings only. Sage for success only.
- One inverted cyan element max per screen (full cyan bg + obsidian text).
- Grid overlay: 40x40 cyan lines at 4% opacity, hero + final CTA sections only.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — generous whitespace signals premium
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
- **Section padding:** 64-96px vertical
- **Card padding:** 24-32px
- **Module rack header:** 8px/12px padding

## Layout
- **Approach:** Grid-disciplined with module rack system
- **Marketing max-width:** 1440px (design), content 1200px
- **App max-width:** Sidebar 240px + main content area
- **Article max-width:** 720px centered column
- **Grid:** 40x40 cyan at 4% opacity on hero/CTA sections
- **Border radius:** 0-2px only. Sharp corners everywhere. No rounded cards.

### Module Rack System
Every section is a module rack:
- Header chip: `UNIT: NN // SECTION_NAME` in mono, 2px cyan left border, 3% cyan bg tint
- Corner ticks `⌐ ¬ L ⌐┘` on primary racks (hero panels, featured cards)
- 0.5px cyan hairline borders between sections
- 3px chunky rack borders for major containers

## Motion
- **Approach:** Minimal-functional with ONE expressive exception
- **Expressive element:** ReactorOrb (Three.js wireframe icosahedron, cyan, Perlin-noise displacement, mouse-reactive)
- **Transitions:** 150ms ease for hovers, 250ms for state changes
- **Kill list:** Canvas beam animations, waveform strip animations, grid-background particles
- **Keep:** Waveform on mic input (real-time, CSS-animated), orb pulse on voice activity
- **Respect:** `prefers-reduced-motion` always

## Component Patterns

### Buttons
- **Primary:** Solid cyan `#4FD1FF` bg, obsidian `#0D131B` text, mono uppercase label
- **Ghost:** Transparent bg, 0.5px cyan border, cyan text
- **Text link:** Mono cyan with hairline underline, trailing `→`

### Inputs
- **Style:** Transparent bg, 0.5px cyan bottom-border only, ink text
- **Focus:** 2px cyan ring, offset 2px
- **Labels:** Mono 11px uppercase, cyan/muted

### Cards
- **Background:** Surface-1 `#141A22`
- **Border:** 0.5px cyan hairline
- **Corner ticks:** On primary cards only
- **Hover:** Surface-2 bg + 2px cyan left border

### Data Tables
- **Hairlines:** 0.5px cyan between rows
- **No zebra striping**
- **Row hover:** Surface-2 + 2px cyan left border
- **Numbers:** JetBrains Mono, tabular figures always

### Chat Messages
- **User turns:** Right-aligned, Surface-2 box, corner ticks, Geist 16px
- **Tutor turns:** Left-aligned, no box, Sora 17px on Paper, `[ TUTOR ]` mono cyan prefix
- **Corrections:** Cyan wavy underline on original, expand to correction card with strikethrough + fix + rule

### Status Indicators
- **Live pill:** Pulsing 1.5px cyan dot + mono `[ LIVE ]` or `SYSTEM_OPTIMAL`
- **Active:** Cyan dot
- **Beta:** Amber dot
- **Scheduled:** Subtle dot

## Navigation

### Marketing (sticky, 72px)
- Left: `TALKIVO` wordmark Sora bold cyan +0.08em + pulsing cyan dot + mono `[ LIVE ]`
- Center-right: mono nav `// MODES // ARCHIVE // NODES // MAKER`
- Right: `[ SIGN IN → ]` text link + solid cyan `[ START SESSION → ]`
- Background: Paper/80 + backdrop-blur, 0.5px cyan bottom border

### App (240px sidebar, fixed)
- Wordmark + user plate (initials in 40x40 cyan-bordered square)
- Mono 12px uppercase nav items, active = 2px cyan left border + 3% cyan bg
- Bottom: status pill + logout link

## Icons & Decoration
- **Allowed:** `→` `+` `·` `//` corner ticks `⌐ ¬ L ⌐┘`
- **Not allowed:** Lucide icons, emoji, mascots, social badges, hero photos
- **Mono labels:** All section headers use `// UPPERCASE_SNAKE_CASE` convention

## Footer
- 3px cyan top border
- 4-5 columns: wordmark + mission, Product, Archive, Maker, Status
- Bottom row: mono `© 2026 TALKIVO_CORE · NODE: HYD-01 · LATENCY_04MS`
- Live `SYSTEM_OPTIMAL` pill with pulsing cyan dot

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-22 | Initial design system created | Jarvis HUD aesthetic — premium instrument for professionals, not gamified edtech |
| 2026-04-22 | Sora + Geist + JetBrains Mono | Sora = sharp geometric display, Geist = readable body, JBM = data/telemetry |
| 2026-04-22 | Single cyan accent `#4FD1FF` | Tech/AI signature, works on dark surfaces, avoids edtech color tropes |
| 2026-04-22 | Module rack system with UNIT headers | Military/HUD framing makes content feel authoritative, not decorative |
| 2026-04-22 | Corner ticks + mono labels | Differentiator — no edtech app uses this visual language |
| 2026-04-22 | Kill Lexend, Newsreader, Material Symbols | Consolidate to 3 fonts max. Old fonts were unfocused. |
