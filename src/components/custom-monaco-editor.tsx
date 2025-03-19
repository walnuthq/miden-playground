'use client';
import { cn } from '@/lib/utils';
import { Editor as MonacoEditor, Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { CSSProperties, useCallback, useState } from 'react';
import InlineIcon from './ui/inline-icon';
import Breadcrumbs from './breadcrumbs';

interface CustomMonacoEditorProps {
	value: string | undefined;
	className?: string;
	onChange?: (value: string | undefined) => void;
	readOnly?: boolean;
	style?: CSSProperties | undefined;
	lang?: string;
}

export function CustomMonacoEditor({
	value,
	className,
	onChange,
	lang,
	style,
	readOnly = false
}: CustomMonacoEditorProps) {
	const [isFullScreen, setFullScreen] = useState(false);
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

	const fullScreenStyle: CSSProperties = isFullScreen
		? {
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: '100vw',
				height: '100vh',
				zIndex: 1000,
				paddingTop: '4px'
		  }
		: { ...style };

	return (
		<div
			className={cn(className, 'h-full relative bg-[#040113]', `${isFullScreen && '!opacity-100'}`)}
			style={isFullScreen ? fullScreenStyle : style}
		>
			{isFullScreen && (
				<div className="mb-4">
					<Breadcrumbs />
				</div>
			)}
			<button
				onClick={() => setFullScreen(!isFullScreen)}
				className="absolute top-2 right-2 z-10 w-6 h-6 bg-theme-border flex justify-center opacity-60 items-center text-white rounded hover:opacity-100 transition-all focus:outline-none"
				title={isFullScreen ? 'Close full screen' : 'Full screen'}
			>
				{isFullScreen ? (
					<InlineIcon variant="arrows-pointing-in" color="white" />
				) : (
					<InlineIcon variant="arrows-pointing-out" color="white" />
				)}
			</button>
			<MonacoEditor
				value={value}
				language={lang}
				onChange={onChange}
				height="100%"
				width="100%"
				onMount={(editor: editor.IStandaloneCodeEditor, monaco) => {
					configureMonaco(monaco);
					setTimeout(() => editor.layout(), 0);
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
