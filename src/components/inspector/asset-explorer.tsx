import { useMiden } from '@/lib/context-providers';
import { FileItem } from '.';
import AccountsList from './accounts-list';
import NotesList from './notes-list';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';

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
	const { files, selectFile, selectedFileId } = useMiden();

	return (
		<div className="flex flex-col pt-2">
			<AccountsList toggleCollapse={toggleCollapse} />
			<NotesList toggleCollapse={toggleCollapse} />
			<FileItem
				editorFile={files[TRANSACTION_SCRIPT_FILE_ID]}
				onClick={() => selectFile(TRANSACTION_SCRIPT_FILE_ID)}
				isSelected={selectedFileId === TRANSACTION_SCRIPT_FILE_ID}
				level={0}
			/>
		</div>
	);
}
