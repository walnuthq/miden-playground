import { type Store } from "@/lib/types";

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatId = (id: string) => `${id.slice(0, 10)}…${id.slice(-8)}`;

export const formatValue = (value: string) =>
  `${value.slice(0, 18)}…${value.slice(-16)}`;

export const formatAddress = (address: string, networkId: string) =>
  `${networkId}${address.slice(networkId.length).slice(0, 8)}…${address.slice(-8)}`;

export const deleteStore = () =>
  new Promise((resolve) => {
    const deleteRequest = indexedDB.deleteDatabase("MidenClientDB");
    deleteRequest.onsuccess = resolve;
  });

export const storeSerializer = (store: Store) => JSON.stringify(store);
