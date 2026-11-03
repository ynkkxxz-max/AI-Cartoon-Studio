# Workspace design handoff — 2 November 2026

The owner's latest five references supersede the earlier all-panels dashboard. The live application now has five separate workspaces under the same shell:

- `/#dashboard`: introduction, actual project count, two workflow entrypoints and real recent projects.
- `/#create`: named story draft, editable story/settings/languages and an optional character selector.
- `/#editor`: the real local editor, with a guided upload-first state and advanced controls appearing after a source is selected.
- `/#projects`: persisted projects, search and read-only draft details.
- `/#library`: real characters, voice presets and uploaded videos.
- `/#settings`: actual backend, FFmpeg and disk status.

## Design system

App.tsx owns navigation and the shared shell. index.css owns navy surfaces, restrained lavender/teal accents, type scale, borders, rounded corners, spacing and breakpoints. The sidebar occupies its own column; the topbar occupies its own non-scrolling row. Only main content scrolls. Do not restore the old sticky-header/all-panels layout over the owner's new reference direction.

CreateVideoCard, CharacterSection and VoiceEnginePanel retain real API calls. ClipTimelineEditor retains the working /api/editor/timeline endpoints. Story and editor components stay mounted after first visit, preserving draft inputs and clip selections while moving between workspaces within the current session. Page reload persistence of the timeline remains future work.

Characters now render the full actual library, including custom additions, rather than the first four only. Flags cropped from the old screenshot were replaced by clean language-code badges. Story creation is correctly labelled as saving a draft; provider-driven AI cartoon generation is still pending. The hero uses code-native orbital artwork; no generated banner asset is referenced. The built-in image-generation attempt did not produce a usable asset. A CLI/API fallback exists but requires OPENAI_API_KEY and an explicit request; it was not used.

## Verification

- TypeScript build check passes.
- Two-page Vite production build passes with installed React/Tailwind plugins and explicit sandbox configuration (ordinary npm config bundling still has the previously recorded ancestor-directory permission limitation).
- Browser tested all five main screens on the normal desktop viewport and narrow viewport measuring 400 CSS pixels. No horizontal overflow in any workspace.
- Confirmed fixed shell / independently scrolling main content, real project search/empty results, five actual characters, real 4-second uploaded-media playback, and preservation of story-form text and timeline clips across navigation.
- No new paid AI calls or new dependencies.

Antigravity's existing backend and original components remain in the shared project. The current layout is documented here for coordinated future feature work; no direct Antigravity acknowledgement was observed. Backend provider work can continue against the existing typed API without rewriting the workspace shell.

## Character deletion added
Each character has a visible Delete action with an accessible confirmation dialog and Undo. DELETE /api/characters/{id} archives the profile via deleted_at; POST /api/characters/{id}/restore restores it. Existing project snapshots retain their character IDs. The migration preserves prior rows and deleted defaults do not reappear after restart. Four isolated regression tests pass. Browser confirmation/cancel, five visible delete buttons, and the repaired monkey fallback avatar were verified without deleting existing user characters.

## Full-body character artwork
The owner reported the small screenshot-cropped avatars were incomplete/blurry. CharacterSection now uses larger responsive artwork cards and an accessible enlarge dialog. A newly generated 1774x887 five-column image lives at public/characters/character-lineup-v2.png. Each column is a 2:5 portrait cell: boy,girl,man,elder,monkey. CSS sprite backgrounds preserve the source proportions; the monkey enlarges within its whitespace while its complete silhouette stays visible. Custom images use object-fit:contain. Existing profile IDs, selection, audition and deletion callbacks remain unchanged. Original source assets were preserved. Desktop/mobile overflow and zoom-close behavior were checked.
