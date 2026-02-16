import { useContext } from "react";
import useGlobalContext from "@/components/global-context/hook";
import { MockWebClientContext } from "@/components/mock-web-client-context";
import { WebClientContext } from "@/components/web-client-context";

const useWebClient = () => {
  const { networkId } = useGlobalContext();
  const { client: mockWebClient } = useContext(MockWebClientContext);
  const { client: webClient } = useContext(WebClientContext);
  const client = networkId === "mmck" ? mockWebClient : webClient;
  return { client: client! };
};

export default useWebClient;
