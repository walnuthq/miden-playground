import { expect, type Page, test } from "@playwright/test";
import { COMPILED, replaceInEditor, waitForEditorText } from "./editor";
import { launchExample } from "./example";
import { logBrowserErrors, TRANSACTION_TIMEOUT } from "./tutorial";

type Marker = { severity: number; startLineNumber: number; message: string };

const markers = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as {
        monaco: { editor: { getModelMarkers: (filter: object) => Marker[] } };
      }
    ).monaco.editor
      .getModelMarkers({})
      .map(({ severity, startLineNumber, message }) => ({
        severity,
        startLineNumber,
        message,
      })),
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

test("script: compile errors in the editor", async ({ page }) => {
  logBrowserErrors(page);

  await test.step("open the counter account script", async () => {
    await launchExample(page, {
      title: "Counter Contract",
      accountName: "Counter Contract",
    });
    await page.getByRole("link", { name: "counter-account" }).click();
    await waitForEditorText(page, "fn get_count(&self) -> Felt {");
  });

  let errorLine = 0;
  await test.step("compile an error", async () => {
    await replaceInEditor(
      page,
      "self.count_map.get(key)\n    }",
      "self.count_map.get(missing_key)\n    }",
    );
    await page.getByRole("button", { name: "Compile" }).click();
    const location = page.getByRole("button", {
      name: /^src\/lib\.rs:\d+:\d+$/,
    });
    await expect(location).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    errorLine = Number(
      (await location.textContent())?.match(/:(\d+):/)?.[1] ?? 0,
    );
    expect(await markers(page)).toEqual([
      {
        severity: ERROR,
        startLineNumber: errorLine,
        message: "cannot find value `missing_key` in this scope",
      },
    ]);
  });

  await test.step("clean output, full output on demand", async () => {
    // The build noise is hidden, rustc's --explain points to the docs.
    await expect(page.getByText(/^Command failed:/)).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /error_codes\/E0425\.html$/ }),
    ).toHaveAttribute(
      "href",
      "https://doc.rust-lang.org/error_codes/E0425.html",
    );
    const fullOutput = page.getByRole("button", { name: "Show full output" });
    await fullOutput.click();
    await expect(page.getByText(/^Command failed:/)).toBeVisible();
    await expect(page.getByText(/rustc --explain E0425/)).toBeVisible();
    await fullOutput.click();
    await expect(page.getByText(/^Command failed:/)).toHaveCount(0);
  });

  await test.step("the location follows edits", async () => {
    await replaceInEditor(
      page,
      "#[component]\nimpl",
      "// moved\n#[component]\nimpl",
    );
    expect((await markers(page))[0]?.startLineNumber).toBe(errorLine + 1);
    await page
      .getByRole("button", { name: `src/lib.rs:${errorLine}:`, exact: false })
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
      .getByRole("button", { name: `src/lib.rs:${errorLine}:`, exact: false })
      .click();
    await expect(page.getByRole("tab", { name: "Explorer" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect.poll(() => cursorLine(page)).toBe(errorLine + 1);
  });

  await test.step("a successful compile clears the markers", async () => {
    await replaceInEditor(page, "missing_key", "key");
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
      page.getByText(`src/lib.rs:${errorLine}:`, { exact: false }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^src\/lib\.rs:\d+:\d+$/ }),
    ).toHaveCount(0);
  });

  await test.step("a successful compile's warnings", async () => {
    await page.getByRole("tab", { name: "Explorer" }).click();
    await replaceInEditor(
      page,
      "self.count_map.get(key)\n    }",
      "let unused = 1;\n        self.count_map.get(key)\n    }",
    );
    await page.getByRole("button", { name: "Compile" }).click();
    await expect(
      page.getByText(/^Compiled \S+ in \d+\.\d s \(1 warning\)\.$/),
    ).toBeVisible({ timeout: TRANSACTION_TIMEOUT });
    await expect(
      page.getByRole("button", { name: /^src\/lib\.rs:\d+:\d+$/ }),
    ).toHaveCount(1);
    expect(await markers(page)).toEqual([
      expect.objectContaining({
        severity: WARNING,
        message: expect.stringContaining("unused variable: `unused`"),
      }),
    ]);
  });

  await test.step("clear the console", async () => {
    await page.getByRole("button", { name: "Clear console" }).click();
    await expect(
      page.getByText("Compile the script to see its output here."),
    ).toBeVisible();
  });
});
