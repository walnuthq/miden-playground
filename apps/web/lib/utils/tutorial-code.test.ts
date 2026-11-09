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

// The API's templates, which the tutorials' scripts are created from:
// tutorials 7 and 12, then tutorial 8.
const counterAccount = read("../../../api/templates/counter-account.rs");
const p2idNote = read("../../../api/templates/p2id-note.rs");

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

  test("tutorial 8: the timelock, from the note's input to the check", () => {
    const edited = expectEditsApply(p2idNote, timelockEdits);
    assert.match(
      edited,
      /\nuse miden::\{account, felt_repr::ToFeltRepr, note, tx, AccountId, Felt, Recipient, Word\};\n/,
    );
    // After the target account: the storage items follow the fields' order.
    assert.match(
      edited,
      /\nstruct P2idNote \{\n {4}target_account_id: AccountId,\n {4}timelock_height: Felt,\n\}\n/,
    );
    assert.match(
      edited,
      /\n {4}pub fn build_recipient\(\n {8}target: AccountId,\n {8}serial_num: Word,\n {8}timelock_height: Felt,\n {4}\) -> Recipient \{\n {8}let inputs = P2idNote \{\n {12}target_account_id: target,\n {12}timelock_height,\n {8}\};\n/,
    );
    // Before the target check, a blank line apart.
    assert.match(
      edited,
      /\n( +)pub fn script\(self, _arg: Word, account: &mut Wallet\) \{\n\1 {4}let block_number = tx::get_reference_block_number\(\);\n\1 {4}assert!\(block_number\.as_felt\(\) >= self\.timelock_height\);\n\n\1 {4}let current_account = account\.get_id\(\);\n/,
    );
  });

  test("tutorial 8: a later snippet adds the earlier ones it needs", () => {
    // The field's button imports `Felt` too.
    const withField = applyCodeEdits(p2idNote, timelockEdits, 1);
    assert.ok(withField !== null);
    assert.deepEqual(
      timelockEdits.map((edit) => edit.applied(withField)),
      [true, true, false, false, false, false],
    );
    // The check's button adds everything before it.
    const withCheck = applyCodeEdits(p2idNote, timelockEdits, 5);
    assert.equal(withCheck, applyCodeEdits(p2idNote, timelockEdits));
  });

  test("tutorial 8: each part is told apart from the others", () => {
    const [imports, field, parameter, literal] = timelockEdits;
    assert.ok(imports && field && parameter && literal);
    // The constructor's parameter and struct literal aren't the struct's
    // field, nor the other way around.
    const constructorOnly = applyCodeEdits(
      p2idNote,
      [imports, parameter, literal],
      2,
    );
    assert.ok(constructorOnly !== null);
    assert.equal(field.applied(constructorOnly), false);
    const fieldOnly = applyCodeEdits(p2idNote, timelockEdits, 1);
    assert.ok(fieldOnly !== null);
    assert.equal(parameter.applied(fieldOnly), false);
    assert.equal(literal.applied(fieldOnly), false);
    // A field declared before the target account changes the storage order.
    assert.equal(
      field.applied(
        p2idNote.replace(
          "    target_account_id: AccountId,\n}",
          "    timelock_height: Felt,\n    target_account_id: AccountId,\n}",
        ),
      ),
      false,
    );
    // Imports written by hand: a glob, or one name per line.
    assert.equal(imports.applied("use miden::*;"), true);
    assert.equal(
      imports.applied("use miden::{\n    note,\n    tx,\n    Felt,\n};"),
      true,
    );
    assert.equal(imports.applied("use miden::{note, Felt};"), false);
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
