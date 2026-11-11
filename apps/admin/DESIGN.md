---
name: tenboards
description: Refined product UI for a complete admin dashboard starter
colors:
  primary: "#1e40af"
  primary-dark: "#a9c2ff"
  bg: "#f8f9fb"
  surface: "#ffffff"
  surface-raised: "#f0f2f5"
  text: "#181c25"
  text-muted: "#515b6b"
  border: "#dbe0e8"
  border-strong: "#788397"
  bg-dark: "#111318"
  surface-dark: "#191d25"
  surface-raised-dark: "#252b36"
  text-dark: "#f3f5f9"
  text-muted-dark: "#b0bacb"
  success: "#166534"
  warning: "#854d0e"
  danger: "#a81928"
  info: "#1e40af"
typography:
  body:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "13px"
  mono:
    fontFamily: "Geist Mono Variable, monospace"
  title:
    fontFamily: "Geist Variable, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    letterSpacing: "-0.025em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  compact: "12px"
  card: "14px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    height: "28px"
---

# Design System: tenboards

## Overview

**Creative North Star: "Refined product UI"** — the approved Linear/Vercel register in PLAN §7. Precision, scanability, and restraint serve dense administrative work. PLAN and its Decisions log win every conflict.

The frontmatter records the v0.6.2 compact desktop defaults (mobile controls and spacing retain the larger rhythm). The default combines cool neutral surfaces with a deep blue action accent. Task 007 supplies token-only Graphite, Pine, and Iris alternatives. The v0.1 shell and v0.2 dashboard usages apply these tokens at usage sites; app-page content remains assigned to v0.3.

**Key Characteristics:** neutral-first surfaces, one action accent, crisp borders, compact data, restrained depth, and consistent control states.

## Colors

src/styles/styles.css owns normative light and dark roles. Shadcn background/card/popover map to bg/surface, their foregrounds map to text, and muted/secondary/accent hover surfaces map to surface-raised. Because shadcn uses “accent” for hover fill, action-accent names the saturated primary action color. Border is a decorative separator; border-strong is the accessible input/control edge. Ring is the action color and an opaque 2px outline supplements inherited translucent focus rings.

Supported AA text pairs: text, text-muted (including placeholders), primary, success, warning, danger, and info on each of bg/surface/surface-raised; primary-foreground on primary (including existing 80% hover fills); each semantic foreground on its matching semantic surface. All require 4.5:1, even for large text. Ring and border-strong require 3:1 against all three neutral surfaces. No claim is made for arbitrary cross-role combinations or inherited hard-coded chart/page colors. Low-contrast decorative border is never the sole control boundary.

Run `node --experimental-strip-types scripts/check-contrast.ts` against the dev server; `--presets` and `--base-url` support later preset/version checks. It resolves rendered CSS values, converts to sRGB, and checks WCAG relative luminance. Disabled controls retain native disabled semantics, pointer suppression, opacity, and cursor treatment; inactive controls are contrast-exempt, and their treatment must not be used for enabled explanatory text. Text selection and input carets use the primary pair.

Presets use only task 005 palette primitives. Default retains blue; Graphite uses charcoal/silver, Pine uses deep teal/mint, and Iris uses violet/lavender. Each changes only primary; all semantic colors, foreground pairings, focus, type, spacing, radii, and shadows inherit the shared contract. The generator resolves each swatch from its referenced root primitive and rejects unresolvable values. No literal palette values live in preset files.

Persisted Tangerine, Brutalist/Neo Brutalism, and Soft Pop selections migrate to Default during boot, before hydration, and their cookie is rewritten. The parser and preference store retain their existing allowed-value fallback; the provider reads the sanitized DOM. Valid new selections and the font registry remain intact. Verify all presets with `node --experimental-strip-types scripts/check-contrast.ts --presets default,graphite,pine,iris`.

Verified contrast floor (35 supported checks per mode, 2026-10-23; full results in PR evidence):

| Preset | Light text / hover | Dark text / hover | Light control / focus | Dark control / focus |
| --- | --- | --- | --- | --- |
| Default | 5.30:1 | 7.05:1 | 3.41:1 | 3.70:1 |
| Graphite | 6.11:1 | 7.26:1 | 3.41:1 | 3.70:1 |
| Pine | 4.67:1 | 7.26:1 | 3.41:1 | 3.70:1 |
| Iris | 5.63:1 | 6.79:1 | 3.41:1 | 3.70:1 |


## Typography

