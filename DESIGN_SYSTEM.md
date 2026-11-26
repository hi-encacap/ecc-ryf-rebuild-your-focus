# ReMind · Quiet Growth

ReMind gives attention room to return. The visual language combines a calm, spacious workbench with a small organic 3D motif. It should feel like opening a good notebook: useful immediately, inviting to return to, and easy to leave when the day is done.

This system was prepared by the dedicated design agent in this project. The external Hallmark service was not available in the connected tools.

## Foundation

The application speaks natural Vietnamese. Product name and familiar technical terms can remain English. Use concise, specific language: “Một việc, trọn sự chú ý.”, “Bắt đầu tập trung”, “Hôm nay đủ rồi”. Do not use medical scores, punitive streaks, invented personal statistics, or promise to improve intelligence.

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#F7F8F5` | Warm porcelain page background |
| Paper | `#FFFFFF` | Cards, forms, elevated surfaces |
| Ink | `#183B39` | Headings, important numbers |
| Body | `#3F5754` | Main text |
| Muted | `#637570` | Supporting copy and metadata |
| Teal | `#2C7165` | Primary action, selected navigation, progress |
| Sage | `#E7EEE6` | Hero and focus surfaces |
| Sage strong | `#C2D4BF` | Illustration accent, quiet chart fill |
| Lavender | `#EEEBF7` / `#665B87` | Thinking and recall categories |
| Peach | `#F7EEE4` / `#88613F` | Movement and reflection categories |
| Blue | `#EAF0F5` / `#4A6883` | Reading and rest categories |
| Border | `#DCE2DA` | Thin structural separators |

Keep the canvas neutral and use accent color with intent. Reserve strong teal for the next action and current state. Unfinished habits remain neutral; missed days do not become red. Destructive red appears only for destructive actions and validation errors.

## Typography and spacing

Use self-hosted Be Vietnam Pro regular, medium and semibold, with a system sans fallback. If the font cannot be bundled, use the fallback directly; no runtime font CDN. Use generous line height for Vietnamese accents.

| Style | Desktop | Mobile | Line height |
| --- | --- | --- | --- |
| Page headline | 36–40px / 600 | 28–32px / 600 | 1.2–1.3 |
| Hero headline | 32px / 600 | 26px / 600 | 1.3 |
| Section title | 20px / 600 | 18–20px / 600 | 1.4 |
| Body | 16px / 400 | 16px / 400 | 1.65 |
| Label / button | 14px / 500 | 14px / 500 | 1.5 |
| Secondary metadata | 12–13px / 400 | 12–13px / 400 | 1.5 |
| Timer | 72px / 500 | 64px / 500 | 1.1 |

Use a 4px spacing base: 8px between related labels, 12px inside compact controls, 16px between small groups, 24px card padding, 32px major groups, 40–48px page padding on desktop. On mobile use 20px outer gutters and 20px card padding. Major cards have 24px corners; hero 32px; buttons and fields 10–12px. Use a thin border or a soft shadow, rarely both.

## Application frame

Desktop at 1080px and above: fixed 232px white sidebar with right border, wordmark at top, five navigation items, compact journey progress and local-data note near the bottom. Main content has a maximum width of 1180px and a generous top greeting/date row. The Today content uses a roughly 1.65:1 two-column layout. The left column contains the next action, mission and routines. The right contains a focus launcher, weekly strip or compact progress, and reflection. Avoid turning every tiny element into a separate card.

Tablet from 768–1079px: collapse the sidebar to 88px with icon-and-tooltip navigation, or use the bottom navigation. Reduce main gutters to 24px and stack the Today layout when columns become cramped.

Mobile below 768px: single column, no fixed top bars consuming vertical space, sticky five-item bottom navigation with safe-area padding. Each item has icon plus a visible short label: Hôm nay, Lộ trình, Tiến độ, Thư viện, Cài đặt. Provide at least 44px targets. Add bottom content padding equal to navigation height plus the safe area. Use dialogs as full-width lower sheets only where content fits; long forms should scroll naturally.

## Today composition

