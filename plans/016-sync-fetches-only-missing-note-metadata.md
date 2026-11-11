# Plan 016: A sync asks the node only for the note metadata it's missing

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 874bd1a..HEAD -- apps/web/lib/web-client.ts apps/web/hooks/use-app-state.ts apps/web/lib/miden-faucet.ts`
> Plans 010 and 015 edit other parts of `use-app-state.ts`: expected. If
> `clientGetAllInputNotes` or its call in `syncState` changed, compare with
> the excerpts below; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run after 010 if it is in progress: same file)
- **Category**: perf
- **Planned at**: commit `874bd1a`, 2026-11-10

## Why this matters

Every 2.5 s, the sync reads all input notes from the local client (consumed
ones included) and sends one `getNotesById` RPC to the node with all of their
ids. The answer is used for three fields (`type`, `tag`, `senderId`) and only
for notes the app doesn't already know them for; for every other note it is
thrown away. The request and the WASM work grow with the workspace's whole
note history, about 24 times a minute per open tab, against the public
testnet and mainnet nodes. The join is also quadratic, with a WASM call per
comparison.

## Current state

- `apps/web/lib/web-client.ts:101-140`:

  ```ts
  export const clientGetNotesById = ({
    networkId,
    noteIds,
  }: {
    networkId: NetworkId;
    noteIds: string[];
  }) =>
    wasmRpcClient(networkId).getNotesById(
      noteIds.map((noteId) => WasmNoteId.fromHex(noteId)),
    );
  …
  export const clientGetAllInputNotes = async ({
    client,
    networkId,
  }: {
    client: WebClientType;
    networkId: NetworkId;
  }) => {
    const wasmInputNotes = await client.getInputNotes(
      new WasmNoteFilter(WasmNoteFilterTypes.All),
    );
    const wasmFetchedNotes = await clientGetNotesById({
      networkId,
      noteIds: wasmInputNotes
        .map((wasmInputNote) => wasmInputNote.id()?.toString())
        .filter((id) => id !== undefined),
    });
    return wasmInputNotes.map((wasmInputNote) => {
      const wasmFetchedNote = wasmFetchedNotes.find(
        ({ noteId }) => noteId.toString() === wasmInputNote.id()?.toString(),
      );
      wasmInputNote.metadata = () => wasmFetchedNote?.metadata;
      return wasmInputNote;
    });
  };
  ```

- `apps/web/lib/web-client.ts:686-704` — how the metadata is used when a
  record becomes an app `InputNote` (`wasmInputNoteRecordToInputNote`):

  ```ts
  const metadata = record.metadata();
  …
  type: previousInputNote
    ? previousInputNote.type
    : metadata
      ? noteType(metadata)
      : "public",
  …
  // Notes can show up before their metadata is known (e.g. an expected
  // output note): fill these in once it is.
  tag:
    previousInputNote?.tag ||
    (record.metadata()?.tag().asU32().toString() ?? ""),
  …
  senderId:
    previousInputNote?.senderId ||
    (record.metadata()?.sender().toString() ?? ""),
  ```

  So for a note the app already has (`previousInputNote`) with a non-empty
  `tag` and `senderId`, the fetched metadata changes nothing.

- Two callers:
  - `apps/web/hooks/use-app-state.ts:302-305`, inside `syncState`'s
    `Promise.all` (`previousInputNotes` is in scope: the app's current
    `inputNotes`, each with `id`, `tag`, `senderId` strings):

    ```ts
    clientGetAllInputNotes({
      client,
      networkId,
    }),
    ```

  - `apps/web/lib/miden-faucet.ts:214`:
    `const notes = await clientGetAllInputNotes({ client, networkId });`
    It must keep fetching everything.

- `lib/web-client.ts` imports `@miden-sdk/*`: it can't be loaded by the
  `node --test` unit tests.

## Commands you will need

| Purpose       | Command                                                                                 | Expected on success |
| ------------- | --------------------------------------------------------------------------------------- | ------------------- |
| Typecheck     | `cd apps/web && pnpm typecheck`                                                         | exit 0              |
| Unit tests    | `cd apps/web && pnpm test`                                                              | exit 0              |
| Lint + format | `cd apps/web && pnpm exec biome check --write lib/web-client.ts hooks/use-app-state.ts` | exit 0              |

## Scope

**In scope**: `apps/web/lib/web-client.ts` (`clientGetAllInputNotes` only),
`apps/web/hooks/use-app-state.ts` (its call in `syncState` only).

**Out of scope** (do NOT touch):

- `wasmInputNoteRecordToInputNote`, `syncInputNotes`, `noteType`.
- `lib/miden-faucet.ts` (it uses the default: fetch all).
- The sync interval, `client.fetchPrivateNotes()`.
- The filter `WasmNoteFilterTypes.All`: consumed notes are listed in the UI.

## Git workflow

- Branch: `perf/sync-note-metadata` from `main`.
- Conventional commit, e.g. `perf(web): fetch only the missing note metadata on sync`.
- Never add a `Co-Authored-By` line or any AI attribution.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Let the caller name the notes whose metadata is known

Change `clientGetAllInputNotes` to:

```ts
export const clientGetAllInputNotes = async ({
  client,
  networkId,
  knownNoteIds,
}: {
  client: WebClientType;
  networkId: NetworkId;
  // Notes whose metadata the caller already has: not asked for again.
  knownNoteIds?: Set<string>;
}) => {
  const wasmInputNotes = await client.getInputNotes(
    new WasmNoteFilter(WasmNoteFilterTypes.All),
  );
  const noteIds = wasmInputNotes
    .map((wasmInputNote) => wasmInputNote.id()?.toString())
    .filter((id) => id !== undefined)
    .filter((id) => !knownNoteIds?.has(id));
  if (noteIds.length === 0) {
    return wasmInputNotes;
  }
  const wasmFetchedNotes = await clientGetNotesById({ networkId, noteIds });
  const fetchedById = new Map(
    wasmFetchedNotes.map((wasmFetchedNote) => [
      wasmFetchedNote.noteId.toString(),
      wasmFetchedNote,
    ]),
  );
  return wasmInputNotes.map((wasmInputNote) => {
    const id = wasmInputNote.id()?.toString();
    // A note that wasn't asked for keeps its own metadata.
    if (id !== undefined && noteIds.includes(id)) {
      wasmInputNote.metadata = () => fetchedById.get(id)?.metadata;
    }
    return wasmInputNote;
  });
};
```

Use a `Set` for the `noteIds.includes` check if you prefer; keep the
behaviour for fetched notes identical to today's (metadata replaced by the
node's answer, `undefined` when the node has none).

**Verify**: `cd apps/web && pnpm typecheck` → exit 0.

### Step 2: Pass the known ids from the sync

In `syncState` (`hooks/use-app-state.ts`), change the call to:

```ts
clientGetAllInputNotes({
  client,
  networkId,
  // Their type, tag and sender are set: nothing a fetch would change.
  knownNoteIds: new Set(
    previousInputNotes
      .filter(({ tag, senderId }) => tag !== "" && senderId !== "")
      .map(({ id }) => id),
  ),
}),
```

**Verify**: `cd apps/web && pnpm typecheck` → exit 0;
`pnpm exec biome check --write lib/web-client.ts hooks/use-app-state.ts` →
exit 0; `pnpm test` → exit 0;
`grep -n "clientGetAllInputNotes" apps/web/lib/miden-faucet.ts` → the call is
unchanged (two arguments).

## Test plan

- No unit test: the function wraps WASM objects.
- E2E (operator, local: web :3000 + api :3001): the notes' type, tag and
  sender are asserted by the tutorial specs. Run at least
  `e2e/tutorial-1*`, `tutorial-2*`, `tutorial-4*` (private notes),
  `tutorial-8*` (custom note) and `e2e/example-*.spec.ts`. Report plainly if
  you could not run them.
- Manual check for the operator: in a sandbox with a few consumed notes,
  open the browser's Network panel filtered on the node's RPC host: after
  the first sync, `GetNotesById` requests stop appearing until a new note
  arrives.

## Done criteria

- [ ] `cd apps/web && pnpm typecheck` exits 0
- [ ] `grep -n "knownNoteIds" apps/web/lib/web-client.ts apps/web/hooks/use-app-state.ts` → matches in both files
- [ ] `grep -n "wasmFetchedNotes.find" apps/web/lib/web-client.ts` → no match
- [ ] `git status` shows only the two in-scope files (and `plans/README.md`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The excerpts don't match the live code.
- An e2e spec shows a note stuck with an empty sender or tag, or a private
  note shown as public, that was correct before the change.
- `getNotesById` turns out to be needed for something else (e.g. the note's
  state): `grep -n "metadata" apps/web/lib/web-client.ts` shows a use
  outside `wasmInputNoteRecordToInputNote` and `noteType`.

## Maintenance notes

- A note first seen without metadata keeps being asked for until its tag and
  sender are known, as before.
- `type` is still fixed at first sight (`previousInputNote.type` wins): a
  note first seen before the node knows it is typed "public" for good. That
  was reported in the audit with medium confidence and is not changed here.
- If a new field is derived from the fetched metadata, add it to the
  `knownNoteIds` filter in `syncState`, or it will never fill in for known
  notes.
