import { useMiden } from '@/lib/context-providers';
import React from 'react';

const NoteCard = ({ noteId }: { noteId: string }) => {
	const { notes } = useMiden();
	return (
		<>
			<div className="">
				<div className="flex justify-between items-center px-4 py-2 text-theme-text">
					<div>Name:</div>
					<div className="">{notes[noteId].name}</div>
				</div>
				<div className="flex border-t px-4 py-2 border-theme-border justify-between items-center text-theme-text">
					<div>Serial number:</div>
					<div className="">{notes[noteId].serialNumberDecimalString}</div>
				</div>
			</div>
		</>
	);
};

export default NoteCard;
