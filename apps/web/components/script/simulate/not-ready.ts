import type { Script } from "@/lib/types/script";

// Why the script can't be simulated now, or nothing when it can.
export const notReady = ({ status, masp }: Script) =>
  status === "draft"
    ? "Compile the script to simulate it: its source changed since the last compile."
    : status === "error"
      ? "Fix the compile errors to simulate the script."
      : masp === ""
        ? "Compile the script to simulate it."
        : undefined;
