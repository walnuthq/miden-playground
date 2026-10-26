declare global {
  interface Window {
    // Simple Analytics
    sa_event?: (name: string, metadata?: Record<string, unknown>) => void;
    // Bread Wallet
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

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?: string;
  }
}

export {};
