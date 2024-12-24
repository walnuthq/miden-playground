'use client';

import { Toolbar } from '@/components/toolbar';
import { useMiden } from '@/lib/context-providers';
import { Editor as MonacoEditor, useMonaco } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { ExecutionOutput } from './execution-output';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';

export function MainWindow() {
	const { files, selectedFileId, selectedTab, executionOutput } = useMiden();
	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) {
			monaco.editor.defineTheme('miden', {
				base: 'vs-dark',
				inherit: true,
				rules: [],
				colors: {
					'editor.background': '#000000'
				}
			});
		}
	}, [monaco]);

	return (
		<>
			<ResizablePanel defaultSize={selectedTab === 'transaction' && executionOutput ? 45 : 75}>
				<div className="flex flex-col h-full">
					<Toolbar />
					<div className="flex-1">
						{selectedFileId && (
							<MonacoEditor
								onMount={() => {}}
								options={{
									overviewRulerLanes: 0,
									minimap: { enabled: false },
									wordBreak: 'keepAll',
									wordWrap: 'on',
									smoothScrolling: true,
									scrollbar: {
										verticalSliderSize: 5,
										verticalScrollbarSize: 5
									},
									theme: 'miden'
								}}
								value={files[selectedFileId] ? files[selectedFileId].content : ''}
								className={cn(
									'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
								)}
								onChange={() => {}}
							/>
						)}
					</div>
				</div>
			</ResizablePanel>
			{selectedTab === 'transaction' && executionOutput && (
				<>
					<ResizableHandle className="w-[2px] bg-dark-miden-700" />
					<ResizablePanel defaultSize={30}>
						<ExecutionOutput />
					</ResizablePanel>
				</>
			)}
		</>
	);
}
