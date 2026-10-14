import type { Page } from "@playwright/test";

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
