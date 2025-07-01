export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const formatId = (id: string) => `${id.slice(0, 10)}…${id.slice(-8)}`;

export const formatAddress = (address: string, networkId: string) =>
  `${networkId}${address.slice(networkId.length).slice(0, 8)}…${address.slice(-8)}`;
