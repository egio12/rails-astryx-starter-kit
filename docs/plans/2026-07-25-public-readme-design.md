# Public README design

## Goal

Turn the repository README into a concise public landing page for developers discovering the
starter kit on GitHub. Lead with the value of the template, make the first run obvious, and keep
implementation details only when they help someone evaluate or use the project.

## Audience

Developers looking for a modern Rails and React starting point. They may know either side of the
stack, but should not need prior knowledge of this repository or its migration history.

## Editorial direction

Use a product-first structure:

1. A centered title, one-sentence positioning, and a restrained row of version/license badges.
2. A short explanation of why the starter kit exists.
3. A scannable overview of the production-ready capabilities included.
4. One compact Mermaid diagram showing the Rails → Inertia → React flow.
5. A quick-start section close to the top.
6. A compact stack overview and only the conventions users must know before editing the project.
7. Essential development commands, deployment guidance, credits, and license.

The README remains in English so it works for an international GitHub audience.

## Content changes

- Remove migration history and comparisons with previously used UI libraries.
- Replace the exhaustive layer-by-layer stack table with a shorter overview.
- Summarize authentication, account settings, sessions, appearance, type generation, SSR, testing,
  CI, and deployment around outcomes rather than low-level implementation.
- Keep the development seed account clearly identified as local-only demo data.
- Keep the generated-file warning because editing generated routes or types would cause real user
  friction.
- Retain links to deeper project files where configuration details already live.

## Visual treatment

Use native GitHub Markdown only. Add a small badge row and one Mermaid diagram; avoid banners,
decorative emoji, screenshots, or custom artwork that would add maintenance burden or overwhelm the
page.

## Verification

- Cross-check retained framework claims against the pinned dependency files and official
  documentation.
- Verify commands and linked paths exist.
- Render-check the Markdown structure and Mermaid syntax.
- Scan every tracked file for likely personal data, live credentials, secrets, tokens, private
  keys, real hosts, and repository-specific identifiers before publication.
- Preserve unrelated working-tree changes.
