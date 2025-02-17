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
		<div className="flex flex-col">
			<div
				className="h-[36px] border-b border-theme-border bg-theme-surface-highlight
					text-theme-text font-bold text-sm flex gap-2 items-center px-3"
			>
				File explorer
			</div>
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
