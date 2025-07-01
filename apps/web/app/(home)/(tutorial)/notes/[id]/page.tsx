import Note from "@/components/note";

const NotePage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <Note id={id} />;
};

export default NotePage;
