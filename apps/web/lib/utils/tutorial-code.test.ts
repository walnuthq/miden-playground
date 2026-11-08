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
  timelockEdits,
} from "./tutorial-code.ts";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

// A built-in script's Rust: its `rust` template literal (plain node can't
// import the module, which uses path aliases).
const builtInRust = (path: string) => {
  const match = /export const rust = `((?:\\`|[^`])*)`/.exec(read(path));
  assert.ok(match, `no rust literal in ${path}`);
  return (match[1] ?? "").replaceAll("\\`", "`");
};

// The scripts the tutorials start from: the API's template (tutorials 7 and
// 12) and the mock API's (tutorial 8).
const counterAccount = read("../../../api/templates/counter-account.rs");
const p2id = builtInRust("../types/default-scripts/p2id.ts");

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
  test("tutorial 7: the increment value, not the key", () => {
    const edited = expectEditsApply(counterAccount, increaseIncrementEdits);
    assert.equal(incrementValue(edited), INCREMENT);
    assert.match(
      edited,
      new RegExp(`current_value \\+ felt!\\(${INCREMENT}\\)`),
    );
    assert.equal(
      edited.match(/Word::new\(\[felt!\(1\), felt!\(0\)/g)?.length,
      counterAccount.match(/Word::new\(\[felt!\(1\), felt!\(0\)/g)?.length,
    );
  });

  test("tutorial 8: the timelock, in order after the target account", () => {
    const edited = expectEditsApply(p2id, timelockEdits);
    assert.match(
      edited,
      /storage length is 3\n\s*assert_eq\(storage\.len\(\)\.into\(\), felt!\(3\)\);/,
    );
    assert.match(
      edited,
      /\n( +)let target_account_id_prefix = storage\[1\];\n\1let timelock_height = storage\[2\];\n\1let block_number = tx::get_block_number\(\);\n\1assert!\(block_number >= timelock_height\);\n/,
    );
  });

  test("tutorial 8: a later snippet adds the earlier ones it needs", () => {
    const edited = applyCodeEdits(p2id, timelockEdits, 2);
    assert.ok(edited !== null);
    assert.equal(timelockEdits[0]?.applied(edited), true);
    assert.equal(timelockEdits[1]?.applied(edited), true);
    assert.equal(timelockEdits[2]?.applied(edited), true);
    assert.equal(timelockEdits[3]?.applied(edited), false);
  });

  test("tutorial 12: reset_count in the trait and the impl", () => {
    const edited = expectEditsApply(counterAccount, resetCountEdits);
    assert.match(
      edited,
      /\n( +)fn increment_count\(&mut self\) -> Felt;\n\1#\[account_procedure\]\n\1fn reset_count\(&mut self\);\n\}/,
    );
    assert.match(
      edited,
      /\n( +)new_value\n {4}\}\n\n {4}\/\/\/ Resets the counter value to zero\n {4}fn reset_count\(&mut self\) \{\n {8}let key = Word::new/,
    );
    // The impl block still closes after the new method.
    assert.match(
      edited,
      /self\.count_map\.set\(key, felt!\(0\)\);\n {4}\}\n\}\n?$/,
    );
  });

  test("an anchor that isn't there: null", () => {
    assert.equal(applyCodeEdits("fn main() {}", timelockEdits), null);
    assert.equal(applyCodeEdits("fn main() {}", resetCountEdits, 1), null);
    assert.equal(applyCodeEdits("fn main() {}", increaseIncrementEdits), null);
  });
});
