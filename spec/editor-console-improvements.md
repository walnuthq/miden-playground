# Scripts editor and console improvements

Status: proposal, written 2026-11-02; the first pass shipped 2026-11-03.
Done: item 1 (PR #731), item 2 (PR #732), item 3 (PR #735), item 4 (PR
#736), item 5 (PR #737), item 6 (PR #742), which completes the "editor and
console" pass (see "Scoring"), item 7 (PRs #745 and #746), item 12 (PRs #747
and #748: header, Explorer with file tabs), item 14 (PR #749: minimap and font
size; word wrap and Vim dropped), item 11 (PRs #831 to #834: the console's
Simulate tab). Next: the P2 items 8 to 10, each a separate product decision;
then 13 and 15, and item 11's follow-ups.

The code editor UX of the scripts feature (`/scripts/:id`) is behind other
blockchain playgrounds. This document compares it with Solana Playground
(<https://beta.solpg.io>), based on a hands-on run of its "Hello Anchor"
tutorial (<https://beta.solpg.io/tutorials/hello-anchor>), and lists what we
could bring into Miden Playground, scored by impact and effort.

## How this was evaluated

### Solana Playground run (2026-11-02)

- Started the "Hello Anchor" tutorial, wrote the Anchor program in the editor,
  built it, connected the built-in "Playground Wallet", explored the terminal
  (`help`) and settings, added a client (`client.ts`) and ran it.
- The run could not be completed end to end: deploying needs devnet SOL, and
  the devnet RPC faucet is closed (`410 … The RPC faucet is closed on this
  cluster. Request test SOL at https://faucet.solana.com`, which requires a
  captcha or GitHub login). The client call (`pg.program.methods.hello().rpc()`)
  then fails with `Cannot read properties of undefined (reading 'methods')`,
  and the auto-generated "Test UI" shows `Anchor IDL not found.`.

### Miden Playground run (production, same day)

- Launched the "Counter Contract" example from the home page, opened
  `counter-account`, introduced a syntax error, compiled, reverted, recompiled
  (~4 s), then switched to `increment-note` from the sidebar (this surfaced
  the P0 bug below).

## What Solana Playground does well

Layout (left to right): activity bar (Explorer, Build & Deploy, Test,
Tutorials, Programs, GitHub, Settings), a side panel, the Monaco editor with
file tabs, the tutorial text on the right, and a terminal docked at the bottom.
A status bar at the very bottom shows the wallet connection, the cluster
(Devnet), the wallet address (with an explorer link) and its balance.

Editor:

- Monaco with file tabs (`lib.rs`, `client.ts`, close with Alt+W) and a file
  explorer (new file/folder, rename, delete, import from GitHub or the local
  file system, export, share).
- Rust language intelligence in the browser: a CodeLens (`0 implementations`)
  above `pub struct Hello {}`, and a `msg` snippet (type `msg` + Enter in a
  function body inserts `msg!(…)`).
- Full TypeScript checking for client scripts, with typed globals (`pg.*`).
  Hovering an error shows the TS diagnostic (`Property 'program' does not
  exist on type … (2339)`), a "View Problem (⌥F8)" link and quick fixes.
- Error markers in the overview ruler (right scrollbar).
- On build, the program id is filled into `declare_id!("")` automatically.
- Settings: editor keybinding (default, Vim, …), word wrap; build "Improve
  errors"; connection (commitment, endpoint, priority fee, preflight checks);
  block explorer; transaction toasts.

Terminal (xterm.js):

- Three states: minimized (a thin bar), normal (bottom panel), maximized (over
  the editor), with Clear (Cmd+L), Toggle Maximize (Cmd+M) and Toggle Minimize
  (Cmd+J) buttons. Every button tooltip shows its shortcut.
- A real prompt (`$`) with commands: `airdrop`, `anchor`, `build`, `clear`,
  `connect`, `deploy`, `help`, `prettier`, `run`, `rustfmt`, `setting`,
  `solana`, `spl-token`, `sugar`, `test`. Fish-style inline suggestions from
  history (typing `h` shows a ghost `elp`).
- Interactive prompts inside the terminal (`You don't have enough SOL … Would
  you like to request an airdrop? [yes/no] (default: yes)`).
- Colored, structured output: `Building...` (blue), `Build successful.
  Completed in 4.07s.` (green), `warning:` (yellow), `error:` (red), `Note:`
  (blue). Warnings are shown on a successful build (e.g. unused `ctx`, with
  the compiler's suggestion).
- "Improve build errors" (on by default) shortens rustc output and says so:
  `Note: This is a shorter version of the error logs to make it easier to
  debug. Currently 3 errors are displayed but there are 4 errors. Disable
  "Improve build errors" setting to see the full error output.`
- Output is appended (a history of runs), not replaced.
- `console.log` from client scripts is streamed into the terminal, grouped
  under the file name (`client.ts:`), and uncaught errors are shown in red.

Tutorials:

- The tutorial text sits next to the live editor and terminal; code blocks
  are syntax highlighted; Previous/Next navigation; progress is tracked
  ("Ongoing → 1", START becomes CONTINUE).

Test UI:

- An auto-generated UI from the program's IDL to call each instruction (only
  accounts must be filled in), reporting `✅ Test passed.`.

## What to avoid copying

- The terminal starts minimized when a tutorial opens, so build output is
  hidden until the user finds the expand button. Our console should open by
  itself when a compile starts.
- The same faucet error is printed twice after the airdrop prompt.
- Deploy fails at the airdrop step with a raw JSON-RPC error. Our faucet flow
  is already better.
- Typed commands are a lot of surface (and hard to automate in e2e); a command
  menu (Cmd+K) gets most of the benefit for a form-driven app like ours.

## Our current implementation

As of the proposal, before items 1 and 2: see their "Done" notes for what
changed since.

- `apps/web/pages/script.tsx`: the `/scripts/:id` route; renders
  `components/script/index.tsx`, which fetches the script from the API when it
  isn't in local state and renders `components/script/script.tsx`.
- `apps/web/components/script/script.tsx`: tabs `Rust` / `MASM` (only when
  `script.masm` is set) / `Metadata`, the tab is kept in `?tab=`. The editor
  height is fixed (`61vh`, or `85vh` read-only); the console is rendered below
  it when the script isn't read-only and the tab isn't `metadata`.
- `apps/web/components/lib/editor.tsx`: `@monaco-editor/react` 4.7.0, theme
  `vs-dark`/`light` from `next-themes`, `defaultLanguage` `rust`, or
  `javascript` for MASM, `defaultValue` the script's `rust` or `masm`, options
  `minimap: false`, `wordWrap: "on"`, `scrollBeyondLastLine: false`. Every
  change dispatches `updateScript({ id, status: "draft", rust, masm: "" })`.
- `apps/web/components/script/editor-console.tsx`: a `Card` titled "Editor
  Console" with a Compile / Re-compile button and a `h-32` scrollable `<pre>`.
  Its content is local state that is replaced on each compile, either with
  `compiledScript.error` (all red when `script.error` is set) or with `Script
  compiled successfully.`. A failed request shows a toast.
- `apps/web/hooks/use-scripts.ts` (`compileScript`) calls the API, which
  calls api-compile (`apps/api/lib/utils.ts`, `compilePackage`). api-compile
  returns `{ stdout, stderr, masp, commitment, manifest, files }`. When
  `stdout === ""` and `stderr !== ""` the package is stored with
  `status: "error"` and `error: stderr`. On success `stderr` (warnings) is
  dropped and never reaches the web app.
- Available shadcn components in `packages/ui` include `resizable`, `command`,
  `tabs`, `tooltip`, `sheet` (stock files, never edited; see CLAUDE.md).
- Tutorials don't embed the editor; they send the user to the script page
  (e.g. `deploy-a-counter-contract/step2.tsx`: "the editor console to compile
  your script", `timelock-p2id-note/step3.tsx`: "click the Compile button in
  the editor").

What the user sees today, from the production run:

- The breadcrumb shows the script UUID (`Scripts > 8f959a85-…`), not its name.
- Compile errors print the whole cargo output in red, noise included:

  ```
  Command failed: cargo miden build --release --offline
     Compiling counter-account v0.1.0 (/tmp/miden-project-B46omH/counter-account)
  warning: unstable feature specified for `-Ctarget-feature`: `wide-arithmetic`
    |
    = note: this feature is not stably supported; its behavior can change in the future

  error: expected one of `!` or `::`, found doc comment `/// Increments …`
    --> src/lib.rs:26:5
  ```

  Nothing is marked in the editor, and `src/lib.rs:26:5` isn't clickable.
- A successful compile prints only `Script compiled successfully.`: no time,
  no warnings.
- The console is a small card under a fixed-height editor; on a 1000 px high
  window the page scrolls.

## Scoring

- **Impact** 1–5: how much it improves writing, compiling and debugging a
  script, and how many users hit it.
- **Effort**: S (≤ 1 day), M (a few days), L (a week or more, or new
  infrastructure).
- **Priority**: P0 bug, fix now; P1 next pass; P2 plan; P3 nice to have.

| #   | Improvement                                               | Impact | Effort | Priority |
| --- | --------------------------------------------------------- | ------ | ------ | -------- |
| 1   | Fix stale editor on script switch                         | 5      | S      | Done     |
| 2   | Compile errors in the editor (markers, click to jump)     | 5      | M      | Done     |
| 3   | A real console (history, levels, timing, warnings, clear) | 5      | S–M    | Done     |
| 4   | Cleaner compiler output, with a "show full output" toggle | 4      | S      | Done     |
| 5   | IDE-style resizable layout, console panel states          | 4      | S–M    | Done     |
| 6   | Keyboard shortcuts (compile, console)                     | 3      | S      | Done     |
| 7   | MASM syntax highlighting                                  | 3      | S      | Done     |
| 8   | Miden SDK autocomplete, snippets and hover docs           | 4      | M / L  | P2       |
| 9   | Tutorials next to the live editor                         | 4      | M      | P2       |
| 10  | Fill in boilerplate automatically on compile              | 3      | M      | P2       |
| 11  | Call a script's procedures from its page                  | 4      | M–L    | Done     |
| 12  | Header and tabs (name, dirty state, open scripts)         | 3      | S–M    | Done     |
| 13  | Format code (rustfmt)                                     | 2      | M      | P3       |
| 14  | Editor settings (minimap, font size)                      | 2      | S      | Done     |
| 15  | Command menu (instead of a terminal)                      | 2      | L      | P3       |

Suggested order: 1 now; 2–6 together as one "editor and console" pass (mostly
a layout, a console log state and a parser for compiler output); 7–12 as
separate product decisions; 13–15 when there's time.

## Items

### 1. Fix stale editor on script switch (P0, impact 5, effort S)

Problem: switching scripts without leaving the route (sidebar, or any link
from `/scripts/A` to `/scripts/B`) keeps script A's code in the editor and
A's output in the console, while the URL and breadcrumb show B. Reproduced in
production: from `counter-account`, clicking `increment-note` in the sidebar
kept the counter-account Rust on screen; a reload showed the note's code.

Cause: `components/lib/editor.tsx` passes `defaultValue` to Monaco with no
`key` or `path`. React Router reuses the page component when only `:id`
changes, so the Monaco instance and its model survive and `defaultValue`
isn't applied again. `editor-console.tsx` keeps its `content` state for the
same reason. `onChange` closes over the new `script.id`, so typing in that
state would likely save A's source as B's `rust` (and set B to `draft`).

Fix: remount the script page per id: `<Script key={id} id={id} />` in
`pages/script.tsx`. This also resets the console output and any other local
state of the page.

Acceptance: switch between two scripts from the sidebar; the editor shows
each script's code, the console is empty after the switch, and editing B
never changes A.

Done in PR #731, as described above.

### 2. Compile errors in the editor (P1, impact 5, effort M)

Solana Playground: error markers in the overview ruler; TS diagnostics on
hover with "View Problem".

Done in PR #732. What shipped:

- `lib/utils/diagnostics.ts` parses rustc's rendered diagnostics out of
  `script.error`: severity, code, message with its `help:` / `note:` lines,
  and the primary span (`-->` location, width from the carets). Summaries
  (`could not compile …`, `generated 1 warning`) and diagnostics without a
  location are skipped. Unit tests (`pnpm test` in apps/web) run on real
  api-compile outputs in `lib/utils/fixtures/compile-errors/`.
- `components/lib/editor.tsx` sets Monaco markers for `src/lib.rs` (squiggles,
  overview ruler, hover, F8). They stay until the next compile and follow
  edits: decorations track them, and the markers are moved on each change.
  A successful compile clears them.
- The console renders `src/lib.rs:L:C` as links that put the cursor there,
  following edits made since the compile, and switch to the Rust tab first
  when clicked from another tab. The console starts with the last error (kept
  in local state). It now shows on every tab, Metadata included (it used to
  be hidden there): dependencies change the compile result, and unmounting it
  lost its output. The Rust tab stays mounted, so markers, undo history and
  the console survive a look at the Metadata tab.
- E2E: `e2e/script-diagnostics.spec.ts`.

Why the text is parsed instead of cargo's JSON: `cargo miden build` forwards
its arguments to midenc, which already runs cargo with `--message-format
json-render-diagnostics` but keeps only the `.wasm` artifacts from the JSON
(`midenc-compile/src/rust.rs`, `run_cargo_inner`). Getting structured
diagnostics would take a compiler change first, then api-compile, the API and
the database.

Limits:

- The API doesn't store the error text, so a script fetched from the API in
  error (another browser, a shared link) shows no markers until it's compiled
  again.
- midenc's own errors (after rustc succeeds) aren't parsed. None came up while
  testing; add their format if they point at `src/lib.rs`.

### 3. A real console (P1, impact 5, effort S–M)

Solana Playground: appended output, `Building...` / `Build successful.
Completed in 4.07s.`, warnings shown on success, colors per level, Clear
(Cmd+L).

Proposal:

- Keep a log of entries `{ timestamp, level: info | success | warning |
  error, text, durationMs? }` per script (in memory is enough; maybe per
  session), appended on each compile.
- `Compiling counter-account…` when it starts, then `Compiled in 3.9 s` or
  `Compilation failed in 2.1 s (1 error, 1 warning)`.
- Show warnings on success: the API must return the compiler's `stderr` on
  success too (today `compilePackage` drops it), e.g. as `warnings` or
  `output`.
- Color per level with theme tokens (`text-destructive`, a warning color,
  `text-muted-foreground` for info), instead of making the whole `<pre>` red.
- Clear button, auto-scroll to the bottom, copy output.
- Request failures (network, 5xx) go in the console as errors, and the toast
  can stay for when the console is hidden.

Done in PR #735. What shipped:

- `lib/console-log.ts`: the log, per script id, in a module-level store read
  with `useSyncExternalStore`. In memory only (not in `State`, not saved with
  projects): it survives script switches and tabs, not a reload. A script
  whose last compile failed starts with a `Last compile failed` entry.
- Entries `[HH:MM:SS] summary` colored by level (info muted, success
  `text-success`, warning a new `--warning` token, error `text-destructive`),
  then the compiler output, its `error…:` / `warning…:` header lines colored
  (`outputLineSeverity`). Summaries: `Compiling <name>…`, `Compiled <name> in
  3.9 s (1 warning).`, `Compilation failed in 2.1 s (1 error).`, with the
  counts from the located diagnostics (`countDiagnostics`), and `Compile
  request failed after …: <message>` (the toast stays).
- Only the latest compile's entry links its locations: the editor follows
  edits from that compile only. Older entries show them as dimmed text.
- Copy (the whole log as text) and Clear buttons; auto-scroll to new entries
  unless scrolled up; the log is `h-48` until item 5.
- The API returns a successful build's stderr as `warnings` (not stored, like
  `error`). The console shows it only when it has located warnings (the
  `wide-arithmetic` note alone is noise), and the editor marks them.
- E2E: `e2e/script-diagnostics.spec.ts` (history, warnings, clear); the
  compile success text the tutorials' specs wait for is `COMPILED` in
  `e2e/editor.ts`.

### 4. Cleaner compiler output (P1, impact 4, effort S)

Solana Playground: "Improve build errors" setting, on by default, with a note
telling how many errors were hidden and how to see everything.

Proposal: by default drop lines that don't help the user:
`Command failed: cargo miden build --release --offline`, `Compiling … (/tmp/
miden-project-…)`, the `wide-arithmetic` unstable-feature warning and its
note, and rewrite `/tmp/miden-project-XXXX/<name>/` paths to nothing. Add a
"Show full output" toggle in the console. Do it in the web app (pure
function over the text, unit-testable) so the raw output stays available.

Done in PR #736. What shipped:

- `lib/utils/compiler-output.ts` (`cleanCompilerOutput`), applied when
  rendering only: the stored output, the markers and the counts use the raw
  text. It drops the lines above, plus cargo's `Finished …` line and its
  summaries (`generated N warnings`, `could not compile …`): their counts
  included the hidden `wide-arithmetic` warning, and the console's summary
  already gives them. Only the `/tmp/miden-project-XXXX/` prefix is stripped
  from paths, not the package directory, so a dependency's `src/lib.rs` never
  links to the script's own file. Blank lines are collapsed.
- `rustc --explain EXXXX`, which can't be run here, becomes a link to
  `https://doc.rust-lang.org/error_codes/EXXXX.html`; web links in the output
  open in a new tab.
- A "Show full output" toggle in the console header, kept in localStorage
  for every script; Copy copies what's shown. A successful compile keeps its
  stderr in the entry, so the full view shows it, and the clean view shows
  nothing when it's only noise. No per-entry "N lines hidden" note.
- Unit tests over every fixture (no diagnostic lost, idempotent); e2e step
  in `e2e/script-diagnostics.spec.ts`.

### 5. IDE-style resizable layout (P1, impact 4, effort S–M)

Solana Playground: bottom terminal with minimized / normal / maximized states
(Cmd+J, Cmd+M), editor filling the rest.

Proposal:

- Use the stock shadcn `Resizable` (`packages/ui/src/components/
  resizable.tsx`) for a vertical split: editor on top, console below; the
  page fills the viewport (no outer scroll); remember sizes.
- Console states: collapsed (header bar only), normal, maximized. It opens
  itself when a compile starts.
- Replace the fixed `61vh` / `85vh` / `h-32` heights.
- Keep the `Rust` / `MASM` / `Metadata` tabs above the editor.

Done in PR #737. What shipped:

- The script page is the viewport's height below the header (`100svh` minus
  `h-16`, or `h-12` with the icon sidebar); the window no longer scrolls. The
  tabs stay on top, then a vertical `Resizable` split: the tab content
  (editor, MASM, or the metadata, which scrolls inside it) above, the console
  below. A read-only script has no console, and its editor fills the page.
- Sizes are saved in localStorage (`useDefaultLayout`, id
  `script-editor-layout`), after drags only: the buttons' states aren't
  saved, so a reload never opens with the editor hidden.
- The Compile button sits at the right of the tabs row (where IDEs put
  Run), not in the console: `hooks/use-compile-script.ts` compiles and logs.
- The console is a square bordered panel docked under the editor (no gap, no
  bottom padding), not a `Card`, so its collapsed height is exact
  (`CONSOLE_HEADER_HEIGHT`). It has no title: its header bar shows the latest
  log line, as one text node (`[10:25:25] Compiled counter-account in 3.9
  s.`), or the empty log's placeholder, so a minimized console still reads
  as a status bar. Its accessible name stays "Editor Console". Ghost icon
  buttons on the right: Minimize / Restore console collapses it to that bar;
  Maximize console / Restore editor collapses the editor panel; then full
  output, copy and clear. The state comes from the panels (`isCollapsed`),
  not from separate state, so drags and buttons agree.
- A compile opens a collapsed console, and a location link shows a hidden
  editor before moving the cursor.
- E2E: `e2e/script-layout.spec.ts` (no page scroll, minimize then compile,
  maximize then a location, a dragged size kept across a reload).

### 6. Keyboard shortcuts (P1, impact 3, effort S)

Solana Playground: every button tooltip shows its shortcut.

Proposal: Cmd/Ctrl+S and Cmd/Ctrl+Enter to compile (register through Monaco
`addCommand` so they work while the editor has focus, and prevent the
browser's "save page"), Cmd/Ctrl+J to toggle the console, Cmd/Ctrl+L to clear
it. Show them in tooltips (`Compile (⌘S)`).

Done in PR #742. What shipped:

- Cmd+S and Cmd+Enter (Ctrl elsewhere) do what the Compile button does: open
  a collapsed console, compile, log. Edits are already kept locally on every
  keystroke, and the API only gets the source with a compile (`PATCH
  /scripts/:id` saves and compiles), so compiling is the save. Cmd+J toggles
  the console (a maximized one collapses, like VS Code's panel), Cmd+L clears
  it. No maximize shortcut: macOS keeps Cmd+M to minimize the window.
- One capture-phase `keydown` listener on the window
  (`hooks/use-script-shortcuts.ts`), not Monaco's `addCommand`: the
  shortcuts work wherever the focus is (console, Metadata tab), standalone
  Monaco shares `addCommand` bindings across editors (the page has two), and
  the capture phase runs before Monaco's own bindings (Cmd+Enter inserts a
  line, Cmd+L selects one) and stops the browser's (save page, address bar,
  downloads). Not registered on read-only scripts. Inside a dialog only
  Cmd+S is caught, to stop the save page.
- Cmd or Ctrl follows `navigator.platform`: `userAgentData` follows an
  emulated user agent (Playwright's Desktop Chrome says Windows on a Mac).
- The tooltips of Compile, Minimize / Restore console and Clear console show
  the shortcut with the stock shadcn `Kbd`; the accessible names don't
  change.
- E2E: `e2e/script-shortcuts.spec.ts`.

### 7. MASM syntax highlighting (P2, impact 3, effort S)

Today the MASM tab uses Monaco's `javascript` language, so MASM is colored as
JavaScript. Register a `masm` language with a Monarch tokenizer (comments
`#`, keywords `proc`, `export`, `begin`, `end`, `if.true`, `else`, `while.true`,
`repeat`, `use`, instructions, numbers, hex, procedure names). Reuse an
existing grammar if one is published (e.g. from the Miden VS Code extension).

Upstream sources (2026-11-03):

- The VS Code extension's `syntaxes/masm.tmLanguage.json` has comments,
  strings, numbers and ~15 keywords, no instructions: VS Code colors MASM with
  miden-lsp's semantic tokens.
- tree-sitter-masm (`queries/highlights.scm`) lists the instructions, but was
  last updated for the 0.22 syntax, isn't on npm, and would need a WASM build
  and `web-tree-sitter`. miden-lsp's open PR #12 drops it for the assembler's
  `miden-assembly-syntax-cst`.
- miden-lsp is a native server over a project on disk: not usable in the
  browser as is (see item 8).
- The assembler in miden-vm is the source of truth: its CST parser's
  instruction tables (`spelling`, `prefix`, `keyword`), keyword calls and
  builtin types.

Done in PR #745. What shipped:

- `lib/masm/vocabulary.ts` extracts the keywords, builtin types and
  instructions (153 at v0.35.0) from miden-vm's
  `assembly-syntax/src/parser/cst/{instructions,fragments}.rs` and
  `assembly-syntax-cst/src/parser.rs`. `pnpm masm:sync` writes them to
  `lib/masm/vocabulary.json`, at the tag of the `miden-assembly-syntax` in the
  API's project template lockfile (0.35.0, the web SDK's too); `pnpm
  masm:check` reports drift. It fails if the upstream tables change shape.
- `lib/masm/language.ts`: a `masm` Monarch tokenizer registered in the
  editor's `beforeMount`: doc comments (`#!`), comments, attributes (`@…`),
  keywords, control flow and invocations (`if`, `while`, `exec`, `call`, …),
  instructions (`adv.*` included), builtin types, constants (`UPPER_CASE`,
  `true`), numbers, strings, procedure names and callee paths
  (`exec.tx::get_block_number`). It uses token types the built-in themes
  color, so the Rust tab is unchanged.
- Unit tests for the extraction; e2e `e2e/script-masm.spec.ts` (language,
  token types, colors on a built-in script's MASM tab).

Follow-up in PR #746: compiled Rust scripts get a MASM tab too.

- The API asks api-compile for the build's MASM (`masm: true` in `POST
  /compile`, miden-source-code-verification #78) and stores it in
  `packages.masm`, which existed unused; a failed compile clears it. The
  examples' `compiled.json` carry it (+25 KB gzipped).
- In the web app `script.masm` used to mean "assemble this script from its
  MASM". Compiled Rust scripts now have both a package and MASM that doesn't
  reassemble (it calls library procedures without including them), so the
  account, transaction and note builders branch on `assembledFromMasm`
  (no package) instead.
- The tab shows the latest successful build's MASM: an edit hides it, a
  compile brings it back (since item 12 the tab stays, disabled, see there). The read-only editor follows `script.masm` (Monaco
  `value`), so a compile started from the MASM tab updates it.
- E2E: the compiled script test in `e2e/script-masm.spec.ts`.

### 8. Miden SDK autocomplete, snippets and hover docs (P2, impact 4, effort M / L)

Solana Playground: Rust CodeLens and snippets, typed TS globals.

Options:

- M: static completions and snippets for the Miden Rust SDK: attributes
  (`#[component]`, `#[component_storage]`, `#[account_procedure]`,
  `#[note]`, `#[note_script]`, `#[storage(description = …)]`), types
  (`Felt`, `Word`, `StorageMap`, `AccountId`, `Asset`), common functions
  (`Felt::from_u32`, `felt!`), each with hover docs taken from the SDK's doc
  comments. Snippets for a new account component, note and transaction
  script.
- L: rust-analyzer compiled to WASM in a worker, with the Miden SDK sources
  bundled. Real completions, go to definition, inline errors before
  compiling. Heavy (download size, memory), worth a spike.

### 9. Tutorials next to the live editor (P2, impact 4, effort M)

Solana Playground: tutorial text on the right of the editor and terminal,
Previous/Next, progress tracking.

Proposal: for the tutorials that write code (e.g. "Deploy a counter
contract", "Timelock P2ID note", "Your first smart contract and custom
note"), show the step text in a side panel on the script page instead of
sending the user away. Add "Copy to editor" / "Apply" on code blocks, and
complete the step automatically when the compile succeeds. Must fit the
resumable tutorials (`State.tutorialProgress`, `hooks/use-tutorials.ts`).

### 10. Fill in boilerplate automatically on compile (P2, impact 3, effort M)

Solana Playground fills `declare_id!("")` with the program id on build.

Ideas for us: add missing `use miden::{…}` items the compiler asks for (the
"consider importing" suggestions), or update the `miden-project.toml`
dependencies when the code references a component that's in the sandbox.
Needs care: never rewrite user code silently; offer it as a quick fix (Monaco
code action) instead.

### 11. Call a script's procedures from its page (P2, impact 4, effort M–L)

Solana Playground generates a Test UI from the IDL.

We already have the exported procedures and their signatures
(`procedureExports`, `Signature.params` with `Felt`, `Word`, `AccountId`,
`Asset`). Proposal: on a compiled account component, a panel listing its
procedures with typed inputs and actions: "Create an account with this
component", "Call `get_count`" (read-only), "Call `increment_count`"
(through a transaction script), showing the result and the transaction link
in the console. Reuse the existing account/transaction flows; this is
mostly a shortcut to them.

Done in PRs #831 to #834 (2026-11-13), with miden-source-code-verification
#135 for the schemas, deployed with api-compile. What shipped: a
**Simulate** tab in the console, next to **Output** (the log). It runs the
compiled package locally and shows the account's changes. Nothing is proven,
submitted or saved.
`docs/claude/simulation.md` has the rules.

- #831: the groundwork, with no visible change (`procedureCallScript`,
  `wasmAccountComponent`, `TransactionEffects`,
  `lib/utils/procedure-inputs.ts`).
- #832: the tab for account components, with slots added by hand.
- #833: note and transaction scripts against one of the sandbox's accounts.
- #834: the storage slots listed from the package's schema and one typed
  field per note storage field, from api-compile (`storage`, `noteStorage`)
  through the API's `metadata` column.

- Account components: the package's storage slots, editable, then its
  procedures with an Invoke button each. They run on a throwaway account
  (basic wallet, No Auth, the component) rebuilt on every compile and slot
  edit. Every run starts from the storage shown, at nonce 0; the result
  dialog's "Apply to storage" copies the resulting values into the slots, to
  chain calls.
- Note scripts: a target account, the note's inputs, an optional asset and
  note argument; run as if the account consumed the note.
- Transaction scripts: a target account and the script's one input, its
  `Word` argument (`fn run(_arg: Word, …)`, `withScriptArg`).
- Two engines. Throwaway accounts live in a mock client
  (`MockWasmWebClient`), whose IndexedDB store is always `mock_client_db`,
  apart from the networks' stores: the SDK can't delete an account, and an
  account's id changes with its storage, so the regular client would keep one
  account per edit, in the user's store and saved projects. Note and
  transaction scripts run on the regular client against the real account:
  `executeTransaction` and `executeProgram` write nothing.
- Storage slots (and typed note inputs) come from the package: its account
  component metadata and note storage schema sections, which api-compile
  returns (`storage`, `noteStorage`), then the API (a `metadata` column).
  Until a package has them, slots are added by hand and note inputs are raw
  felts.
- Built from components the account page's Invoke flow can adopt
  (`components/procedures`), with the argument encoding in
  `lib/utils/procedure-inputs.ts`. That flow isn't changed here.

Potential follow-ups. The first four were left out by decision, the last is
a known limit:

- The account page's Invoke flow on `components/procedures`: its dialog
  still has its own form and hardcoded parameter names
  (`getParamsWithNames`).
- For notes and transaction scripts, a target built on the fly from an
  account package instead of an existing account.
- Foreign accounts and advice map inputs in simulations.
- A Simulate tab on read-only scripts, which have no console.
- Accounts whose key isn't in the Playground (Bread, Para, an imported
  wallet) can't be a simulation target: a single-sig account's auth
  procedure asks the keystore for a signature, and the run stops there (see
  the spike). Options, none tested:
  - Disable those accounts in the target dropdown, with the reason, instead
    of failing the run. Needs a reliable "is the key local?" check: No Auth
    accounts are certain, wallets need a keystore lookup or a record of the
    ones the Playground created.
  - Simulate on a clone in the mock client: the account's state, with its
    public key slot replaced by a throwaway key held in the mock keystore.
    The id and code stay the same, so scripts that check the id behave as on
    the real account. To check first: whether the SDK can build an `Account`
    with one slot changed, whether the mock chain accepts an account at
    nonce > 0 it never saw, and guarded multisig (several keys and a
    guardian). It loses foreign accounts: the mock chain has no network.
  - Let the wallet sign. Para would work through its client, with a signing
    modal on every run; Bread can't (`signBytes` signs under a domain tag).
  - Failing those, an upstream request for an executor mode that skips auth
    (`spec/upstream-sdk-issues.md`).
  - Multisig accounts may already work through `executeForSummary`, whose
    auth aborts with an unauthorized event rather than a keystore request:
    only single-sig was tested.
- Hide the target accounts whose code lacks a procedure the script calls,
  from a MAST walk in api-compile: done (2026-11-13), see
  `spec/simulate-target-accounts.md`.

Spike (2026-11-13, SDK 0.17.10, Chromium, testnet sandbox with the Counter
Contract example):

- A mock client starts next to the app's client in ~170 ms and opens
  `mock_client_db` only.
- On it, `newAccount` of an account built from the counter package takes
  10–20 ms, `executeProgram` (`get_count`) 15–35 ms and `executeTransaction`
  (`increment_count`) ~35 ms, at nonce 0, with no `proveBlock`. No fee note.
  A second run still reads the initial value: nothing is persisted.
  `executeProgram` on the raw client returns a `FeltArray` (`get(i).asInt()`),
  not an array.
- On the regular client, a note that was never submitted runs as an
  unauthenticated input (`withInputNotes` with a `NoteAndArgs`), and a
  transaction script takes `withScriptArg`: ~110–160 ms each, and the store
  has the same accounts and notes afterwards.
- An account whose key isn't in the keystore (single-sig Falcon) can't be
  simulated: `executeTransaction` and `executeForSummary` both fail on the
  `miden::protocol::auth::request` event. The tab says so instead of offering
  a summary.

### 12. Header and tabs (P2, impact 3, effort S–M)

- Breadcrumb: the script name (`counter-account`) instead of its UUID.
- A dirty indicator (dot) while the script is a draft that differs from the
  last compile, and the compile status (draft / compiled / error) next to the
  name, not only in the sidebar.
- Later: tabs for several open scripts, and showing `miden-project.toml` as a
  read-only (or editable) file next to `lib.rs`.

Done in PRs #747 and #748. What shipped, in two parts:

Header:

- The breadcrumb of `/scripts/:id` shows the script's name, whatever its id:
  a UUID from the API, `<example>_<uuid>` from the mock API (tutorials 6–8),
  or a built-in's name. A script fetched from the API shares the page's query
  (`hooks/use-script.ts`); an unknown id shows as is, above the not-found
  page.
- Next to the name: a dot while the script is a draft (`status` becomes
  `draft` on every edit, so edited since its last compile, or never
  compiled), not on read-only scripts, and the status badge (Draft /
  Compiled / Error). Both sit outside `BreadcrumbPage`, whose text stays the
  name alone (the tutorials' e2e `openLink` waits on it).
- The breadcrumb no longer wraps: with the tutorial panel open, the name
  truncates and the dot and badge stay.
- Undoing back to the compiled source keeps the draft: the last compiled
  source isn't stored.
- E2E: `e2e/script-header.spec.ts`, and the mock id in tutorial 7.

Explorer (the files part of "Later"; tabs for several open scripts are not
planned):

- The tabs are Explorer (was Rust), MASM and Manifest (was Metadata). The
  Explorer, after miden-source-code-verification's web-viewer, lists the
  script's `src/lib.rs`, `Cargo.toml` and `miden-project.toml` and opens them
  as editor tabs with close buttons, `src/lib.rs` alone at first. The
  manifests are read-only (Monaco's `ini`, there's no TOML language). Built-in
  and mock API scripts have no manifests: their explorer lists `src/lib.rs`.
  The explorer is 215 px wide (resizable, saved after a drag), the width of
  the three tabs above it: the MASM tab always shows, disabled with a tooltip
  until a compile succeeds, so the tabs keep their width. Its panel, opened
  without MASM (a failed compile from it, a `?tab=masm` link), says to
  compile.
- `Script.files` (those 3 files) replaced `Script.rust`, in the web app and
  the API. The API returns them without the `<name>/` prefix they're stored
  under, from every route that returns a package (`GET` returned all 7 stored
  files before). `PATCH /scripts/:id` takes `files["src/lib.rs"]` (the
  legacy `rust`, for web apps loaded before the deploy, was dropped in a
  follow-up). `packages.rust` was dropped on production after the deploy by
  a one-off migration script (it backfilled `files` where they differed:
  none), removed since. Schema changes now ship as Drizzle migrations,
  applied by the api deploy workflow (README, "Database migrations").
  Persisted state, saved projects and tutorial snapshots migrate on load.
- Add / Remove dependency patch `miden-project.toml` right away; the next
  compile replaces it with the API's regenerated file.
- The `src/lib.rs` editor stays mounted while hidden or closed: a console
  link reopens its tab and reveals the location.
- Tutorials 11 and 12 say "Manifest"; tutorial 11 points at the dependency
  in `miden-project.toml`.
- Unit tests for the TOML patch and the file tree; e2e
  `e2e/script-explorer.spec.ts`, tab renames in the other specs.

### 13. Format code (P3, impact 2, effort M)

Solana Playground has `rustfmt` and `prettier` commands. Proposal: a
"Format" button and Shift+Alt+F running rustfmt, either in api-compile (new
endpoint) or as rustfmt WASM in the browser. Optional format on compile.

### 14. Editor settings (P3, impact 2, effort S)

Word wrap toggle (always on today), Vim keybindings (`monaco-vim`), font size,
minimap. Stored in local settings.

Done in PR #749. What shipped:

- A gear button ("Editor settings") in the tabs row, left of Compile, also on
  read-only scripts, opens a menu: Minimap (a checkbox, on by default) and
  Font size (10 to 20 px, default Monaco's own: 12 px on macOS, 14 elsewhere).
  More settings go in that menu.
- One setting for every editor of the page (`src/lib.rs`, the manifests, the
  MASM) and every script, in localStorage (`lib/editor-settings.ts`, key
  `editor-settings`), followed across tabs. Not in `State`, so not saved with
  projects.
- Each editor also has a "Toggle Minimap" action, in its right-click menu
  and the F1 command palette, like VS Code's. It's an `addAction` per editor,
  not an `addCommand` (shared across editors, see item 6).
- Not done: a word wrap toggle (it stays on: scripts are short, and wrapping
  keeps long MASM lines readable without horizontal scrolling) and Vim mode
  (a `monaco-vim` dependency, and its Esc and Ctrl bindings would compete
  with the page's shortcuts, for few users).
- E2E: `e2e/script-editor-settings.spec.ts`.

### 15. Command menu (P3, impact 2, effort L)

Solana Playground's terminal (commands, history, inline suggestions,
interactive prompts) is powerful but large. For a form-driven app, a Cmd+K
command menu (stock shadcn `command`) covers most of it: compile, open a
script, create an account from a component, toggle the console, switch
network.
