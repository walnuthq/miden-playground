import type { State } from "@/lib/types/state";
import { defaultState } from "@/lib/utils/state";
import {
  basicWalletAccount,
  basicFungibleFaucetAccount,
  midenFaucetAccount,
} from "@/lib/utils/account";

const state: State = {
  ...defaultState(),
  accounts: [
    midenFaucetAccount("mtst"),
    {
      ...basicFungibleFaucetAccount({
        storageMode: "public",
        symbol: "MDN",
        decimals: 6,
        maxSupply: "100000000000000000",
        totalSupply: "100000000000000000",
      }),
      id: "0x198b951cb9040a5178324da5347d5a",
      name: "MDN Faucet",
      address: "mtst1aqvch9guhyzq55tcxfx62dratgat564v_qr7qqq9wr6w",
      identifier: "mtst1aqvch9guhyzq55tcxfx62dratgat564v",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      // storage
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0xc4266cf766bb02910d19cdb8a215a3",
      name: "Wallet A",
      address: "mtst1arzzvm8hv6as9ygdr8xm3gs45vsn2muu_qr7qqq9wr6w",
      identifier: "mtst1arzzvm8hv6as9ygdr8xm3gs45vsn2muu",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      // fa and s
    },
    {
      ...basicWalletAccount({ storageMode: "public" }),
      id: "0xafaf4cb2ab65621128c868fc5e4d94",
      name: "Wallet B",
      address: "mtst1azh67n9j4djkyyfgep50chjdjsju652t_qr7qqq9wr6w",
      identifier: "mtst1azh67n9j4djkyyfgep50chjdjsju652t",
      routingParameters: "qr7qqq9wr6w",
      isNew: false,
      //
    },
  ],
  tutorialId: "transfer-assets-between-wallets",
};

export default state;
