import Component from "@/components/component";

const ComponentPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  return <Component id={id} />;
};

export default ComponentPage;
