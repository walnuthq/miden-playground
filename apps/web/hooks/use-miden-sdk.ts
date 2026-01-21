import { useContext } from "react";
import { MidenSdkContext } from "@/components/miden-sdk-context";

export const useMidenSdk = () => {
  const { midenSdk } = useContext(MidenSdkContext);
  return { midenSdk };
};

export default useMidenSdk;
