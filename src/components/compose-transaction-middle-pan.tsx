// import { useSelectedAccountData } from '@/lib/files';
// import React, { useCallback, useEffect } from 'react';
// // import { Editor as MonacoEditor, Monaco, useMonaco } from '@monaco-editor/react';
// import { ScrollArea } from './ui/scroll-area';
import { Console } from './console';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const ComposeTransactionMiddlePan = () => {
	// const { metadata, vault } = useSelectedAccountData();

	// const configureMonaco = useCallback((_monaco: Monaco) => {
	// 	if (_monaco) {
	// 		_monaco.editor.defineTheme('miden', {
	// 			base: 'vs-dark',
	// 			inherit: true,
	// 			rules: [],
	// 			colors: {
	// 				'editor.background': '#040113',
	// 				'editor.foreground': '#4E8CC0',
	// 				'editorLineNumber.foreground': '#4E8CC0',
	// 				'editorLineNumber.activeForeground': '#83afd4'
	// 			}
	// 		});
	// 		_monaco.editor.setTheme('miden');
	// 	}
	// }, []);

	// const monaco = useMonaco();

	// useEffect(() => {
	// 	if (monaco) {
	// 		configureMonaco(monaco);
	// 	}
	// }, [configureMonaco, monaco]);

	return (
		<div className="flex flex-col justify-end h-full">
			{/* {metadata && vault ? (
				<div className="flex-1 overflow-hidden text-white">
					<ScrollArea className="h-full w-full px-4">
						<Table className="[&_tr:hover]:bg-transparent">
							<TableHeader>
								<TableRow>
									<TableHead>Account ID</TableHead>
									<TableHead>Vault</TableHead>
									<TableHead>Bit Code</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								<TableRow>
									<TableCell>{metadata}</TableCell>
									<TableCell>
										<pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">
											<pre className="whitespace-nowrap overflow-auto">{vault}</pre>
										</pre>
									</TableCell>
									<TableCell>{'bitCode'}</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					</ScrollArea>
				</div>
			) : ( */}
			<div className="flex-1 p-9 text-xl text-gray-400">
				<div className="">First, select account on left</div>
				<div className="mt-16">Then add notes</div>
				<div className="mt-64">Link to docs</div>
			</div>

			<Console />
		</div>
	);
};

export default ComposeTransactionMiddlePan;
