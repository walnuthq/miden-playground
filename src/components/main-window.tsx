'use client';

import { Toolbar } from '@/components/toolbar';
import { useMiden } from '@/lib/context-providers';

import { ExecutionOutput } from './execution-output';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { Files } from '@/components/files';
import ComposeTransactionMiddlePan from './compose-transaction-middle-pan';
import Breadcrumbs from './breadcrumbs';
export function MainWindow({ toggleInspector }: { toggleInspector: () => void }) {
	const { selectedTab, executionOutput } = useMiden();

	return (
		<>
			<ResizablePanel defaultSize={selectedTab === 'transaction' && executionOutput ? 45 : 75}>
				<div className="flex flex-col h-full">
					<Toolbar toggleInspector={toggleInspector} />
					{selectedTab !== 'transaction' && <Breadcrumbs />}
					<div className={`flex-1`}>
						{selectedTab !== 'transaction' ? <Files /> : <ComposeTransactionMiddlePan />}
					</div>
				</div>
			</ResizablePanel>
			{selectedTab === 'transaction' && executionOutput && (
				<>
					<ResizableHandle className="w-[2px] bg-theme-border" />
					<ResizablePanel defaultSize={30}>
						<ExecutionOutput />
					</ResizablePanel>
				</>
			)}
		</>
	);
}
