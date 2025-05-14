'use client';

import { useFiles, useMiden } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { Tabs } from '@/components/tabs';
import { ComposeTransactionTab } from './compose-transaction-tab';
import { EditorTab } from './editor-tab';
import Footer from './footer';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useNextStep } from 'nextstepjs';

export function Playground() {
	const { selectedTab, selectTab, setIsTutorialMode, clearConsole } = useMiden();
	const { startNextStep } = useNextStep();
	const { files, closeFile, selectedFileId } = useFiles();
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		const tutorial = searchParams.get('tutorial');
		if (tutorial === 'true') {
			const newUrl = window.location.pathname;
			router.replace(newUrl);
			Object.values(files).map((file) => {
				closeFile(file.id);
			});
			if (selectedFileId) closeFile(selectedFileId);
			selectTab('transaction');
			startNextStep('mainTour');
			clearConsole();
			setIsTutorialMode(true);
		}
	}, []);

	return (
		<div className="flex flex-col h-screen px-4">
			<header className="h-16">
				<Header />
			</header>
			<Tabs />
			<main className="flex-1 border border-theme-border rounded-b-theme rounded-tr-theme overflow-hidden">
				{selectedTab === 'transaction' ? <ComposeTransactionTab /> : <EditorTab />}
			</main>
			<footer className="h-12 flex items-center justify-start">
				<Footer />
			</footer>
		</div>
	);
}
