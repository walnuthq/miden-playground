import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { declaredSlotNames } from "./storage-slot-names.ts";

describe("declaredSlotNames", () => {
  it("reads the strings of `const NAME = word(…)` constants, sorted", () => {
    assert.deepEqual(
      declaredSlotNames(`use miden::protocol::active_account

const B_SLOT = word("app::b")
pub const A_SLOT=word( "app::a" )
@account_procedure
pub proc get() -> word
    push.A_SLOT[0..2] exec.active_account::get_item
end
`),
      ["app::a", "app::b"],
    );
  });

  it("is empty for a source with no slot", () => {
    assert.deepEqual(declaredSlotNames("pub proc f()\n    nop\nend\n"), []);
    assert.deepEqual(declaredSlotNames(""), []);
  });

  it("counts a name declared twice once", () => {
    assert.deepEqual(
      declaredSlotNames('const A = word("x")\nconst B = word("x")\n'),
      ["x"],
    );
  });

  it("ignores comments, doc comments and strings", () => {
    assert.deepEqual(
      declaredSlotNames(`# const OLD = word("old")
#! const DOC = word("doc")
const ERR = "a # not a comment, word(\\"no\\")"
const SLOT = word("app::slot") # word("trailing")
`),
      ["app::slot"],
    );
  });

  it("doesn't take the word type for a hash", () => {
    assert.deepEqual(
      declaredSlotNames(
        'const S = word("s")\npub proc f(root: word) -> word\n    nop\nend\n',
      ),
      ["s"],
    );
  });

  it("can't tell a word(…) outside a constant of its own", () => {
    assert.equal(
      declaredSlotNames('proc f()\n    push.word("x")[0..2]\nend\n'),
      null,
    );
    assert.equal(declaredSlotNames('const A = (word("x"))\n'), null);
  });

  it("can't tell a name with an escape, or an unclosed string", () => {
    assert.equal(declaredSlotNames('const A = word("a\\"b")\n'), null);
    assert.equal(declaredSlotNames('const A = word("a\n")\n'), null);
  });
});
