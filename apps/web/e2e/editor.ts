import { expect, type Page } from "@playwright/test";
import { selectOption, TRANSACTION_TIMEOUT } from "./tutorial";

// Monaco loads lazily, renders only visible lines and splits them into
// tokens: check its models rather than the page text.
export const waitForEditorText = (page: Page, text: string) =>
  page.waitForFunction(
    (text) =>
      (
        window as unknown as {
          monaco?: {
            editor: { getModels: () => { getValue: () => string }[] };
          };
        }
      ).monaco?.editor
        .getModels()
        .some((model) => model.getValue().includes(text)),
    text,
  );

// Editing Monaco through the keyboard is unreliable: edit its model, which
// keeps undo and change events.
export const replaceInEditor = async (
  page: Page,
  search: string,
  replace: string,
) => {
  await waitForEditorText(page, search);
  await page.evaluate(
    ({ search, replace }) => {
      type Range = object;
      type Model = {
        getValue: () => string;
        findMatches: (...args: unknown[]) => { range: Range }[];
        pushEditOperations: (...args: unknown[]) => void;
      };
      const { monaco } = window as unknown as {
        monaco: { editor: { getModels: () => Model[] } };
      };
      const model = monaco.editor
        .getModels()
        .find((model) => model.getValue().includes(search));
      const match = model
        ?.findMatches(search, false, false, true, null, false)
        .at(-1);
      if (!model || !match) {
        throw new Error(`${search} not found in the editor`);
      }
      model.pushEditOperations(
        [],
        [{ range: match.range, text: replace }],
        () => null,
      );
    },
    { search, replace },
  );
};

// The editor console's summary of a successful compile, e.g. `Compiled
// counter-account in 3.9 s.` or `… in 3.9 s (1 warning).`.
export const COMPILED = /^Compiled \S+ in \d+\.\d s/;

// The script page's breadcrumb: the script's name, a dot while it's edited
// since its last compile, and its compile status.
export const scriptHeader = (page: Page) => {
  // Not the whole header: the network badge is a badge too.
  const header = page.locator("header").getByRole("navigation", {
    name: "breadcrumb",
  });
  return {
    name: header.locator('[data-slot="breadcrumb-page"]'),
    dirty: header.getByRole("img", { name: "Edited since the last compile" }),
    status: header.locator('[data-slot="badge"]'),
  };
};

// An editable script with the counter contract's source, for specs that only
// need the editor: it deploys nothing. It starts as a draft, until compiled.
export const createCounterScript = async (page: Page) => {
  await page.goto("/scripts");
  const create = page.getByRole("button", { name: "Create new script" });
  // The app shell shows it disabled until the client is ready.
  await expect(create).toBeEnabled({ timeout: TRANSACTION_TIMEOUT });
  await create.click();
  const dialog = page.getByRole("dialog").filter({ hasText: "Create Script" });
  await dialog.getByLabel("Name").fill("counter-account");
  await selectOption(page, "Type", "Account Component");
  await selectOption(page, "Example", "Counter Contract");
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(page).toHaveURL(/\/scripts\/[0-9a-z_-]+$/);
  await waitForEditorText(page, "fn get_count(&self) -> Felt {");
};
