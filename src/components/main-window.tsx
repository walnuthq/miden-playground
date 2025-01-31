'use client';

import { Toolbar } from '@/components/toolbar';
import { useMiden } from '@/lib/context-providers';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { ExecutionOutput } from './execution-output';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import { useSelectedEditorFile } from '@/lib/files';
import ComposeTransactionMiddlePan from './compose-transaction-middle-pan';
import Breadcrumbs from './breadcrumbs';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { MultiFileEditor } from './multi-file-editor';
export function MainWindow({ toggleInspector }: { toggleInspector: () => void }) {
	const {
		selectedTab,
		executionOutput,
		updateFileContent,
		disableWalletComponent,
		disableAuthComponent
	} = useMiden();
	const result = useSelectedEditorFile();

	const [value, setValue] = useState('');

	useEffect(() => {
		if ('isMultiFile' in result) {
			return;
		}
		setValue(result.content);
	}, [result]);

	const renderEditor = () => {
		if (selectedTab === 'transaction') {
			return <ComposeTransactionMiddlePan />;
		}

		if ('isMultiFile' in result) {
			return (
				<MultiFileEditor
					result={result}
					updateFileContent={updateFileContent}
					disableWalletComponent={disableWalletComponent}
					disableAuthComponent={disableAuthComponent}
				/>
			);
		}

		return (
			<CustomMonacoEditor
				onChange={(value) => {
					setValue(value ?? '');
					if (result.file && !result.file.readonly) {
						updateFileContent(result.file.id, value ?? '');
					}
				}}
				readOnly={'isMultiFile' in result ? true : result.file ? result.file.readonly : true}
				value={value}
				className={cn(
					'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
				)}
			/>
		);
	};

	const shouldShowEditor =
		('isMultiFile' in result && result.walletScript.file) ||
		(!('isMultiFile' in result) && result.file) ||
		selectedTab === 'transaction';

	return (
		<>
			<ResizablePanel defaultSize={selectedTab === 'transaction' && executionOutput ? 45 : 75}>
				<div className="flex flex-col h-full">
					<Toolbar toggleInspector={toggleInspector} />
					{selectedTab !== 'transaction' && <Breadcrumbs />}
					<div className={`flex-1 ${shouldShowEditor ? 'block' : 'hidden'}`}>{renderEditor()}</div>
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
