import Footer from '@/components/footer';
import { Header } from '@/components/header';
import { InstructionsTab } from '@/components/instructions-tab';
import Link from 'next/link';

export const runtime = 'edge';

export default function InstructionsPage() {
	return (
		<div className="flex flex-col h-screen px-4 ">
			<header className="h-16">
				<Header />
			</header>
			<nav className="mb-4">
				<Link
					className="py-1 text-theme-text-subtle text-base cursor-pointer px-3 rounded-theme hover:bg-theme-border transition-all"
					href="/"
				>
					Back to the playground
				</Link>
			</nav>
			<main className="flex-1 border border-theme-border rounded-theme relative overflow-hidden">
				<InstructionsTab />
			</main>
			<footer className="h-12 flex items-center justify-start">
				<Footer />
			</footer>
		</div>
	);
}
