export const importAccountByAddress = async (accountAddress: string) => {
  const { WebClient, AccountId } = await import("@demox-labs/miden-sdk");
  const client = await WebClient.createClient();
  const accountId = AccountId.fromBech32(accountAddress);
  const account = await client.getAccount(accountId);
  if (account) {
    return account;
  }
  await client.importAccountById(accountId);
  const importedAccount = await client.getAccount(accountId);
  if (!importedAccount) {
    throw new Error("Error importing account");
  }
  return importedAccount!;
};
