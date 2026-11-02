// Port of lodash's word splitting (`words`, as used by its kebabCase and
// snakeCase), restricted to ASCII. The names built from it must stay exactly
// what lodash produced, quirks included: it splits letters from digits and
// keeps ordinals together ("P2IDNote" -> p 2 ID Note, "the2ndTry" -> the 2nd
// Try). Identical to lodash 4.17.21 for ASCII input; other characters count
// as separators.
const reApostrophe = /['’]/g;
const reHasCompoundWord =
  /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
const reSimpleWord = /[A-Za-z0-9]+/g;
const reCompoundWord = new RegExp(
  [
    "[A-Z]?[a-z]+(?=[^A-Za-z0-9]|[A-Z]|$)",
    "[A-Z]+(?=[^A-Za-z0-9]|[A-Z][a-z]|$)",
    "[A-Z]?[a-z]+",
    "[A-Z]+",
    "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])",
    "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])",
    "\\d+",
  ].join("|"),
  "g",
);

const words = (value: string) => {
  const string = value.replace(reApostrophe, "");
  return (
    string.match(
      reHasCompoundWord.test(string) ? reCompoundWord : reSimpleWord,
    ) ?? []
  );
};

// "CounterContract" -> "counter_contract", "p2id-note" -> "p_2_id_note".
export const snakeCase = (value: string) =>
  words(value)
    .map((word) => word.toLowerCase())
    .join("_");
