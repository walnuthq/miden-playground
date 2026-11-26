import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { type CompiledSource, compiledMetadata } from "./package-metadata.ts";
import { templateMetadata } from "./template-schemas.ts";
import type { ScriptExample } from "./types.ts";

// The templates as shipped, read as the API bundles them.
const template = (name: string) =>
  readFileSync(`${import.meta.dirname}/../templates/${name}.masm`, "utf8");

const shipped = (name: ScriptExample) =>
  name === "none" ? undefined : template(name);

const source = (masm: string): CompiledSource => ({ masm, shipped });

const counterAccount = template("counter-account");
const p2idNote = template("p2id-note");
const counterMetadata = templateMetadata("counter-account");
const p2idMetadata = templateMetadata("p2id-note");
const { storage } = counterMetadata ?? {};
const { noteStorage } = p2idMetadata ?? {};

const accountProcedures = [
  "0x1111111111111111111111111111111111111111111111111111111111111111",
];

describe("templateMetadata", () => {
  it("gives a template's schema, and a note's template name", () => {
    assert.ok(storage);
    assert.deepEqual(counterMetadata, { storage });
    assert.ok(noteStorage);
    assert.deepEqual(p2idMetadata, { noteStorage, template: "p2id-note" });
  });

  it("is null for a template without a schema", () => {
    assert.equal(templateMetadata("counter-note"), null);
    assert.equal(templateMetadata("auth-no-auth"), null);
  });
});

describe("compiledMetadata: account storage", () => {
  it("keeps the schema of an unedited template", () => {
    assert.deepEqual(
      compiledMetadata(counterMetadata, {}, source(counterAccount)),
      { storage },
    );
  });

  it("keeps it through an edit that leaves the slot names", () => {
    const edited = counterAccount
      .replace("add.1", "add.5")
      .replace("# STORAGE", "# STORAGE (edited)")
      .replace(
        'const COUNT_MAP_SLOT = word("counter_account::count_map")',
        '# const OLD_SLOT = word("counter_account::old")\nconst COUNT_MAP_SLOT=word( "counter_account::count_map" )',
      );
    assert.notEqual(edited, counterAccount);
    assert.deepEqual(compiledMetadata(counterMetadata, {}, source(edited)), {
      storage,
    });
  });

  it("drops it when a slot is renamed", () => {
    const renamed = counterAccount.replace(
      '"counter_account::count_map"',
      '"counter_account::counts"',
    );
    assert.equal(compiledMetadata(counterMetadata, {}, source(renamed)), null);
  });

  it("drops it when a slot is added", () => {
    const added = counterAccount.replace(
      "# The map key",
      'const OTHER_SLOT = word("counter_account::other")\n\n# The map key',
    );
    assert.equal(compiledMetadata(counterMetadata, {}, source(added)), null);
  });

  it("drops it when a slot is removed", () => {
    const removed = counterAccount.replace(
      'const COUNT_MAP_SLOT = word("counter_account::count_map")',
      "",
    );
    assert.equal(compiledMetadata(counterMetadata, {}, source(removed)), null);
  });

  it("drops it when the slot names can't be read with certainty", () => {
    const inline = `${counterAccount}\nproc other()\n    push.word("counter_account::count_map")[0..2] drop drop\nend\n`;
    assert.equal(compiledMetadata(counterMetadata, {}, source(inline)), null);
  });

  it("doesn't bring a dropped schema back", () => {
    assert.equal(compiledMetadata(null, {}, source(counterAccount)), null);
  });
});

describe("compiledMetadata: note storage", () => {
  it("keeps the schema of an unedited note", () => {
    assert.deepEqual(compiledMetadata(p2idMetadata, {}, source(p2idNote)), {
      noteStorage,
      template: "p2id-note",
    });
  });

  it("drops it on any edit, a comment's too", () => {
    for (const edited of [
      p2idNote.replace("# SCRIPT", "# THE SCRIPT"),
      `${p2idNote}\n`,
      p2idNote.replace("NUM_STORAGE_ITEMS = 2", "NUM_STORAGE_ITEMS = 3"),
    ]) {
      assert.equal(compiledMetadata(p2idMetadata, {}, source(edited)), null);
    }
  });

  it("doesn't bring it back when the edit is undone", () => {
    const dropped = compiledMetadata(p2idMetadata, {}, source(`${p2idNote}\n`));
    assert.equal(compiledMetadata(dropped, {}, source(p2idNote)), null);
  });

  it("drops a note schema with no template to check it against", () => {
    assert.equal(compiledMetadata({ noteStorage }, {}, source(p2idNote)), null);
  });
});

describe("compiledMetadata: account procedures", () => {
  const blank = source(template("note"));

  it("takes no schema from the build", () => {
    // A MASM build reports none: an older answer's are ignored too.
    const build = { storage, noteStorage } as unknown as Parameters<
      typeof compiledMetadata
    >[1];
    assert.equal(compiledMetadata(null, build, blank), null);
  });

  it("is null when there's nothing to keep", () => {
    assert.equal(compiledMetadata(null, {}, blank), null);
    assert.equal(compiledMetadata({}, {}, blank), null);
  });

  it("takes a script's account procedures from the build, an empty list included", () => {
    assert.deepEqual(compiledMetadata(null, { accountProcedures }, blank), {
      accountProcedures,
    });
    // The script calls no account procedure: every account can run it.
    assert.deepEqual(compiledMetadata(null, { accountProcedures: [] }, blank), {
      accountProcedures: [],
    });
  });

  it("replaces the account procedures of the last build", () => {
    // A failed build reports none: the last build's described other code.
    assert.equal(compiledMetadata({ accountProcedures }, {}, blank), null);
    assert.deepEqual(
      compiledMetadata({ accountProcedures }, { accountProcedures: [] }, blank),
      { accountProcedures: [] },
    );
  });

  it("drops account procedures api-compile couldn't tell", () => {
    assert.equal(
      compiledMetadata(null, { accountProcedures: null }, blank),
      null,
    );
    assert.deepEqual(
      compiledMetadata(
        p2idMetadata,
        { accountProcedures: null },
        source(p2idNote),
      ),
      { noteStorage, template: "p2id-note" },
    );
  });

  it("keeps every key together", () => {
    assert.deepEqual(
      compiledMetadata(p2idMetadata, { accountProcedures }, source(p2idNote)),
      { noteStorage, template: "p2id-note", accountProcedures },
    );
  });
});
