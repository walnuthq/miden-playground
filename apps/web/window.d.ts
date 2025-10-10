declare global {
  interface Window {
    midenWallet: {
      accountId?: string;
      appName?: string;
      clearAccountChangeInterval?: () => void;
      network?: string;
      permission?: {
        accountId: string;
        allowedPrivateData: number;
        privateDataPermission: string;
        publicKey: Uint8Array;
        rpc: string;
      };
      publicKey?: Uint8Array;
    };
  }
}

export {};
