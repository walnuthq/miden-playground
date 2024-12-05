import { Button } from '@/components/ui/button'
import { useMiden } from '@/lib/context-providers'
import { Note } from '@/lib/types'

export function NoteRow({ note }: { note: Note }) {
	const { consumeNote } = useMiden()

	return (
		<div className="border border-neutral-200 rounded-md p-2 flex flex-row justify-between items-center">
			<div>{note.name}</div>
			{!note.isConsumed ? (
				<Button size="sm" variant="outline" onClick={() => consumeNote(note.id)}>
					Consume
				</Button>
			) : (
				<Button size="sm" variant="ghost" disabled>
					Consumed
				</Button>
			)}
		</div>
	)
}
