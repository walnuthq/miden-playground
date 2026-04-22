"use client";
import { useQuery } from "@tanstack/react-query";
import Script from "@/components/script/script";
import { getScript } from "@/lib/api";
import { isValidUUIDv4 } from "@/lib/utils";

const ScriptIndex = ({ id }: { id: string }) => {
  const { data } = useQuery({
    queryKey: ["scripts", id],
    queryFn: () => getScript(id),
    enabled: isValidUUIDv4(id),
  });
  const script = data?.script;
  return <Script id={id} serverScript={script} />;
};

export default ScriptIndex;
