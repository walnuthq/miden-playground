import { useMiden } from '@/lib/context-providers';
import AccountsList from './accounts-list';
import NotesList from './notes-list';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';
import InlineIcon from '../ui/inline-icon';

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
	const { selectFile, selectedFileId } = useMiden();

	return (
		<div className="flex flex-col py-2 text-xs">
			<div
				className={`flex px-3 py-1 flex-row items-center ${
					selectedFileId === TRANSACTION_SCRIPT_FILE_ID ? 'bg-dark-miden-800' : 'hover:bg-white/10'
				} gap-2 text-white cursor-pointer`}
				onClick={() => {
					selectFile(TRANSACTION_SCRIPT_FILE_ID);
				}}
			>
				<InlineIcon variant="file_2" color="white" className="w-4 h-4" />
				<span className="font-semibold">Transaction script</span>
			</div>
			<AccountsList toggleCollapse={toggleCollapse} />
			<NotesList toggleCollapse={toggleCollapse} />
		</div>
	);
}
