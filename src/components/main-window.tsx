'use client';

import { Toolbar } from '@/components/toolbar';
import { useMiden } from '@/lib/context-providers';
import { TransactionResult } from '@/components/transaction-result';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export function MainWindow() {
	const { selectedTransaction } = useMiden();
	console.log(selectedTransaction?.result);
	return (
		<>
			<Toolbar />
			<div className="flex-1 flex flex-row">
				<div className="flex-1 border-r-2 border-dark-miden-700 flex flex-row">
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel defaultSize={60} id="left-panel" order={1}>
							<div className="flex-1"></div>
						</ResizablePanel>
						{selectedTransaction?.result && (
							<>
								<ResizableHandle className="w-[2px] bg-dark-miden-700" />
								<ResizablePanel
									defaultSize={40}
									className="flex flex-col"
									id="right-panel"
									order={2}
								>
									<TransactionResult />
								</ResizablePanel>
							</>
						)}
					</ResizablePanelGroup>
				</div>
				<div className="w-[44px]"></div>
			</div>
		</>
	);
}
