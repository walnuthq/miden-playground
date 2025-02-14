import { useMiden } from '@/lib/context-providers';
import React from 'react';

const NoteCard = ({ noteId, isClosing = true }: { noteId: string; isClosing?: boolean }) => {
	const { notes, removeTransactionNote } = useMiden();
	return (
		<>
			<div className="flex justify-between items-center">
				<div>
					<div className=" text-theme-text">Name:</div>

					<div className=" text-theme-text">Serial number:</div>
				</div>
				<div>
					<div className=" text-theme-text">{notes[noteId].name}</div>
					<div className=" text-theme-text">{notes[noteId].serialNumber.at(0)}</div>
					<div></div>
				</div>
				<div></div>
			</div>
			{isClosing && (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					height="24px"
					viewBox="0 -960 960 960"
					width="24px"
					fill="currentColor"
					className="size-8 p-2 text-theme-text absolute top-0 right-0 cursor-pointer hover:text-gray-300"
					onClick={(event) => {
						event.stopPropagation();
						removeTransactionNote(noteId);
					}}
				>
					<path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
				</svg>
			)}
		</>
	);
};

export default NoteCard;
