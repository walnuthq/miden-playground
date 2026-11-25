// Bundled as strings by the Text rule in wrangler.jsonc.

import accountComponent from "@/templates/account-component.masm";
import authNoAuth from "@/templates/auth-no-auth.masm";
import basicWallet from "@/templates/basic-wallet.masm";
import countReader from "@/templates/count-reader.masm";
import counterAccount from "@/templates/counter-account.masm";
import counterNote from "@/templates/counter-note.masm";
import counterScript from "@/templates/counter-script.masm";
import note from "@/templates/note.masm";
import p2idNote from "@/templates/p2id-note.masm";
import transactionScript from "@/templates/transaction-script.masm";

export const templates = {
  library: "",
  "authentication-component": "",
  "account-component": accountComponent,
  note,
  "transaction-script": transactionScript,
  "basic-wallet": basicWallet,
  "p2id-note": p2idNote,
  "auth-no-auth": authNoAuth,
  "counter-account": counterAccount,
  "counter-note": counterNote,
  "counter-script": counterScript,
  "count-reader": countReader,
} as const;
