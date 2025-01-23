import { useMiden } from '@/lib/context-providers/miden-context-provider';
import { useSelectedEditorFile } from '@/lib/files';
import InlineIcon from './ui/inline-icon';
import React from 'react';

const Breadcrumbs = () => {
	const { type, typeId, file } = useSelectedEditorFile();
	const { notes, accounts } = useMiden();
	console.log(typeId);
	return (
		<div className="flex gap-2 text-white text-xs flex-row border-dark-miden-700 px-2 p-1">
			<div>{type === 'account' ? 'Accounts' : 'Notes'}</div>
			<div className="flex items-center gap-2">
				<InlineIcon variant={'arrow'} color="white" className={` w-2 h-2`} />
				<div>
					{type === 'account' ? accounts[typeId]?.name : notes[typeId]?.name.toLocaleUpperCase()}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<InlineIcon variant={'arrow'} color="white" className={` w-2 h-2`} />
				<div>{file?.name}</div>
			</div>
		</div>
	);
};

export default Breadcrumbs;
