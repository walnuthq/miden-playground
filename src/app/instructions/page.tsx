import Footer from '@/components/footer';
import { Header } from '@/components/header';
import { InstructionsTab } from '@/components/instructions-tab';
import { MidenContextProvider } from '@/lib/context-providers/miden-context-provider';
import Link from 'next/link';

export const runtime = 'edge';

export default function InstructionsPage() {
	return (
		<MidenContextProvider>
			<div className="flex flex-col h-screen px-4 pt-4">
				<header className="h-16">
					<Header />
				</header>
				<nav className="mb-4">
					<Link
						className="font-semibold py-1 text-theme-text-subtle text-base cursor-pointer px-2 rounded-theme hover:bg-theme-border transition-all"
						href="/"
					>
						Back to the playground
					</Link>
				</nav>
				<main className="flex-1 border border-theme-border rounded-theme overflow-hidden">
					<InstructionsTab />
				</main>
				<footer className="h-12 flex items-center justify-start">
					<Footer />
				</footer>
			</div>
		</MidenContextProvider>
	);
}
