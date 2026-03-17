---
name: tfiction-doc-sync
description: Sync README.md and docs/功能需求说明.md for GO_Tfiction whenever tasks change user-facing behavior, supported formats, boss mode, bookshelf/reader/settings flows, setup commands, storage paths, platform differences, or visual design.
---

# Tfiction Doc Sync

Use this skill when:

- the user asks to update docs, requirements, README, or project description
- code changes affect bookshelf, reader, boss mode, settings, storage, shortcuts, routes, supported formats, or developer commands
- UI or interaction changes alter what users see or how they operate the app

## Source of truth

Check code first, not memory:

- `frontend/src/pages/`
- `frontend/src/components/features/`
- `frontend/src/stores/`
- `backend/services/`
- `backend/app/`
- `frontend/package.json`
- `wails.json`
- `go.mod`
- `config/`

## Files to sync

- `README.md`
  Keep this concise. It should describe what the project is, what currently works, what is only a placeholder, platform differences, and the correct development commands.

- `docs/功能需求说明.md`
  Keep this detailed. It should describe product goals, page responsibilities, interaction rules, visual style, platform constraints, persistence rules, and current gaps.

## Required workflow

1. Inspect the actual code paths that changed.
2. Decide whether the change is user-visible, setup-visible, or design-visible.
3. Update `README.md` if the overview, setup, support matrix, or platform notes changed.
4. Update `docs/功能需求说明.md` if behavior, interaction, settings, design language, or constraints changed.
5. Be explicit about placeholders and unsupported features. Do not advertise them as complete.

## Tfiction-specific checks

- TXT / EPUB support is real; PDF / MOBI / AZW3 are not fully implemented.
- Reading statistics is currently a placeholder UI unless real data plumbing has been added.
- macOS native boss-mode overlay is platform-specific and should be documented separately from generic WebView stealth mode.
- Storage settings show the real local app data path; imported books still keep their original local file paths.
- Reader content and EPUB images must remain constrained to the reading content area and not overflow decorative frame regions.

## When docs may stay unchanged

Docs can remain unchanged for pure refactors, invisible bug fixes, tests, comments, or internal cleanups.  
If you skip doc updates, mention that decision clearly in the final response.