Geist Sans and Geist Mono are self-hosted through the approved Fontsource packages. The font registry retains every previous choice; default Geist stylesheets use local assets. Mono is loaded for code/data regardless of the chosen body face. The fixed scale is 12/13/14/16/18/21/26/32px; heading tracking is -0.025em. Tabular numerals are inherited globally so every metric aligns without per-widget edits.

## Layout

Existing screens use responsive grids, compact controls, and route-local components. Compact is the single default, with no density preference. Desktop uses a 3.5px Tailwind spacing unit (formerly 4px): standard cards have 14px internal spacing, small cards retain 12px, default controls are 28px, and page gutters/grid gaps formerly 24px become 21px. Mobile retains the 4px spacing unit, 16px standard card padding and 32px default controls. Interactive button targets have a 24px minimum on both; checkbox/radio/switch hit areas retain the protected primitives’ pseudo-element expansion. Mobile text entry remains 16px to avoid input-focus zoom.

The app surfaces use **Operate** mode. Data density, scanability, native expectations, and consistency outrank expressive decoration. Mobile changes are structural, including the existing sidebar sheet and collapsing grids.

## Elevation & Depth

Cards preserve their inherited thin border/ring structure. Low elevation uses two subtle offset layers; overlays use wider layered shadows. Shared durations are 150ms and 200ms with standard ease-out; Tailwind transitions default to 150ms. Reduced-motion media rules reduce all animations/transitions to near-instant and disable smooth scrolling. Dashboard composition and JS chart behavior are handled by the shared presentation layer and route-local motion subscriptions.

## Shapes

Default control radius is 8px; shadcn aliases use 4/6/8/12/16/20/24px. Cards use the 12px step. Desktop named spacing primitives are 3.5/7/12/14/21/28px; mobile keeps 4/8/12/16/24/32px. The small-card 12px floor is independent of the 3.5px desktop utility rhythm. The floating sidebar uses the 24px radius step, larger than dense controls.

## Components

The original tenboards identity uses a paired-board “10” silhouette and a Geist wordmark. In the app, the mark inherits currentColor and is decorative beside the wordmark or a named link; isolated SVG assets carry their own accessible name. Favicons use the tested white-on-blue primary pair. The SVG wordmark master is dark-on-light; use the inherited-color React wordmark in dark UI. Metadata assets and vector masters are documented in README.

Use local Base UI-backed shadcn wrappers after inspecting their source. Button variants include primary, outline, secondary, ghost, destructive, and link; focus uses a border plus ring. Inputs have focus, invalid, disabled, and placeholder states. Cards use semantic card foreground/background with header/content/footer slots. Chips and navigation should share the semantic palette.

The locked sidebar reference is [docs/design-refs/sidebar-reference.png](docs/design-refs/sidebar-reference.png), inspected for this document. The implemented shell uses its inset floating rounded panel, workspace avatar/name and collapse control, search pill with ⌘K, regular-weight primary items with outline icons, soft gray active pills, secondary collapsible sections, pinned status card, and footer actions. Expanded navigation is 18rem wide; icon-collapse is 4.5rem. The panel sits 12px from desktop viewport edges; on mobile the sheet panel itself is inset 8px from the viewport, with 40px mobile rows and 18px icons (36px rows and 16px icons on desktop), 12px active pills, and a sticky viewport-height wrapper. Home, Projects, Email and Chat precede the project disclosures and Dashboards, Pages and Misc sections; AI Assistant follows Chat. The demo card counts visited enabled concrete dashboard destinations, including project views and excluding aliases, since the sidebar mounted; footer actions are Settings, Help, Documentation, and Feedback.

The header is 48px tall on desktop and 56px on mobile, with linked Projects/project ancestor breadcrumbs and a current-view label on project pages, a truncating current-page label elsewhere, theme/settings/account controls, and a link to the tenboards repository. The Workspace prefix and repository link are hidden below 640px. The header sidebar trigger appears on mobile and when desktop off-canvas navigation is hidden. Desktop icon rails retain only their own sidebar toggle; the breadcrumb starts at the normal header padding. Expanded desktop navigation keeps its sidebar toggle. If a focused header opener becomes hidden, focus transfers to the sidebar toggle. Desktop search lives in the sidebar; below 768px the header gets a compact search trigger. The account menu uses clearly labeled demo identities with initials avatars.

The root command palette uses the existing cmdk and dialog wrappers and the shared retained-route catalog. Search rows are at least 35px tall on desktop and 40px on mobile; the result list scrolls within a bounded viewport. The dialog has a title, description, explicit search label, empty state, and a touch close button. ⌘K/Ctrl+K toggles the palette, including inside text fields. Alt/Shift, key repeat, IME composition, already-handled events, and another visible dialog/menu/listbox suppress the shortcut (the mobile navigation sheet excepted). The search input group uses one opaque 2px focus outline with 2px offset and 8px corners; the inner input outline is suppressed. Keyboard selection, Escape, and focus return are part of the component contract.

