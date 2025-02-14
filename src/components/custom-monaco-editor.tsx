'use client';
import { cn } from '@/lib/utils';
import { Editor as MonacoEditor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { CSSProperties, useCallback } from 'react';

interface CustomMonacoEditorProps {
	value: string | undefined;
	className?: string;
	onChange?: (value: string | undefined) => void;
	readOnly?: boolean;
	style?: CSSProperties | undefined;
}

export function CustomMonacoEditor({
	value,
	className,
	onChange,
	style,
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
		<div className={cn(className, 'h-full')} style={style}>
			<MonacoEditor
				value={value}
				onChange={onChange}
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
		</div>
	);
}
