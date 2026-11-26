import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { generateMidenProjectToml, parseMidenProjectToml } from "./toml.ts";

const noteToml =
  '[package]\nname = "counter-note"\nversion = "0.1.0"\n\n[lib]\nkind = "note"\nnamespace = "counter_note"\npath = "counter_note.masm"\n\n[dependencies]\nmiden-core = "*"\nmiden-protocol = "*"\n';

const note = generateMidenProjectToml({
  name: "counter-note",
  type: "note",
  masm: "@note_script\npub proc main()\n    nop\nend\n",
  dependencies: [],
});

describe("generateMidenProjectToml", () => {
  test("note without dependencies", () => {
    assert.equal(note, noteToml);
  });
  test("note with a path dependency", () => {
    const toml = generateMidenProjectToml({
      name: "counter-note",
      type: "note",
      masm: "use counter_account",
      dependencies: [
        {
          id: "x",
          name: "counter-account",
          type: "account-component",
          commitment: "",
        },
      ],
    });
    assert.equal(
      toml,
      `${noteToml}counter-account = { path = "../counter-account" }\n`,
    );
  });
  test("depends on miden-standards when the source uses it", () => {
    for (const masm of [
      "use {AuthArgs} from miden::standards::types\n",
      "use miden::standards::wallets::basic\n",
    ]) {
      const toml = generateMidenProjectToml({
        name: "auth",
        type: "account-component",
        masm,
        dependencies: [],
      });
      assert.ok(toml.includes('miden-protocol = "*"\nmiden-standards = "*"\n'));
    }
    assert.ok(!note.includes("miden-standards"));
  });
  test("the namespace and file are the package name with `_`", () => {
    const toml = generateMidenProjectToml({
      name: "p2id-note",
      type: "note",
      masm: "",
      dependencies: [],
    });
    assert.ok(
      toml.includes('namespace = "p2id_note"\npath = "p2id_note.masm"'),
    );
  });
  test("a transaction script is named after its package too", () => {
    const toml = generateMidenProjectToml({
      name: "init",
      type: "transaction-script",
      masm: "",
      dependencies: [],
    });
    assert.ok(
      toml.includes(
        'kind = "transaction-script"\nnamespace = "init"\npath = "init.masm"',
      ),
    );
  });
  test("no Rust metadata", () => {
    const toml = generateMidenProjectToml({
      name: "my-counter",
      type: "account-component",
      masm: "",
      dependencies: [],
    });
    assert.ok(!toml.includes("[package.metadata.miden]"));
  });
});

describe("parseMidenProjectToml", () => {
  test("round-trips generated output", () => {
    const manifest = parseMidenProjectToml(note);
    assert.equal(manifest.package.name, "counter-note");
    assert.equal(manifest.lib.kind, "note");
    assert.equal(manifest.lib.path, "counter_note.masm");
  });
});
