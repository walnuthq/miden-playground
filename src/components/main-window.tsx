'use client';

import { Toolbar } from '@/components/toolbar';
import { useMiden } from '@/lib/context-providers';
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { ExecutionOutput } from './execution-output';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { useSelectedEditorFile } from '@/lib/files';
import { editor } from 'monaco-editor';
import ComposeTransactionMiddlePan from './compose-transaction-middle-pan';
import Breadcrumbs from './breadcrumbs';

export function MainWindow({ toggleInspector }: { toggleInspector: () => void }) {
	const { selectedTab, executionOutput, updateFileContent } = useMiden();
	const monaco = useMonaco();

	const { content, file } = useSelectedEditorFile();

	const [value, setValue] = useState(content);

	useEffect(() => {
		setValue(content);
	}, [content]);
	const configureMonaco = useCallback((_monaco: Monaco) => {
		if (_monaco) {
			_monaco.editor.defineTheme('miden', {
				base: 'vs-dark',
				inherit: true,
				rules: [],
				colors: {
					'editor.background': '#040113',
					'editor.foreground': '#4E8CC0',
					'editorLineNumber.foreground': '#4E8CC0',
					'editorLineNumber.activeForeground': '#83afd4'
				}
			});
			_monaco.editor.setTheme('miden');
		}
	}, []);

	useEffect(() => {
		if (monaco) {
			configureMonaco(monaco);
		}
	}, [configureMonaco, monaco]);

	return (
		<>
			<ResizablePanel defaultSize={selectedTab === 'transaction' && executionOutput ? 45 : 75}>
				<div className="flex flex-col h-full">
					<Toolbar toggleInspector={toggleInspector} />
					{selectedTab !== 'transaction' && <Breadcrumbs />}
					<div className={`flex-1 ${file || selectedTab === 'transaction' ? 'block' : 'hidden'}`}>
						{selectedTab !== 'transaction' ? (
							<MonacoEditor
								onChange={(value) => {
									setValue(value ?? '');
									if (file && !file.readonly) updateFileContent(file.id, value ?? '');
								}}
								onMount={(editor: editor.IStandaloneCodeEditor, _monaco) => {
									configureMonaco(_monaco);
								}}
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
									theme: 'miden',
									readOnly: file ? file.readonly : true
								}}
								value={value}
								className={cn(
									'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
								)}
							/>
						) : (
							<ComposeTransactionMiddlePan />
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
