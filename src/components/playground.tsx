'use client';
import { MidenContextProvider } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { MainWindow } from '@/components/main-window';
import { Tabs } from '@/components/tabs';
import { Inspector } from '@/components/inspector';
import { useRef, useState } from 'react';

interface PanelHandle {
	collapse: () => void;
	expand: () => void;
	getId: () => string;
	getSize: () => number;
	isCollapsed: () => boolean;
	isExpanded: () => boolean;
	resize: (size: number) => void;
}

export function Playground() {
	const inspectorPanelRef = useRef<PanelHandle>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);

	const toggleInspector = () => {
		if (inspectorPanelRef.current) {
			if (isCollapsed) {
				inspectorPanelRef.current.expand();
				setIsCollapsed(false);
			} else {
				inspectorPanelRef.current.collapse();
				setIsCollapsed(true);
			}
		}
	};
	return (
		<MidenContextProvider>
			<div className="flex flex-col h-screen p-4">
				<header className="h-16">
					<Header />
				</header>
				<main className="flex-1 border-2 border-dark-miden-700 flex flex-row rounded-miden">
					<Tabs />
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel
							ref={inspectorPanelRef}
							defaultSize={25}
							collapsible={true}
							minSize={0}
							collapsedSize={0}
						>
							<div className="relative h-full">
								<Inspector />
							</div>
						</ResizablePanel>
						<ResizableHandle className="w-[2px] bg-dark-miden-700" />
						<MainWindow toggleInspector={toggleInspector} />
					</ResizablePanelGroup>
				</main>
			</div>
		</MidenContextProvider>
	);
}
