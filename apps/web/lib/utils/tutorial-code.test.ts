import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  applyCodeEdits,
  type CodeEdit,
  INCREMENT,
  increaseIncrementEdits,
  incrementValue,
  resetCountEdits,
  resetCountProcedure,
  runTag,
  timelockEdits,
} from "./tutorial-code.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const counterAccountMasm = read("../../../api/templates/counter-account.masm");
const p2idNoteMasm = read("../../../api/templates/p2id-note.masm");

// Every edit applies, then reads as applied, and applying it again changes
// nothing.
const expectEditsApply = (source: string, edits: CodeEdit[]) => {
  for (const [index, edit] of edits.entries()) {
    assert.equal(edit.applied(source), false, `edit ${index} before`);
  }
  const edited = applyCodeEdits(source, edits);
  assert.ok(edited !== null);
  for (const [index, edit] of edits.entries()) {
    assert.equal(edit.applied(edited), true, `edit ${index} after`);
  }
  assert.equal(applyCodeEdits(edited, edits), edited);
  return edited;
};

describe("tutorial code edits", () => {
  test("tutorial 7: the increment value of increment_count", () => {
    assert.equal(incrementValue(counterAccountMasm), 1);
    const edited = expectEditsApply(counterAccountMasm, increaseIncrementEdits);
    assert.equal(incrementValue(edited), INCREMENT);
    // Only that line changes: the slot names stay, and so does the schema.
    assert.equal(
      edited,
      counterAccountMasm.replace("\n    add.1\n", `\n    add.${INCREMENT}\n`),
    );
    // Typed by hand, in hex too.
    assert.equal(
      incrementValue(counterAccountMasm.replace("add.1", "add.0x10")),
      16,
    );
    // An `add` elsewhere isn't the increment.
    assert.ok(
      Number.isNaN(
        incrementValue(
          counterAccountMasm
            .replace("add.1", "push.1 add")
            .replace(
              "exec.sys::truncate_stack\n    # => [count, pad(15)]",
              "add.7 exec.sys::truncate_stack\n    # => [count, pad(15)]",
            ),
        ),
      ),
    );
  });

  test("tutorial 8: the timelock, from the import to the check", () => {
    const edited = expectEditsApply(p2idNoteMasm, timelockEdits);
    assert.match(
      edited,
      /\nuse miden::protocol::active_note\nuse miden::protocol::tx\n/,
    );
    assert.match(
      edited,
      /\nconst ERR_P2ID_WRONG_TARGET = .*\n\nconst ERR_P2ID_TIMELOCKED = "P2ID note is timelocked until its timelock height"\n/,
    );
    // The count and its message both say 3.
    assert.match(edited, /\nconst NUM_STORAGE_ITEMS = 3\n/);
    assert.match(edited, /expects exactly 3 note storage items"/);
    // The third item, after the target account's prefix and suffix.
    assert.match(
      edited,
      /\nconst TARGET_ACCOUNT_ID_SUFFIX_PTR = STORAGE_PTR \+ 1\nconst TIMELOCK_HEIGHT_PTR = STORAGE_PTR \+ 2\n/,
    );
    // After the storage count's check, before the target's, indented as
    // the procedure's body.
    assert.match(
      edited,
      /\n {4}eq\.NUM_STORAGE_ITEMS assert\.err=ERR_P2ID_WRONG_NUMBER_OF_STORAGE_ITEMS\n {4}# => \[\]\n\n {4}# the timelock height, then the transaction's reference block\n {4}mem_load\.TIMELOCK_HEIGHT_PTR exec\.tx::get_reference_block_number\n {4}# => \[block_number, timelock_height\]\n\n {4}lte assert\.err=ERR_P2ID_TIMELOCKED\n {4}# => \[\]\n\n {4}# the target account's id\n/,
    );
  });

  test("tutorial 8: a later snippet adds the earlier ones it needs", () => {
    const withCount = applyCodeEdits(p2idNoteMasm, timelockEdits, 2);
    assert.ok(withCount !== null);
    assert.deepEqual(
      timelockEdits.map((edit) => edit.applied(withCount)),
      [true, true, true, false, false, false],
    );
    // The check's button adds everything before it.
    assert.equal(
      applyCodeEdits(p2idNoteMasm, timelockEdits, 5),
      applyCodeEdits(p2idNoteMasm, timelockEdits),
    );
  });

  test("tutorial 8: typed by hand", () => {
    const [imports, count, pointer] = timelockEdits;
    assert.ok(imports && count && pointer);
    // Another storage count isn't the timelock's.
    assert.equal(count.applied(p2idNoteMasm), false);
    assert.equal(
      count.applied(p2idNoteMasm.replace("ITEMS = 2", "ITEMS = 4")),
      false,
    );
    // The height must be the third item, after the target account.
    assert.equal(
      pointer.applied("const TIMELOCK_HEIGHT_PTR = STORAGE_PTR + 0"),
      false,
    );
    assert.equal(
      pointer.applied("const TIMELOCK_HEIGHT_PTR = STORAGE_PTR + 2"),
      true,
    );
    // An import elsewhere in the file, its own line.
    assert.equal(imports.applied("use miden::protocol::tx\n"), true);
    assert.equal(imports.applied("use miden::protocol::tx_kernel\n"), false);
  });

  test("tutorial 12: reset_count after increment_count", () => {
    const tag = runTag("qwerty");
    const edits = resetCountEdits(tag);
    const edited = expectEditsApply(counterAccountMasm, edits);
    // Appended after increment_count, the last procedure: nothing else
    // changes, so the slot names, and the schema, stay.
    assert.equal(
      edited,
      `${counterAccountMasm.trimEnd()}\n\n${resetCountProcedure(tag).join("\n")}\n`,
    );
    assert.match(edited, new RegExp(`\\n    push\\.${tag} drop\\n`));
    // Another run's number isn't this run's.
    assert.equal(resetCountEdits(runTag("asdfgh"))[0]?.applied(edited), false);
    // One typed without the number is replaced, not doubled.
    const typed = `${counterAccountMasm}\n@account_procedure\npub proc reset_count()\n    padw push.COUNT_KEY push.COUNT_MAP_SLOT[0..2]\n    exec.native_account::set_map_item\n    dropw\nend\n`;
    const fixed = applyCodeEdits(typed, edits);
    assert.ok(fixed !== null);
    assert.equal(fixed.match(/proc reset_count\b/g)?.length, 1);
    assert.equal(edits[0]?.applied(fixed), true);
  });

  test("tutorial 12: the run's number", () => {
    assert.equal(runTag("aaaaaa"), 0);
    assert.equal(runTag("aaaaab"), 1);
    assert.equal(runTag("aaaaba"), 26);
    // Six letters: below 26^6, far below a felt's modulus.
    assert.equal(runTag("zzzzzz"), 26 ** 6 - 1);
  });

  test("an anchor that isn't there: null", () => {
    assert.equal(applyCodeEdits("fn main() {}", timelockEdits), null);
    assert.equal(applyCodeEdits("fn main() {}", resetCountEdits(1)), null);
    assert.equal(applyCodeEdits("fn main() {}", increaseIncrementEdits), null);
  });
});
