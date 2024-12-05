'use client';

import { useMiden } from '@/lib/context-providers';
import { NoteRow } from './note-row';

export function NotesList() {
	const { notes, isInitialized } = useMiden();

	return (
		<div className="flex flex-col py-4 px-4 gap-3">
			<div className="text-lg font-medium text-center">Notes</div>
			{isInitialized ? (
				<div className="flex flex-col gap-2">
					{notes.map((note) => (
						<NoteRow key={note.id} note={note} />
					))}
				</div>
			) : (
				<div className="flex flex-row justify-center items-center pt-6 text-sm text-muted-foreground">
					<div>Creating default notes...</div>
				</div>
			)}
		</div>
	);
}
