'use client';

import { useMiden } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { Tabs } from '@/components/tabs';
import { ComposeTransactionTab } from './compose-transaction-tab';
import { EditorTab } from './editor-tab';

export function Playground() {
	const { selectedTab } = useMiden();

	return (
		<div className="flex flex-col h-screen p-4">
			<header className="h-16">
				<Header />
			</header>
			<Tabs />
			<main className="flex-1 border-2 border-theme-border rounded-b-theme rounded-tr-theme overflow-hidden">
				{selectedTab === 'transaction' ? <ComposeTransactionTab /> : <EditorTab />}
			</main>
		</div>
	);
}
