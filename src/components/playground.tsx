import { MidenContextProvider } from '@/lib/context-providers';
import { NotesList } from '@/components/notes-list';
import { Account } from '@/components/account';
import { Console } from '@/components/console';
import { Header } from '@/components/header';

export function Playground() {
	return (
		<MidenContextProvider>
			<main className="flex flex-col h-screen">
				<div className="h-16 border-b border-neutral-200">
					<Header />
				</div>
				<div className="flex-1 flex flex-row border-b border-neutral-200">
					<div className="flex-1 border-r border-neutral-200">
						<NotesList />
					</div>
					<div className="flex-1">
						<Account />
					</div>
				</div>
				<Console />
			</main>
		</MidenContextProvider>
	);
}
