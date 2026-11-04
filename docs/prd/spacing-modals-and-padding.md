# Spacing, Margins, and Scrollable Modals

Status: ready-for-agent

## Problem Statement

Users of the Planning Poker application experience cramped layouts, claustrophobic spacing, and usability-breaking content clipping across desktop, tablet, and mobile displays:
1. **Narrow Modal Dialogs:** Dialogs for changing player names and customizing card decks are artificially constrained to a narrow width (`420px`). This wastes available screen real estate on desktop and tablet screens and compresses card input fields, deletion triggers, and descriptive labels into an uncomfortably tight column.
2. **Modal Content Clipping:** When creating or editing a `Custom Deck` with up to 15 cards, the modal content overflows vertical screen bounds. Because dialog containers clip content with hidden overflow and lack an internal scroll container, lower card inputs and critical dialog actions ("Cancel", "Create Deck", "Update Deck") become inaccessible or get cut off beneath the viewport edge.
3. **Cramped Action Buttons:** Primary submit buttons and control actions sit too close to preceding form inputs, deck previews, and status indicators without adequate top separation, increasing visual clutter and the likelihood of misclicks.
4. **Tight Section Margins:** Major interface sections and content cards sit tightly against one another with insufficient margins (`20px` or less), producing a dense layout that lacks comfortable visual rhythm and breathing room.

## Solution

The interface geometry, spacing rhythm, and dialog architecture are updated across all screens while preserving all underlying `Game`, `Round`, `Card Deck`, and `Public Game State` behavior:
- **Wenn** a modal dialog (such as the `Custom Deck` editor or name change dialog) is opened, **dann** it occupies an expanded responsive width (`min(94vw, 680px)` for deck editing and `min(92vw, 520px)` for standard dialogs) to make balanced use of larger displays.
- **Wenn** modal content exceeds available vertical space (e.g., when editing up to 15 custom cards), **dann** the dialog enforces a three-tier layout with a fixed header, a pinned bottom action bar, and a dedicated scrollable body container with smooth, contained scrolling.
- **Wenn** action buttons or form submit buttons are rendered in dialogs, setup forms, or game controls, **dann** they maintain generous top separation (`20px` to `24px`) and visual distinction from preceding content.
- **Wenn** major content cards and form groups are displayed in the game room and setup screen, **dann** they use harmonized vertical margins (`24px` to `28px`) and standardized inner paddings (`28px` desktop, `20px` mobile) in both Light Mode and Dark Mode.

## User Stories

1. As a **Player**, I want the `Custom Deck` editor modal to expand up to 680px on desktop and tablet screens, so that card input fields, add/remove buttons, and labels have ample breathing room.
2. As a **Player**, I want the player name change modal to have an expanded responsive width of up to 520px, so that entering my display name feels comfortable rather than squeezed.
3. As a **Player**, I want the modal header (title and close button) to remain fixed at the top of the dialog, so that context and dismissal controls are always visible regardless of scroll position.
4. As a **Player**, I want the modal action footer ("Cancel", "Create Deck", "Update Deck", "Save") to remain pinned at the bottom of the dialog, so that I can submit or dismiss changes without scrolling through all card inputs.
5. As a **Player**, I want the list of cards in the `Custom Deck` editor to scroll smoothly inside a dedicated middle container when adding up to 15 cards, so that no card slots or action buttons are clipped off-screen on smaller laptop or tablet viewports.
6. As a **Player**, I want the scrollable card area to use contained overscroll behavior, so that scrolling inside the card list does not accidentally scroll the background page.
7. As a **Player**, I want the modal scrollbar to render as a thin, theme-aware bar, so that scrolling is visually integrated with both Light Mode and Dark Mode surfaces.
8. As a **Player**, I want modal action buttons to have a subtle top dividing border and dedicated padding separating them from the scrollable form body, so that confirmation and cancellation triggers are visually distinct.
9. As a **Player**, I want keyboard navigation (Tab and Shift-Tab) to traverse through card inputs and scroll the focused input into view within the modal, so that accessibility and keyboard workflows are seamless.
10. As a **Player**, I want the "Create a Game" and "Join the Game" submit buttons on the setup screen to have dedicated top clearance separating them from the `Card Deck` selector and preview, so that the call-to-action stands out clearly.
11. As a **Player**, I want form input groups to maintain consistent bottom margins (`24px`) across setup and dialog screens, so that input labels, text fields, and validation messages never crowd each other.
12. As a **Player** or **Watcher**, I want major content cards (participants list, `Card Deck` selection, game controls, and game statistics) to maintain increased vertical separation (`28px`), so that the game room feels well-structured and spacious.
13. As a **Player** or **Watcher**, I want content cards to have standardized inner padding of 28px on desktop viewports and 20px on mobile viewports (`<= 600px`), so that content density adapts gracefully to smaller touchscreens.
14. As a **Player**, I want the `Card Deck` estimation buttons to maintain clean row and column gaps, so that selecting an estimate during a `Round` is accurate and comfortable on touch devices.
15. As a **Player**, I want round management actions ("Reveal Votes", "Start New Round") to have distinct vertical clearance from deck switching and custom deck modification controls, so that round actions are not confused with configuration actions.
16. As a **Player**, I want the role switch button ("Switch to Watcher") to maintain clear visual separation from the round controls, so that role changes are deliberate.
17. As a **Watcher**, I want the watcher banner and "Switch to Player" action to have comfortable padding and vertical clearance, so that observer mode feels visually refined.
18. As a **Player** or **Watcher**, I want game statistics and vote breakdown charts to display with adequate spacing between metric cards and vote bars, so that estimation summaries are legible at a glance.
19. As a **Player** on a mobile screen, I want modal dialogs to occupy a high percentage of screen width (`min(92vw, ...)`) with reduced inner padding (`20px`), so that modal interactions remain fully usable on small touchscreens.
20. As a **Player**, I want the modal backdrop click and Escape key dismissal to work reliably regardless of the scroll position of the modal body, so that closing the dialog is effortless.

