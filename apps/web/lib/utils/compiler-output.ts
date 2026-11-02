import { ANSI_ESCAPE } from "./diagnostics.ts";

// The editor console's default view of api-compile's output: rustc's
// diagnostics without the build noise around them. Display only: the stored
// output, the markers and the counts all use the raw text, which the console's
// "Show full output" toggle shows as is. Keep the rules in sync with the
// fixtures in `fixtures/compile-errors/` when cargo or api-compile change.

// `Command failed: cargo miden build --release --offline`, api-compile's
// prefix of a failed build.
const COMMAND_FAILED = /^Command failed: /;
// Cargo's progress lines: `   Compiling x v0.1.0 (/tmp/…)`, `    Finished …`.
const PROGRESS = /^\s+(?:Compiling|Finished) /;
// Cargo's summaries. Their counts include the hidden warning below, and the
// console's summary line already gives the counts.
const SUMMARY =
  /^(?:warning: `[^`]+` \(\w+\) generated |error: could not compile `)/;
// Reported on every build by the Miden toolchain: not the user's to fix. Its
// `|` and `= note:` lines follow, up to a blank line.
const UNSTABLE_FEATURE =
  /^warning: unstable feature specified for `-Ctarget-feature`/;
// `rustc --explain` can't be run from the playground: point to its docs.
const EXPLAIN =
  /^For more information about this error, try `rustc --explain (E\d+)`\.$/;
// The temporary directory api-compile builds in. What follows it is the
// package's directory: kept, so a dependency's file is never mistaken for the
// script's own `src/lib.rs`.
const BUILD_DIRECTORY = /\/tmp\/miden-project-[^/\s]+\//g;

export const rustErrorCodeUrl = (code: string) =>
  `https://doc.rust-lang.org/error_codes/${code}.html`;

export const cleanCompilerOutput = (output: string) => {
  const lines: string[] = [];
  let inUnstableFeature = false;
  for (const rawLine of output.split("\n")) {
    const line = rawLine.replace(ANSI_ESCAPE, "");
    if (inUnstableFeature) {
      if (line.trim() === "") {
        inUnstableFeature = false;
        continue;
      }
      if (/^\s/.test(line)) {
        continue;
      }
      inUnstableFeature = false;
    }
    if (UNSTABLE_FEATURE.test(line)) {
      inUnstableFeature = true;
      continue;
    }
    if (
      COMMAND_FAILED.test(line) ||
      PROGRESS.test(line) ||
      SUMMARY.test(line)
    ) {
      continue;
    }
    const explain = EXPLAIN.exec(line);
    if (explain?.[1]) {
      lines.push(
        `For more information about this error, see ${rustErrorCodeUrl(explain[1])}`,
      );
      continue;
    }
    const blank = rawLine.trim() === "";
    // One blank line at most between blocks, none at either end.
    if (blank && (lines.length === 0 || lines.at(-1) === "")) {
      continue;
    }
    lines.push(blank ? "" : rawLine.replace(BUILD_DIRECTORY, ""));
  }
  while (lines.at(-1) === "") {
    lines.pop();
  }
  return lines.join("\n");
};
