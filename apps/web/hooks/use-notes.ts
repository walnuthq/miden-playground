import useGlobalContext from "@/components/global-context/hook";

const useNotes = () => {
  const { inputNotes, dispatch } = useGlobalContext();
  return {
    inputNotes,
  };
};

export default useNotes;
