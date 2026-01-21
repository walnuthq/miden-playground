import { type CustomSignConfirmStep } from "miden-para";
import { useParaMiden as defaultUseParaMiden } from "miden-para-react";
import { MIDEN_TESTNET_RPC_URL } from "@/lib/constants";

const customSignConfirmStep: CustomSignConfirmStep = async (summary) => {
  //await openCustomModal(summary);
  console.log(summary);
};

export const useParaMiden = () =>
  defaultUseParaMiden(
    MIDEN_TESTNET_RPC_URL,
    "public",
    {},
    false,
    customSignConfirmStep,
  );
