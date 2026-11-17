import type { Page } from "@playwright/test";

// The record counts of the testnet store's account and note tables, by table:
// what a local run (a simulation, a preview) must leave as it was. The code
// caches (`accountCode`, `foreignAccountCode`) are left out: executing a
// transaction caches the code of a note asset's faucet, which records no
// account.
export const storeRecordCounts = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<Record<string, number>>((resolve, reject) => {
        const open = indexedDB.open("MidenClientDB_mtst");
        open.onerror = () => reject(open.error);
        open.onsuccess = async () => {
          const db = open.result;
          const names = [...db.objectStoreNames].filter((name) =>
            /AccountHeaders|AccountStorage|AccountAssets|Notes$|^transactions$/.test(
              name,
            ),
          );
          if (names.length === 0) {
            reject(new Error("no account or note table in the store"));
            return;
          }
          const transaction = db.transaction(names, "readonly");
          const counts = await Promise.all(
            names.map(
              (name) =>
                new Promise<[string, number]>((resolveCount) => {
                  const count = transaction.objectStore(name).count();
                  count.onsuccess = () => resolveCount([name, count.result]);
                }),
            ),
          );
          db.close();
          resolve(Object.fromEntries(counts));
        };
      }),
  );
