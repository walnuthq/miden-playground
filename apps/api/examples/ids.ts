// The ids of the examples in examples/index.ts, on their own so plain node
// scripts (scripts/check-templates.ts), which can't import the bundled
// `.masm` sources, can list them.
export const exampleIds = ["counter-account", "bank-account"] as const;

// A note package of an example, `<example id>/<package name>`: what a note's
// `metadata.template` names when its schema is the example's, kept while its
// source is the example's as shipped (lib/package-metadata.ts).
export type ExamplePackageRef = `${(typeof exampleIds)[number]}/${string}`;

// A template's name has no slash.
export const isExamplePackageRef = (
  template: string,
): template is ExamplePackageRef => template.includes("/");
