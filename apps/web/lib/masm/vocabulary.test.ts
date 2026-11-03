import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import {
  checkVocabulary,
  extractInstructions,
  extractKeywords,
  extractTypes,
  extractVocabulary,
} from "./vocabulary.ts";

// Excerpts of miden-vm v0.35.0's assembler sources, in their shapes.
const instructions = `
static PRIMITIVE_SPECS: &[PrimitiveSpec] = &[
    PrimitiveSpec {
        spelling: "adv.insert_hdword",
        build: || Instruction::SysEvent(SystemEventNode::InsertHdword),
    },
    PrimitiveSpec {
        spelling: "add",
        build: || Instruction::Add,
    },
];
static COMPACT_SUFFIX_SPECS: &[CompactSuffixSpec] = &[
    CompactSuffixSpec {
        prefix: &["dup"],
        kind: CompactSuffixKind::Stack(&STACK_DUP_SPEC),
    },
    CompactSuffixSpec {
        prefix: &["adv", "push_mapvaln"],
        kind: CompactSuffixKind::AdvPushMapvaln,
    },
];
fn starts_with_segments(&self, prefix: &[&str]) -> bool {}
static EXTENDED_INSTRUCTION_SPECS: &[ExtendedInstructionSpec] = &[
    ExtendedInstructionSpec {
        keyword: "exec",
        kind: ExtendedInstructionKind::Invocation(Instruction::Exec),
    },
];
`;

const parser = `
        if self.at_keyword("begin") {
        } else if self.at_prefixed_keyword("pub", "proc") {
        } else if self.at_prefixed_keyword("extern", "package") {
        self.expect_keyword("end", BlockOwner::Begin.missing_end_message())
        if !self.peek_contextual_keyword_after_non_comment_trivia("as") {
    fn at_keyword(&self, keyword: &str) -> bool {
        self.at_keyword(terminator)

#[cfg(test)]
mod tests {
    fn parses() { parse("proc foo nop end"); self.at_keyword("sample"); }
}
`;

const fragments = `
        if (self.at_keyword("word") || self.at_keyword("event")) {}
        let ptr = self.expect_keyword("ptr", "expected \`ptr\`")?;
        match token.text() {
            "felt" => Ok(Type::Felt),
            "i128" => Ok(Type::I128),
        }

/// Maps a bare type name to the builtin AST type it denotes, if any.
fn builtin_type_for_name(name: &str) -> Option<Type> {
    Some(match name {
        "word" => Type::Array(Arc::new(ast::types::ArrayType::new(Type::Felt, 4))),
        "u32" => Type::U32,
        "felt" => Type::Felt,
        _ => return None,
    })
}

fn parse_numeric_token() {
    "after" => 1,
}
`;

describe("extractInstructions", () => {
  test("spellings, compact prefixes (dotted when split) and keywords", () => {
    assert.deepEqual(extractInstructions(instructions), [
      "add",
      "adv.insert_hdword",
      "adv.push_mapvaln",
      "dup",
      "exec",
    ]);
  });
});

describe("extractKeywords", () => {
  test("literal keyword calls, outside the test module", () => {
    assert.deepEqual(extractKeywords(parser), [
      "as",
      "begin",
      "end",
      "extern",
      "package",
      "proc",
      "pub",
    ]);
  });
});

describe("extractTypes", () => {
  test("the builtin type names only", () => {
    assert.deepEqual(extractTypes(fragments), ["felt", "u32", "word"]);
  });
});

describe("extractVocabulary", () => {
  test("keywords exclude types and instructions", () => {
    assert.deepEqual(
      extractVocabulary({ instructions, parser, fragments }).keywords,
      [
        "as",
        "begin",
        "end",
        "event",
        "extern",
        "package",
        "proc",
        "ptr",
        "pub",
      ],
    );
  });
});

describe("vocabulary.json", () => {
  test("is complete", () => {
    const vocabulary = JSON.parse(
      readFileSync(new URL("./vocabulary.json", import.meta.url), "utf-8"),
    );
    assert.doesNotThrow(() => checkVocabulary(vocabulary));
  });

  test("an incomplete extraction is rejected", () => {
    assert.throws(
      () =>
        checkVocabulary(extractVocabulary({ instructions, parser, fragments })),
      /looks incomplete/,
    );
  });
});