## Implementation Decisions

- **Modal Sizing Hierarchy:**
  - Standard/compact dialogs (e.g., player name change) enforce a maximum width of `520px` with responsive sizing `min(92vw, 520px)`.
  - Content-heavy dialogs (e.g., `Custom Deck` editor) enforce a maximum width of `680px` with responsive sizing `min(94vw, 680px)`.
  - Dialog vertical bounds are capped at `max-height: 85vh` with flex containment to guarantee visibility on low-height screens.

- **Three-Tier Modal Layout Architecture:**
  - **Wenn** a modal dialog is rendered, **dann** the dialog container is structured as a vertical flex column (`display: flex; flex-direction: column; max-height: 85vh;`).
  - **Wenn** the modal header is rendered, **dann** it is non-shrinkable (`flex-shrink: 0; padding: 24px 28px 16px 28px; border-bottom: 1px solid var(--border-color);`), displaying the dialog title and close button.
  - **Wenn** the modal body is rendered, **dann** it occupies the flexible middle space (`flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: 20px 28px;`).
  - **Wenn** the modal action footer is rendered, **dann** it is pinned at the bottom (`flex-shrink: 0; margin-top: auto; padding: 18px 28px 24px 28px; border-top: 1px solid var(--border-color); background: var(--card-bg);`), keeping submit and cancel buttons permanently accessible without scrolling.

*(Decision-rich layout contract from prototype)*:
```css
.modal-content {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  width: min(92vw, 520px);
  overflow: hidden;
}

.modal-content.modal-wide {
  width: min(94vw, 680px);
}

.modal-header {
  flex-shrink: 0;
  padding: 24px 28px 16px 28px;
  border-bottom: 1px solid var(--border-color);
}

.modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
  padding: 20px 28px;
}

.modal-actions {
  flex-shrink: 0;
  margin-top: auto;
  padding: 18px 28px 24px 28px;
  border-top: 1px solid var(--border-color);
  background: var(--card-bg);
}
```

- **Button Spacing & Visual Hierarchy:**
  - **Wenn** action buttons or form submit buttons sit inside vertical form stacks (modal dialogs, game setup screen, or game controls), **dann** they receive dedicated top clearance (`margin-top: 20px` to `24px`).
  - **Wenn** primary round actions ("Reveal Votes", "Start New Round") are rendered above `Card Deck` switching controls, **dann** explicit vertical separation is maintained to prevent accidental clicks.
  - **Wenn** inline button groups or modal action pairs are rendered, **dann** they maintain horizontal gaps (`gap: 12px`), avoiding adjacent touch target collisions.

- **Harmonized Card and Form Group Spacing:**
  - **Wenn** main content cards are rendered, **dann** they use `margin-bottom: 28px; padding: 28px;` on desktop displays, scaling down to `margin-bottom: 20px; padding: 20px;` on viewports `<= 600px`.
  - **Wenn** form groups are rendered, **dann** they use `margin-bottom: 24px;` with explicit label margins (`margin-bottom: 8px; font-weight: 500;`).

## Testing Decisions

- **What makes a good test:**
  - Tests verify user-observable behavior and DOM accessibility at component boundaries (presence of all card inputs in the DOM, accessibility of pinned action buttons, focusability, interactive states, and semantic container class structures), without coupling to pixel measurements or CSS engine rendering.
- **Single Test Seam:**
  - A single UI integration seam at the React component boundary using Vitest and React Testing Library (`@testing-library/react`) with mocked Socket Service:
    1. **Wenn** the `Custom Deck` editor is rendered with 15 cards, **dann** all 15 card input fields and the pinned action buttons ("Cancel", "Create Deck" / "Update Deck") are present in the DOM, focusable, and interactable.
    2. **Wenn** the name change modal is rendered, **dann** it renders within the dialog container with distinct primary and secondary action buttons.
    3. **Wenn** the game setup screen is rendered, **dann** the submit button is rendered with its container clearance and remains clickable regardless of deck preview selection.
    4. **Wenn** the game controls are rendered, **dann** round action buttons and deck switching buttons maintain their semantic classes and interactivity.
- **Prior Art in Repository:**
  - `GameRoom` component tests, `GameControls` tests, and `CardDeck` tests in `client/src/components/`.

## Out of Scope

- Changes to the Socket.IO communication contracts or backend `GameEngine` business logic.
- Adding new predefined `Card Deck` configurations or altering estimation card values.
- Replacing the lightweight React modal portal with an external component library.
- Modifying the corporate color palette tokens (`#991355`, `#f2f2f2`) established in the corporate design theme.

## Further Notes

- All layout adjustments integrate directly with the CSS custom property token system (`--border-color`, `--card-bg`, `--text-primary`, `--bg-secondary`, `--accent-color`), ensuring seamless rendering across Light Mode and Dark Mode.
- Adheres to ADR 0002 (React 19, Vite 8, Vitest) and the project's layered frontend architecture (`GameProvider` -> `useGame` / `useGameStore` -> `socketService`).
