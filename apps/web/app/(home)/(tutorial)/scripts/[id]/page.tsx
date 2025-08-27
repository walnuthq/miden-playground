import Script from "@/components/script";

const ScriptPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <Script id={id} />;
};

export default ScriptPage;
