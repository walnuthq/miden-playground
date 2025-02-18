import AccountsList from './accounts-list';
import NotesList from './notes-list';

export function AssetExplorer() {
	const toggleCollapse = (
		id: string,
		setState: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
	) => {
		setState((prev) => ({
			...prev,
			[id]: !prev[id]
		}));
	};

	return (
		<div className="flex flex-col pt-2">
			{/* <FileItem
				editorFile={files[TRANSACTION_SCRIPT_FILE_ID]}
				onClick={() => selectFile(TRANSACTION_SCRIPT_FILE_ID)}
				isSelected={selectedFileId === TRANSACTION_SCRIPT_FILE_ID}
				level={0}
			/> */}
			<AccountsList toggleCollapse={toggleCollapse} />
			<NotesList toggleCollapse={toggleCollapse} />
		</div>
	);
}
