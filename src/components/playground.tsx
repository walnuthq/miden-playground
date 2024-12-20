import { MidenContextProvider } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import InlineIcon from '@/components/ui/inline-icon';
import { TransactionBuilder } from '@/components/transaction-builder';
import { MainWindow } from '@/components/main-window';

export function Playground() {
	return (
		<MidenContextProvider>
			<div className="flex flex-col h-screen p-4">
				<header className="h-16">
					<Header />
				</header>
				<main className="flex-1 border-2 border-dark-miden-700 flex flex-row rounded-miden">
					<div className="border-r-2 border-dark-miden-700 w-[44px]">
						<div className="h-[54px] border-b-2 border-dark-miden-700 flex items-center justify-center cursor-pointer">
							<InlineIcon variant="transaction-builder" className="w-5 h-5" />
						</div>
					</div>
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel defaultSize={25}>
							<TransactionBuilder />
						</ResizablePanel>
						<ResizableHandle className="w-[2px] bg-dark-miden-700" />
						<ResizablePanel defaultSize={75} className="flex flex-col">
							<MainWindow />
						</ResizablePanel>
					</ResizablePanelGroup>
				</main>
			</div>
		</MidenContextProvider>
	);
}