Layout settings is a right-hand sheet capped at 28rem on desktop and full width on mobile. Appearance and Layout sections group native labeled selects and fieldset radio choices. Controls are at least 35px tall on desktop and 40px on mobile; the body scrolls independently of its heading and reset footer. Selected choices use a neutral fill and 1px primary border; keyboard focus adds an opaque 2px outline with 2px offset. The Defaults footer derives all seven labels from the registry. Existing seven-day preference cookies and the separate sidebar-state cookie remain the layout persistence contract; Reset also re-expands the sidebar. The visible variant/mobile explanations describe the supported sidebar adaptations.

## Do's and Don'ts

- Do use Impeccable and read its craft floor immediately before UI edits.
- Do preserve semantic shadcn compatibility, font choices, SSR, and preference behavior.
- Do verify rendered light/dark desktop/mobile states and contrast with evidence.
- Don't redesign dashboard or app-page content in v0.1.
- Don't treat documentation of a future design as proof it is implemented.
- Don't remove screens or copy third-party logos into the tenboards identity.


## Dashboard presentation foundation

`@/components/blocks` exports the public `DashboardCard`, `SectionHeader`, and `StatCard` APIs from `src/components/blocks/cards.tsx`. Compact/standard density maps to 12/14px desktop card spacing (12/16px on mobile); headings are semantic h2/h3, labels wrap and metric values use tabular numerals. Optional help, trend and action slots retain route-owned data and behavior. The completed v0.2 implementation reuses these primitives across all 14 current/legacy dashboard routes; domain values and interactions stay local.

`src/components/blocks/charts.tsx` composes protected chart exports, available through `@/components/blocks`. Use `DashboardChart` for bounded responsive height and visible keyboard focus, `chartAxis` for 12px muted ticks, `chartGrid` for decorative dashed separators, `chartCursor`, `DashboardTooltip`, and wrapping `DashboardLegend`. `seriesConfig` deliberately selects chart-1/2/4/5 (primary, text-muted, success, warning) rather than duplicate Default chart-3. Every line also needs a distinct dash/marker or labeled form; multi-series charts use solid/dashed/dotted series with matching line samples, direct labels or accessible data tables. Marks use opaque token strokes, with area fills only as supplementary cues. Numeric formatters use explicit en-US locale; route code owns time ranges and units.

Pass `useChartMotion()` to every animated series and tooltip. Its server snapshot and initial hydration disable animation, then a guarded media-query subscription observes changes and permits 200ms animation only when reduced motion is off. No global tokens, font/preset registry or protected wrappers change.


The integrated dashboard layout uses equal-height cards within a common comparison row; stacked auxiliary columns align their outer bounds where they share that row. Independent work streams such as Productivity's main work and calendar/notes sidebar keep their content-driven heights. Tables scroll locally or reflow to labelled mobile fields; no data is hidden to fit.

Patient Monitoring retains local simulation and signal identity: labelled ECG/success, Pleth/info, Resp/warning and ART/danger traces. Continuous subscriptions pause under reduced motion, while numeric readings and a post-hydration live UTC clock remain available. Static date-based dashboards explicitly identify their deterministic demo reporting dates; no hydration warning suppression or page SSR removal is used.


The public `DataTable` accepts a caller-owned TanStack Table v9 instance configured with `dataTableFeatures`. Shared sort buttons, Previous/Next controls, row counts and an empty slot compose the protected table/button primitives. Labelled mobile fields retain all visible columns; the optional scroll mode preserves tabular layout. Column definitions and server/client state remain outside the block. Specialized route tables retain their existing layouts.

`/dashboard/kit` uses Operate mode and the established compact tokens. A single PageHeader, fragment-link navigation and separated example sections expose the blocks, their variants and static source. Examples use the live compiled modules as their copyable source. No tokens, presets or protected primitives change.

## App-page headings

`src/components/blocks/page-header.tsx`, exported through `@/components/blocks`, owns the small `PageHeader` presentation API: required string `title`, optional string `description`, React `actions`, and optional layout `className`. The h1 uses the 21px scale with medium weight and tight tracking; descriptive text uses the muted 13px role. A wrapping flex row, shrinkable title column and wrapping action slot support narrow screens and long titles. File Manager and Products consume it first; Tasks and Invoice follow in their owned tasks. It owns no route, state or data. Continue using `SectionHeader` for card h2/h3 semantics and the existing dashboard primitives for cards.

