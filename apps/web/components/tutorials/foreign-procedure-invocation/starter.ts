import { counterContractAccount } from "@/components/tutorials/foreign-procedure-invocation/state";
import { compileScript, createScript } from "@/lib/api";
import type { TutorialStarter } from "@/lib/types/tutorial";
import {
  COUNTER_EXAMPLE_ID,
  counterExampleStarter,
} from "@/lib/utils/counter-example";
import { compiledPackageToScript, defaultScript } from "@/lib/utils/script";

export const COUNT_READER_NAME = "count-reader";

// The count-reader template (apps/api/templates/count-reader.masm), created
// and assembled by the API. It depends on the counter-account template, the
// counter example's code: its `procref.counter_account::get_count` is the
// root the deployed counter holds.
const countReaderScript = async () => {
  const { script, error } = await createScript({
    name: COUNT_READER_NAME,
    type: "account-component",
    example: "count-reader",
  });
  if (!script) {
    throw new Error(error ?? "The Count Reader couldn't be created.");
  }
  const { script: compiled, error: compileError } = await compileScript({
    ...defaultScript(),
    ...script,
  });
  if (!compiled) {
    throw new Error(compileError ?? "The Count Reader couldn't be compiled.");
  }
  if (compiled.status === "error") {
    throw new Error(`${compiled.name}: ${compiled.error}`);
  }
  return compiledPackageToScript(compiled);
};

// The tutorial's two scripts, read-only: the steps only read them, an edited
// counter would no longer match the deployed one's code, and the Count Reader
// is deployed as the template ships. With them, the Counter Contract account,
// whose components name the counter script.
const starter = async (): Promise<TutorialStarter> => {
  const [{ scripts: counterScripts }, countReader] = await Promise.all([
    counterExampleStarter({ readOnly: true }),
    countReaderScript(),
  ]);
  const counter = counterScripts.find(
    ({ name }) => name === COUNTER_EXAMPLE_ID,
  );
  if (!counter) {
    throw new Error("The counter-account script couldn't be imported.");
  }
  return {
    scripts: [counter, { ...countReader, readOnly: true }],
    accounts: [counterContractAccount(counter.id)],
  };
};

export default starter;
