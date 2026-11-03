# Issue tracker: Local Markdown (`docs/`)

Issues and specs for this repo live as local markdown files under `docs/prd/` and `docs/issues/`.

## Conventions

- **PRDs & Specs**: One file per feature/spec at `docs/prd/<feature-slug>.md`.
- **Implementation issues / tickets**: One file per ticket at `docs/issues/<NN>-<slug>.md` (or `docs/issues/<feature-slug>/<NN>-<slug>.md`), numbered from `01`, never a single combined tickets file.
- **Triage state**: Recorded as a `Status:` line near the top of each issue/spec file (see `docs/agents/triage-labels.md` for the role strings).
- **Blocking edges**: Recorded via a `Blocked by: <NN>, <NN>` line near the top of each ticket file, or `None (can start immediately)`.
- **Comments and conversation history**: Appended to the bottom of the file under a `## Comments` heading.

## When a skill says "publish to the issue tracker"

- If publishing a spec (`/to-spec`), create a new file under `docs/prd/<feature-slug>.md` (creating the directory if needed).
- If publishing tickets (`/to-tickets`), create one file per ticket under `docs/issues/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path under `docs/issues/` or `docs/prd/`. The user will normally pass the path or the issue number/slug directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `docs/prd/<effort>-map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `docs/issues/<effort>/<NN>-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `docs/issues/<effort>/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far.
