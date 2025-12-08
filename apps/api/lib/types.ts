export type Export = {
  name: string;
  digest: string;
  signature: { abi: number; params: string[]; results: string[] };
};

export type Dependency = { id: string; name: string; digest: string };

export const defaultDependencies = (): Dependency[] => [
  {
    id: "base",
    name: "base",
    digest:
      "0x389cc47c54704ed5d03183bcdc0819010501a1cab9f07a421432fc5c2a2e77ef",
  },
  {
    id: "std",
    name: "std",
    digest:
      "0x2eaedee678906c235e33a89a64d16ea71b951a444463e9bcf8675ab1fe6210c0",
  },
];
