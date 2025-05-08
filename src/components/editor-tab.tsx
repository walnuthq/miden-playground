import { ResizablePanel, ResizableHandle, ResizablePanelGroup } from '@/components/ui/resizable';
import { Toolbar } from '@/components/toolbar';
import { Files } from '@/components/files';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inspector } from '@/components/inspector';
import Breadcrumbs from '@/components/breadcrumbs';
export const EditorTab = () => {
	return (
		<ResizablePanelGroup direction="horizontal">
			<ResizablePanel minSize={15} defaultSize={25}>
				<ScrollArea className="relative h-full overflow-auto">
					<Inspector />
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle className="w-[1px] bg-theme-border" />
			<ResizablePanel defaultSize={75}>
				<div className="flex flex-col h-full">
					<Toolbar />
					<Breadcrumbs />
					<Files />
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
};
