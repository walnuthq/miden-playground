import { useSelectedAccountData } from '@/lib/files';
import React, { useCallback, useEffect, useState } from 'react';
import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
import { ScrollArea } from './ui/scroll-area';
import { Console } from './console';
import { useMiden } from '@/lib/context-providers';
import { TRANSACTION_SCRIPT_FILE_ID } from '@/lib/consts';

const ComposeTransactionMiddlePan = () => {
	const { metadata, vault } = useSelectedAccountData();
	const [accountValue, setAccountValue] = useState(vault);
	const { files } = useMiden();

	useEffect(() => {
		setAccountValue(vault);
	}, [vault]);

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

	const monaco = useMonaco();

	useEffect(() => {
		if (monaco) {
			configureMonaco(monaco);
		}
	}, [configureMonaco, monaco]);

	return (
		<div className="flex flex-col justify-end  h-[94%]">
			{metadata && vault && (
				<div className="flex-1 overflow-hidden text-white">
					<ScrollArea className="h-full w-full px-4">
						<div className="py-4">
							<span className="font-bold">Account ID: </span>
							{metadata}
						</div>
						<div className="font-bold pb-4">Vault: </div>
						<div className="space-y-4 pb-4">
							<div className="h-[200px] rounded-miden">
								<MonacoEditor
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
										readOnly: true
									}}
									value={accountValue}
									height="100%"
									className="whitespace-pre-wrap"
								/>
							</div>
						</div>
						<div className="font-bold pb-4">Bit code:</div>
						<div className="font-bold">Transaction script:</div>
						<div className="space-y-4 pb-4">
							<div className="h-[200px] rounded-miden">
								<MonacoEditor
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
										readOnly: true
									}}
									value={files[TRANSACTION_SCRIPT_FILE_ID].content.value}
									height="100%"
									className="whitespace-pre-wrap"
								/>
							</div>
						</div>
					</ScrollArea>
				</div>
			)}
			<Console />
		</div>
	);
};

export default ComposeTransactionMiddlePan;
