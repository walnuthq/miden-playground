import { Editor as MonacoEditor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { useCallback, useEffect } from 'react';
import { useMonaco } from '@monaco-editor/react';

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
	const monaco = useMonaco();

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
		<MonacoEditor
			value={value}
			onChange={onChange}
			className={className}
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
				readOnly
			}}
		/>
	);
}
