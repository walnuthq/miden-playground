import { NoteRow } from './note-row'

export function NotesList() {
	const notes = [
		{ name: 'P2ID', isConsumed: false },
		{ name: 'P2IDR', isConsumed: true },
		{ name: 'SWAP', isConsumed: false },
	]

	return (
		<div className="flex flex-col py-4 px-4 gap-3">
			<div className="text-lg font-medium text-center">Notes</div>
			<div className="flex flex-col gap-2">
				{notes.map((note) => (
					<NoteRow key={note.name} {...note} />
				))}
			</div>
		</div>
	)
}
