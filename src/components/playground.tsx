import { MidenContextProvider } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { MainWindow } from '@/components/main-window';
import { Tabs } from '@/components/tabs';
import { Inspector } from '@/components/inspector';

export function Playground() {
	return (
		<MidenContextProvider>
			<div className="flex flex-col h-screen p-4">
				<header className="h-16">
					<Header />
				</header>
				<main className="flex-1 border-2 border-dark-miden-700 flex flex-row rounded-miden">
					<Tabs />
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel defaultSize={25}>
							<Inspector />
						</ResizablePanel>
						<ResizableHandle className="w-[2px] bg-dark-miden-700" />
						<MainWindow />
					</ResizablePanelGroup>
				</main>
			</div>
		</MidenContextProvider>
	);
}
