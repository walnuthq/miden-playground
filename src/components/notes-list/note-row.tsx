import { Button } from '@/components/ui/button'

export function NoteRow({ name, isConsumed }: { name: string; isConsumed: boolean }) {
	return (
		<div className="border border-neutral-200 rounded-md p-2 flex flex-row justify-between items-center">
			<div>{name}</div>
			{!isConsumed ? (
				<Button size="sm" variant="outline">
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
