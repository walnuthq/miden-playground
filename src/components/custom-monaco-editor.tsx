'use client';
import { Editor as MonacoEditor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useCallback } from 'react';

interface CustomMonacoEditorProps {
	value: string | undefined;
	className?: string;
	onChange?: (value: string | undefined) => void;
	readOnly?: boolean;
}

export function CustomMonacoEditor({
	value,
	className,
	onChange,
	readOnly = false
}: CustomMonacoEditorProps) {
	const configureMonaco = useCallback((monaco: Monaco) => {
		if (monaco) {
			monaco.editor.defineTheme('miden', {
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
			monaco.editor.setTheme('miden');
		}
	}, []);

	return (
		<MonacoEditor
			value={value}
			onChange={onChange}
			className={className}
			onMount={(editor: editor.IStandaloneCodeEditor, monaco) => {
				configureMonaco(monaco);
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
				readOnly
			}}
		/>
	);
}
