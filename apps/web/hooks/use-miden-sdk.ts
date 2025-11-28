import { useContext } from "react";
import { MidenSdkContext } from "@/components/miden-sdk-context";

export const useMidenSdk = () => {
  const { midenSdk } = useContext(MidenSdkContext);
  return { ...midenSdk, midenSdk };
};

export default useMidenSdk;
