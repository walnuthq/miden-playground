import type { ParaWeb, Wallet } from "@getpara/web-sdk";
import {
  evmPkToCommitment,
  getUncompressedPublicKeyFromWallet,
  resolveEvmWallets,
  signCb,
} from "@miden-sdk/para";
import {
  AccountBuilder,
  AccountComponent,
  AccountStorageMode,
  MidenClient,
} from "@miden-sdk/miden-sdk/lazy";
import type { NetworkId } from "@/lib/types/network";
import { networks, noteTransportUrls } from "@/lib/miden-client";

// The ECDSA K256 Keccak value of the WASM AuthScheme enum, which the lazy SDK
// entry doesn't export (it exports a string-valued AuthScheme instead).
const AUTH_ECDSA_K256_KECCAK = 1;

export type ParaClient = {
  client: MidenClient;
  accountId: string;
  // Returns and clears the error the last Para signature failed with (e.g. the
  // user dismissing Para's confirmation modal): the transaction executor
  // reports it as a generic auth event failure, dropping its message.
  takeSignError: () => unknown;
};

// A MidenClient signing through Para, with the public Miden account derived
// from the EVM wallet's key set up in it. Same account as @miden-sdk/para's
// createParaMidenClient (all-zero seed, so the id is the same for a given
// wallet), but built here to control the client:
// - useWorker: false, since the worker relays the sign callback with a 30s
//   timeout (the Para confirmation modal can take longer) and keeps its own
//   in-memory account state, which misses an account inserted after it
//   started (web-sdk#222: "account data wasn't found");
// - proverUrl, to prove on the network's remote prover rather than locally.
// No storeName: it shares MidenProvider's store (MidenClientDB_<network>), so
// the app's own client reads the account and transactions it writes, and
// keeps that store synced: this client doesn't sync itself, as its syncs would
// queue behind the app client's on the store's sync lock.
export const createParaClient = async ({
  para,
  wallet,
  networkId,
}: {
  para: ParaWeb;
  wallet: Wallet;
  networkId: NetworkId;
}): Promise<ParaClient> => {
  const [evmWallet = wallet] = resolveEvmWallets(para, [wallet]);
  const publicKey = await getUncompressedPublicKeyFromWallet(para, evmWallet);
  const paraSign = signCb(para, evmWallet, true);
  let signError: unknown = null;
  const client = await MidenClient.create({
    rpcUrl: networks[networkId],
    noteTransportUrl: noteTransportUrls[networkId],
    proverUrl: networks[networkId],
    useWorker: false,
    keystore: {
      getKey: async () => undefined,
      insertKey: async () => {},
      sign: async (publicKeyCommitment, signingInputs) => {
        try {
          return await paraSign(publicKeyCommitment, signingInputs);
        } catch (error) {
          signError = error;
          throw error;
        }
      },
    },
  });
  const commitment = await evmPkToCommitment(publicKey);
  const { account } = new AccountBuilder(new Uint8Array(32))
    .withAuthComponent(
      AccountComponent.createAuthComponentFromCommitment(
        commitment,
        AUTH_ECDSA_K256_KECCAK,
      ),
    )
    .storageMode(AccountStorageMode.public())
    .withBasicWalletComponent()
    .build();
  try {
    // Picks up the deployed account and its current state.
    await client.accounts.import(account.id());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Not on chain yet: tracked locally until its first transaction.
  }
  if (!(await client.accounts.get(account.id()))) {
    await client.accounts.insert({ account });
  }
  return {
    client,
    accountId: account.id().toString(),
    takeSignError: () => {
      const error = signError;
      signError = null;
      return error;
    },
  };
};
