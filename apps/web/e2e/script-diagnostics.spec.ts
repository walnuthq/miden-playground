import { expect, type Page, test } from "@playwright/test";
import { COMPILED, createCounterScript, replaceInEditor } from "./editor";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

type Marker = {
  severity: number;
  startLineNumber: number;
  startColumn: number;
  endColumn: number;
  message: string;
};

const markers = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        monaco: { editor: { getModelMarkers: (filter: object) => Marker[] } };
      }
    ).monaco.editor
      .getModelMarkers({})
      .map(
        ({ severity, startLineNumber, startColumn, endColumn, message }) => ({
          severity,
          startLineNumber,
          message,
          startColumn,
          endColumn,
        }),
      ),
  );

const cursorLine = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          monaco: {
            editor: {
              getEditors: () => {
                getPosition: () => { lineNumber: number } | null;
              }[];
            };
          };
        }
      ).monaco.editor
        .getEditors()[0]
        ?.getPosition()?.lineNumber,
  );

// Monaco's MarkerSeverity.
const ERROR = 8;
const WARNING = 4;

// The counter template's source, as api-compile names it in its diagnostics.
const SOURCE = "counter-account/counter_account.masm";
const LOCATION = /^counter-account\/counter_account\.masm:\d+:\d+$/;

test("script: compile errors in the editor", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("open the counter account script", async () => {
    await createCounterScript(page);
  });

  let errorLine = 0;
  await test.step("compile an error", async () => {
    await replaceInEditor(page, "    add.1\n", "    addd.1\n");
    await page.getByRole("button", { name: "Compile" }).click();
    const location = page.getByRole("button", { name: LOCATION });
    await expect(location).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    errorLine = Number(
      (await location.textContent())?.match(/:(\d+):/)?.[1] ?? 0,
    );
    expect(await markers(page)).toEqual([
      {
        severity: ERROR,
        startLineNumber: errorLine,
        message:
          "invalid syntax: invalid instruction `addd` or malformed operands",
        startColumn: 5,
        endColumn: 11,
      },
    ]);
    // One error per build: the assembler stops at the first failing phase.
    await expect(
      page.getByText(/^Compilation failed in \d+\.\d s \(1 error\)\.$/),
    ).toBeVisible();
  });

  await test.step("clean output, full output on demand", async () => {
    // The assembler's report, with its source excerpt.
    await expect(page.getByText(/^\s*x invalid syntax/)).toBeVisible();
    await expect(page.getByText(/^\s*\d+ \|\s+addd\.1$/)).toBeVisible();
    const fullOutput = page.getByRole("button", { name: "Show full output" });
    await fullOutput.click();
    await expect(page.getByText(/^\s*x invalid syntax/)).toBeVisible();
    await fullOutput.click();
  });

  await test.step("the location follows edits", async () => {
    await replaceInEditor(page, "# PROCEDURES\n", "# moved\n# PROCEDURES\n");
    expect((await markers(page))[0]?.startLineNumber).toBe(errorLine + 1);
    await page
      .getByRole("button", { name: `${SOURCE}:${errorLine}:`, exact: false })
      .click();
    expect(await cursorLine(page)).toBe(errorLine + 1);
    // Away from the location, for the next step.
    await page.evaluate(() =>
      (
        window as unknown as {
          monaco: {
            editor: {
              getEditors: () => {
                setPosition: (position: object) => void;
              }[];
            };
          };
        }
      ).monaco.editor
        .getEditors()[0]
        ?.setPosition({ lineNumber: 1, column: 1 }),
    );
  });

  await test.step("a location clicked on the Manifest tab", async () => {
    // The console stays on every tab: its link opens the Explorer tab.
    await page.getByRole("tab", { name: "Manifest" }).click();
    await page
      .getByRole("button", { name: `${SOURCE}:${errorLine}:`, exact: false })
      .click();
    await expect(page.getByRole("tab", { name: "Explorer" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect.poll(() => cursorLine(page)).toBe(errorLine + 1);
  });

  await test.step("a successful compile clears the markers", async () => {
    await replaceInEditor(page, "    addd.1\n", "    add.1\n");
    await page.getByRole("button", { name: "Re-compile" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible({
      timeout: TRANSACTION_TIMEOUT,
    });
    expect(await markers(page)).toEqual([]);
    // The console keeps its output across tabs.
    await page.getByRole("tab", { name: "Manifest" }).click();
    await expect(page.getByText(COMPILED).last()).toBeVisible();
  });

  await test.step("the console keeps a history", async () => {
    // The failed compile is still there, its locations no longer links: they
    // predate the latest compile.
    await expect(
      page.getByText(/^Compilation failed in \d+\.\d s \(1 error/),
    ).toBeVisible();
    await expect(
      page.getByText(`${SOURCE}:${errorLine}:`, { exact: false }).first(),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: LOCATION })).toHaveCount(0);
  });

  await test.step("a successful compile's warnings", async () => {
    await page.getByRole("tab", { name: "Explorer" }).click();
    await replaceInEditor(
      page,
      "use miden::core::sys\n",
      "use miden::core::sys\nuse miden::core::mem\n",
    );
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(
      page.getByText(/^Compiled \S+ in \d+\.\d s \(1 warning\)\.$/),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(page.getByRole("button", { name: LOCATION })).toHaveCount(1);
    // Not the rollup api-compile's second build renders around warnings.
    await expect(page.getByText(/^\s*x syntax error$/)).toHaveCount(0);
    await expect(page.getByText(/^\s*! unused import$/)).toBeVisible();
    expect(await markers(page)).toEqual([
      expect.objectContaining({
        severity: WARNING,
        message:
          "unused import\nhelp: this import is never used and can be safely removed",
      }),
    ]);
    // A warning doesn't block anything: the script is compiled.
    await expect(page.getByRole("button", { name: "Compile" })).toBeVisible();
  });

  await test.step("a failure without a position", async () => {
    await replaceInEditor(page, "use miden::core::mem\n", "");
    for (const procedure of ["get_count", "increment_count"]) {
      await replaceInEditor(
        page,
        `pub proc ${procedure}(`,
        `proc ${procedure}(`,
      );
    }
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(
      page.getByText(/^\s*x package must contain at least one exported/),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(page.getByRole("button", { name: LOCATION })).toHaveCount(0);
    expect(await markers(page)).toEqual([]);
  });

  await test.step("clear the console", async () => {
    await page.getByRole("button", { name: "Clear console" }).click();
    await expect(
      page.getByText("Compile the script to see its output here."),
    ).toBeVisible();
  });
});