1. Small date line, main “Chào ngày mới.” greeting, supportive one-line context.
2. Sage hero with small phase tag, “Một việc, trọn sự chú ý.” headline, short instruction, one solid “Bắt đầu tập trung” button. The right third shows the 3D sprout/pebble illustration; on mobile it becomes a smaller decorative corner image without obscuring text.
3. Mission card with day number, real curriculum title, one-sentence purpose, expandable steps and a clear completion control.
4. Compact habit rows: category icon in tinted tile, label and target, status control. Pending, done, not done and N/A are visually and textually distinct. Keep explicit detailed logging one tap away.
5. Quiet reflection surface with an inviting prompt and autosave state. Finish Day is the primary action only near the end of the page.

An empty dashboard must display empty values with useful next steps, never illustrative personal progress. In onboarding the background can preview the product structure without fake metrics, while a centered welcome panel guides baseline and schedule setup.

## Components, using shadcn

Use shadcn Button, Dialog, Tabs, Input, Textarea, Label, Switch, Progress, Badge, AlertDialog and Select primitives as appropriate. Restyle through the supplied tokens rather than creating a parallel component library. Radix focus trapping and keyboard behavior should remain intact.

- Primary button: deep teal, white label, 44–48px high, 12px corners, subtle hover darkening. Icons can lead text. Do not append decorative arrows.
- Secondary button: paper or transparent surface, muted border and ink text. Ghost buttons are for tertiary actions only.
- Inputs: paper surface, visible border, 44px minimum height, always have a visible label. Number fields show units. Unknown numeric values remain blank.
- Segmented mode control: pale sage track with white selected pill. Labels “Ngày thường” and “Ngày nhẹ”. Explain changing expectations without judgment.
- Dialogs: 24px corners, title and description, clear close control, enough room for Vietnamese labels. Keep destructive confirmation explicit and separate from normal saving.
- Toast: brief factual copy (“Đã lưu trên thiết bị”), no confetti or engagement prompts. Persistent storage errors need a persistent alert, not a disappearing toast.
- Progress: slim muted track, teal fill, exact text nearby. Display task completion rather than an alleged brain or health score.
- Habit status: circle outline pending; teal filled check done; neutral dash not done; muted N/A pill with accessible full label. Never rely on color alone.
- Accordion: fine separators and chevron, no nested card stacks. Library evidence details use real source links and limitations.
- Charts: sparse labels, quiet grid lines, gaps for unknown dates. A text summary states the sample count, time window and self-report nature. No smooth interpolation across missing data.

## Illustration and icon art direction

Create a recognizable “quiet growth” asset: two smooth porcelain pebbles balancing naturally, a tiny two-leaf sage-green sprout emerging from the upper stone, optional pale peach spherical bud. Soft rounded 3D forms, satin ceramic material, diffuse studio lighting from upper left, faint grounded shadow. Orthographic/isometric camera, ivory transparent or matching porcelain background, subtle asymmetry. No face, text, busy scenes, glossy toy plastic, or over-saturated gradients.

Hero composition should leave negative space on the left for real UI text. The illustration can sit on a pale sage ellipse. Produce a separate square app icon from the same motif, framed on deep teal with a large pale pebble and mint leaves, readable at 48px. App icon files need actual PNG sizes for iOS and manifest use; avoid tiny details or text. Keep the icon artwork inside the maskable safe zone.

Use Lucide icons for controls with 1.7–2px strokes. Decorative category illustrations may be 3D, but functional icons should remain simple and instantly recognizable.

## Motion and access

Use 160–220ms ease transitions for buttons and selection. A subtle entry fade is optional; no perpetual floating mascot or bouncing rewards. Timer digits must not shift width; use tabular numerals. Respect reduced motion, safe areas and text zoom. Provide visible keyboard focus and semantic headings. Modals return focus to their trigger. Check text contrast and control contrast in the finished UI.

## PWA details

Use theme color `#F7F8F5`, standalone display, a real Apple touch icon, and safe-area-aware mobile layout. The install helper should say: “Trên Safari: Chia sẻ → Thêm vào Màn hình chính.” Show this as a dismissible helper in Settings, not a recurring blocking prompt. Clearly state that data lives on this browser/device and provide backup controls. Offline state is a small factual label; it should not imply data synchronization.