## Compact density contract (v0.6.2)

The browser rem root remains 16px. Body content and tables use 13px/18px; the previously unstyled body fallback was 16px/24px while normal content was 14px/20px. Metadata/labels never go below 12px. SectionHeader uses 14px/20px; page headings use 21px/28px; StatCard values use 21px, rising to 26px on wide desktops (formerly 24/30px). The inherited 18px `text-lg` step is now explicitly 16px, and 36px `text-4xl` is 32px. Heading tracking, weights, colors, focus outlines and reduced-motion behavior are unchanged.

This targets about 8–12% overall desktop compaction, rather than scaling every pixel uniformly: normal text shrinks 7%, most spacing 12.5%, KPI values 13%, sidebar rows 10%, and the desktop header 14%. Floors and intentional exceptions take precedence. Chart containers, FullCalendar and date-picker geometry keep their original spacing context and rem-based sizing; chart ticks stay 12px. Sidebar widths and breakpoints stay unchanged to protect long labels. Mobile adopts the type hierarchy but keeps larger control/card spacing and its 56px header.

Toolbar selects and tabs keep a content-based minimum width, including their icons and gaps, instead of clipping wider font choices into fixed compact widths. Full-width form selects retain their responsive wrapping layout; Calendar switches to intrinsic width on desktop. The 24px control floor lives in the base layer so larger minimums at usage sites remain effective.


## Assistant

The Assistant uses Operate mode at compact density. A full-height page holds a centered 752px conversation with an independently scrolling message area. User messages are compact right-aligned muted bubbles; assistant replies have a small Bot icon and left-aligned generative UI. A centered welcome block offers three suggestion cards in a two-column grid. Illustrative replies are identified in one short line.

The composer stays below the scroll area, with mobile safe-area spacing. Its textarea grows from one to eight rows, keeps a hidden Message label, and supports Enter to send and Shift+Enter for a newline. A compact provider/model select (or subtle Recorded demo badge) shares the bottom toolbar with the icon Send/Stop button. Focus returns to the composer on send, stop, regeneration and clear. Session expiration focuses Sign in to continue.

The read-only registry uses DashboardCard/StatCard, compact Table rows and the existing chart components. Table/chart groups have card frames; nested frames are flattened at the usage site. Charts retain keyboard access, tabular alternatives and reduced-motion handling. Supported semantic token pairs are reused, with no new tokens, fonts or presets.

The message log is polite and marked busy during streaming; a separate status announces lifecycle changes. The initial streaming placeholder has reduced-motion-aware dots. Scrolling follows only within 160px of the bottom and pauses when reading older messages; Jump to latest resumes following. Regenerate and Copy reply are small, named icon controls with tooltips under the latest assistant turn. Clipboard failures provide inline recovery. New conversation explains transient retention in a tooltip.

Recovery remains inline: bounded-context notices in the transcript; input errors and Retry-After near the composer; explicit provider recovery and session-expiration focus. No request, auth, limiter, stream validation or provider behavior changes in the visual refinement.

## Projects workspace usage (v0.8)

The workspace uses Operate mode at the v0.6.2 compact scale. Shared StatCards present Home/Overview metrics; existing Select and segmented ToggleGroup controls serve filters, Timeline modes/scales and Files display. No token, preset, font or density registry changes accompany Projects. Semantic status dots and priority icons pair color with text, short task keys aid scanning, and initials use the existing Avatar circles. Empty counters are omitted from Board cards; task details retain a focused dialog and keyboard return.

The project header has one project-qualified shell breadcrumb, a compact selector, status, member avatars and progress. Overview uses member rows and request-relative due labels. Timeline preserves visible text/date cues alongside semantic bars, today marker, bounded scrolling range and collapsible unscheduled work; mobile defaults to Table after safe hydration. Calendar geometry and protected adapters are unchanged. File metadata uses local file-type/star/share icons without mutation affordances.

Primary Home/Projects precede Email/Chat and Assistant when present; Default remains under Dashboards. Project disclosures contain indented route links with an exact active child. Rail popovers expose the project name and all five links, dismiss on route resolution including same-path navigation, and return focus on Escape. Expansion state lives above the mobile sheet lifetime. The bounded `tenboards:project-nav:v1` localStorage preference restores after hydration and respects manual collapse within a project. Existing keyboard focus, reduced motion, supported semantic token pairs and sidebar layout preferences are preserved.
