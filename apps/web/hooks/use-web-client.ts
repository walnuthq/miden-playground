import { useContext } from "react";
import {
  WebClientContext,
  createClient,
} from "@/components/web-client-context";
import {
  clientGetAllInputNotes,
  clientGetConsumableNotes,
  wasmAccountToAccount,
  clientGetAccountById,
} from "@/lib/web-client";
import useMidenSdk from "@/hooks/use-miden-sdk";
import { type Account } from "@/lib/types/account";
import { type NetworkId } from "@/lib/types/network";
import useGlobalContext from "@/components/global-context/hook";
import { deleteStore, defaultStore } from "@/lib/types/store";
import { MIDEN_FAUCET_ADDRESS } from "@/lib/constants";

const useWebClient = () => {
  const { client } = useContext(WebClientContext);
  const { midenSdk } = useMidenSdk();
  const {
    networkId,
    accounts: previousAccounts,
    scripts,
    dispatch,
  } = useGlobalContext();
  const syncState = async () => {
    try {
      const syncSummary = await client.syncState();
      const inputNotes = await clientGetAllInputNotes({
        client,
        previousInputNotes: [],
        midenSdk,
      });
      const accounts: Account[] = [];
      for (const previousAccount of previousAccounts) {
        if (previousAccount.address === MIDEN_FAUCET_ADDRESS) {
          accounts.push(previousAccount);
          continue;
        }
        const wasmAccount = await clientGetAccountById({
          client,
          accountId: previousAccount.id,
          midenSdk,
        });
        const consumableNotes = await clientGetConsumableNotes({
          client,
          accountId: previousAccount.id,
          midenSdk,
        });
        const consumableNoteIds = consumableNotes.map((consumableNote) =>
          consumableNote.inputNoteRecord().id().toString()
        );
        const account = wasmAccountToAccount({
          wasmAccount,
          name: previousAccount.name,
          components: previousAccount.components,
          networkId,
          updatedAt: syncSummary.blockNum(),
          consumableNoteIds,
          scripts,
          midenSdk,
        });
        accounts.push(account);
      }
      dispatch({
        type: "SYNC_STATE",
        payload: {
          blockNum: syncSummary.blockNum(),
          accounts,
          inputNotes,
        },
      });
    } catch (error) {
      console.error("ERROR: SyncState", error);
    }
  };
  const resetState = async (newNetworkId: NetworkId) => {
    await deleteStore();
    const newClient = await createClient({
      networkId: newNetworkId,
      serializedMockChain: null,
      midenSdk,
    });
    await newClient.forceImportStore(JSON.stringify(defaultStore()));
    const syncSummary = await newClient.syncState();
    dispatch({
      type: "RESET_STATE",
      payload: {
        networkId: newNetworkId,
        blockNum: syncSummary.blockNum(),
      },
    });
  };
  return { client, syncState, resetState };
};

export default useWebClient;
