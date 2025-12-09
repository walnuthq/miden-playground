declare global {
  interface Window {
    // Miden Wallet
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
    // Simple Analytics
    sa_event: (
      event: string,
      metadata: Record<string, string | boolean | number | Date>
    ) => void;
  }
}

export {};
