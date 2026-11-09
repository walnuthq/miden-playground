import { expect, type Page, test } from "@playwright/test";
import { scriptHeader } from "./editor";
import { logBrowserErrors, startTutorial, tutorialPanel } from "./tutorial";

// The MASM counter was a built-in script and component until every tutorial
// compiled real packages. A state persisted before then holds a copy of both,
// which no code refreshes or removes: it must stay out of the user's scripts
// and components, as when it was a built-in (retiredScriptIds and
// retiredComponentIds, next to the built-ins' lists). No testnet transaction,
// no API.
const RETIRED = "counter-contract";
// The same copy under an id the app doesn't know: one of the user's.
const CONTROL = "some-old-script";

// Adds an account component script and its component to the persisted state,
// as an earlier version would have left them, and loads `pathname` with it.
// From an init script: the next page patches the state before the app reads
// it, where a write from the open page could be overwritten by the app's own.
const persist = async (page: Page, ids: string[], pathname: string) => {
  // A new sandbox saves its state after its first sync.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("state") !== null), {
      timeout: 60_000,
    })
    .toBe(true);
  await page.addInitScript((ids) => {
    const value = localStorage.getItem("state");
    if (!value) {
      return;
    }
    const state = JSON.parse(value) as {
      scripts: { id: string; name: string; type: string }[];
      components: {
        id: string;
        name: string;
        type: string;
        scriptId: string;
      }[];
    };
    const script = state.scripts.find(({ id }) => id === "basic-wallet");
    const component = state.components.find(({ id }) => id === "basic-wallet");
    if (!script || !component) {
      return;
    }
    for (const id of ids) {
      if (state.scripts.some((script) => script.id === id)) {
        continue;
      }
      // Before the user's scripts, as the built-ins are.
      state.scripts.unshift({ ...script, id, name: id });
      state.components.unshift({
        ...component,
        id,
        name: `Component of ${id}`,
        scriptId: id,
      });
    }
    localStorage.setItem("state", JSON.stringify(state));
  }, ids);
  await page.goto(pathname);
};

test("a retired built-in stays out of a sandbox's scripts and components", async ({
  page,
}) => {
  logBrowserErrors(page);
  const createScript = page.getByRole("button", { name: "Create new script" });
  await page.goto("/scripts");
  await expect(createScript).toBeVisible({ timeout: 60_000 });
  await persist(page, [RETIRED, CONTROL], "/scripts");

  // The sidebar lists them too, as links.
  const row = (text: string) => page.getByRole("row").filter({ hasText: text });
  const link = (name: string) => page.getByRole("link", { name, exact: true });

  await test.step("the scripts page lists the user's only", async () => {
    await expect(row(CONTROL)).toBeVisible({ timeout: 60_000 });
    await expect(link(CONTROL)).toBeVisible();
    await expect(row(RETIRED)).toHaveCount(0);
    await expect(link(RETIRED)).toHaveCount(0);
  });

  await test.step("so does the components page", async () => {
    await page.goto("/components");
    await expect(row(`Component of ${CONTROL}`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(link(`Component of ${CONTROL}`)).toBeVisible();
    await expect(row(`Component of ${RETIRED}`)).toHaveCount(0);
    await expect(link(`Component of ${RETIRED}`)).toHaveCount(0);
  });

  await test.step("the copy is still there: its page opens", async () => {
    await page.goto(`/scripts/${RETIRED}`);
    await expect(scriptHeader(page).name).toHaveText(RETIRED, {
      timeout: 60_000,
    });
  });
});

// Tutorials 7, 11 and 12 take the first account component script that isn't a
// built-in for the one the user created.
test("a retired built-in isn't the script a tutorial has the user create", async ({
  page,
}) => {
  logBrowserErrors(page);
  const panel = tutorialPanel(page);
  await startTutorial(page, "Deploy a counter contract");
  await expect(page).toHaveURL(/\/scripts$/);

  // Step 1 is done once the user's script is open.
  await test.step("opening the retired copy doesn't complete step 1", async () => {
    await persist(page, [RETIRED], `/scripts/${RETIRED}`);
    await expect(scriptHeader(page).name).toHaveText(RETIRED, {
      timeout: 60_000,
    });
    await expect(panel.step).toHaveText(/^Step 1 of/);
    await expect(panel.nextStepButton).toBeDisabled();
  });

  await test.step("opening a script of the user's does", async () => {
    await persist(page, [CONTROL], `/scripts/${CONTROL}`);
    await expect(scriptHeader(page).name).toHaveText(CONTROL, {
      timeout: 60_000,
    });
    await expect(panel.nextStepButton).toBeEnabled();
  });
});
