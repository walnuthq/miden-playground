'use client';
import { useMiden } from '@/lib/context-providers';
import { Header } from '@/components/header';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { MainWindow } from '@/components/main-window';
import { Tabs } from '@/components/tabs';
import { Inspector } from '@/components/inspector';
import { useRef } from 'react';
import { ScrollArea } from './ui/scroll-area';
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
	const { isCollapsedTabs, collapseTabs } = useMiden();
	const toggleInspector = () => {
		if (inspectorPanelRef.current) {
			if (isCollapsedTabs) {
				inspectorPanelRef.current.expand();
				collapseTabs();
			} else {
				inspectorPanelRef.current.collapse();
				collapseTabs();
			}
		}
	};

	const handlePanelCollapse = () => {
		if (!isCollapsedTabs) {
			collapseTabs();
		}
	};

	const handlePanelExpand = () => {
		if (isCollapsedTabs) {
			collapseTabs();
		}
	};

	// const handlePanelResize = () => {
	// 	const size = inspectorPanelRef.current?.getSize();
	// 	if (size < 5) {
	// 		collapseTabs();
	// 	}
	// };
	return (
		<div className="flex flex-col h-screen p-4">
			<header className="h-16">
				<Header />
			</header>
			<main className="flex-1 border-2 border-dark-miden-700 rounded-miden overflow-hidden">
				<Tabs />
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel
						ref={inspectorPanelRef}
						defaultSize={25}
						collapsible={true}
						minSize={0}
						// onResize={handlePanelResize}
						collapsedSize={0}
						onCollapse={handlePanelCollapse}
						onExpand={handlePanelExpand}
					>
						<ScrollArea className="relative h-full overflow-auto">
							<Inspector />
						</ScrollArea>
					</ResizablePanel>
					<ResizableHandle className="w-[2px] bg-dark-miden-700" />
					<MainWindow toggleInspector={toggleInspector} />
				</ResizablePanelGroup>
			</main>
		</div>
	);
}
