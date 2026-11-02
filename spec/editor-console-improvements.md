# Scripts editor and console improvements

Status: proposal, written 2026-11-02. Done: item 1 (PR #731), item 2.

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
| 3   | A real console (history, levels, timing, warnings, clear) | 5      | S–M    | P1       |
| 4   | Cleaner compiler output, with a "show full output" toggle | 4      | S      | P1       |
| 5   | IDE-style resizable layout, console panel states          | 4      | S–M    | P1       |
| 6   | Keyboard shortcuts (compile, console)                     | 3      | S      | P1       |
| 7   | MASM syntax highlighting                                  | 3      | S      | P2       |
| 8   | Miden SDK autocomplete, snippets and hover docs           | 4      | M / L  | P2       |
| 9   | Tutorials next to the live editor                         | 4      | M      | P2       |
| 10  | Fill in boilerplate automatically on compile              | 3      | M      | P2       |
| 11  | Call a script's procedures from its page                  | 4      | M–L    | P2       |
| 12  | Header and tabs (name, dirty state, open scripts)         | 3      | S–M    | P2       |
| 13  | Format code (rustfmt)                                     | 2      | M      | P3       |
| 14  | Editor settings (word wrap, Vim, font size)               | 2      | S      | P3       |
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

### 2. Compile errors in the editor (P1, impact 5, effort M)

Solana Playground: error markers in the overview ruler; TS diagnostics on
hover with "View Problem".

Done. What shipped:

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

### 4. Cleaner compiler output (P1, impact 4, effort S)

Solana Playground: "Improve build errors" setting, on by default, with a note
telling how many errors were hidden and how to see everything.

Proposal: by default drop lines that don't help the user:
`Command failed: cargo miden build --release --offline`, `Compiling … (/tmp/
miden-project-…)`, the `wide-arithmetic` unstable-feature warning and its
note, and rewrite `/tmp/miden-project-XXXX/<name>/` paths to nothing. Add a
"Show full output" toggle in the console. Do it in the web app (pure
function over the text, unit-testable) so the raw output stays available.

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

### 6. Keyboard shortcuts (P1, impact 3, effort S)

Solana Playground: every button tooltip shows its shortcut.

Proposal: Cmd/Ctrl+S and Cmd/Ctrl+Enter to compile (register through Monaco
`addCommand` so they work while the editor has focus, and prevent the
browser's "save page"), Cmd/Ctrl+J to toggle the console, Cmd/Ctrl+L to clear
it. Show them in tooltips (`Compile (⌘S)`).

### 7. MASM syntax highlighting (P2, impact 3, effort S)

Today the MASM tab uses Monaco's `javascript` language, so MASM is colored as
JavaScript. Register a `masm` language with a Monarch tokenizer (comments
`#`, keywords `proc`, `export`, `begin`, `end`, `if.true`, `else`, `while.true`,
`repeat`, `use`, instructions, numbers, hex, procedure names). Reuse an
existing grammar if one is published (e.g. from the Miden VS Code extension).

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

### 12. Header and tabs (P2, impact 3, effort S–M)

- Breadcrumb: the script name (`counter-account`) instead of its UUID.
- A dirty indicator (dot) while the script is a draft that differs from the
  last compile, and the compile status (draft / compiled / error) next to the
  name, not only in the sidebar.
- Later: tabs for several open scripts, and showing `miden-project.toml` as a
  read-only (or editable) file next to `lib.rs`.

### 13. Format code (P3, impact 2, effort M)

Solana Playground has `rustfmt` and `prettier` commands. Proposal: a
"Format" button and Shift+Alt+F running rustfmt, either in api-compile (new
endpoint) or as rustfmt WASM in the browser. Optional format on compile.

### 14. Editor settings (P3, impact 2, effort S)

Word wrap toggle (always on today), Vim keybindings (`monaco-vim`), font size,
minimap. Stored in local settings.

### 15. Command menu (P3, impact 2, effort L)

Solana Playground's terminal (commands, history, inline suggestions,
interactive prompts) is powerful but large. For a form-driven app, a Cmd+K
command menu (stock shadcn `command`) covers most of it: compile, open a
script, create an account from a component, toggle the console, switch
network.
