# Tutorial copy

Tutorial steps (`apps/web/components/tutorials`) have one wording for the desktop and the phone layout, not one per device.

- A tutorial's title, tagline, description, category, number, initial route and step count live in `components/tutorials/meta.ts`, which its `index.ts` spreads (`...tutorialMeta("<id>")`): the home page and the project switcher show them from the app shell, before the SDK loads. A new tutorial gets its entry there, in order; `index.ts` checks the ids and step counts against the tutorials in dev.
- Below `lg`, the pages' create buttons ("Create new account", "Create new script", "Add note"…) and the note page's "Consume note with …" show their icon only: name them with `ButtonName` (`prose.tsx`), which shows the icon and the label. Labelled buttons and menu items take `<em>"…"</em>`.
- Refer to places outside the panel only if they hold on both layouts ("above the editor", "next to the procedure", "at the top of the page"), or link to them: on a phone the sidebar is hidden, and the panel sits at the bottom.
- "Click" is fine on both.
