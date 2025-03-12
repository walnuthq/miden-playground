'use client';

import { useMiden } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { Tabs } from '@/components/tabs';
import { ComposeTransactionTab } from './compose-transaction-tab';
import { EditorTab } from './editor-tab';
import Footer from './footer';
import { InstructionsTab } from './instructions-tab';

export function Playground() {
	const { selectedTab } = useMiden();

	return (
		<div className="flex flex-col h-screen px-4 pt-4">
			<header className="h-16">
				<Header />
			</header>
			<Tabs />
			<main className="flex-1 border border-theme-border rounded-b-theme rounded-tr-theme overflow-hidden">
				{selectedTab === 'transaction' ? (
					<ComposeTransactionTab />
				) : selectedTab === 'instructions' ? (
					<InstructionsTab />
				) : (
					<EditorTab />
				)}
			</main>
			<footer className="h-12 flex items-center justify-start">
				<Footer />
			</footer>
		</div>
	);
}
