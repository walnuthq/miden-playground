'use client';

import { cn } from '@/lib/utils';
import { CustomMonacoEditor } from './custom-monaco-editor';
import InlineIcon from './ui/inline-icon';
import { useMiden } from '@/lib/context-providers';

interface EditorSection {
	title: string;
	content: string;
	isEnabled?: boolean;
	accountId?: string;
	onDelete?: (id: string) => void;
	readOnly?: boolean;
	top?: string;
	onChange?: (value: string) => void;
}

export const MultiFileEditor = ({ result }: { result }) => {
	const { updateFileContent, disableWalletComponent, disableAuthComponent } = useMiden();
	const getEditorSections = (): EditorSection[] => {
		const sections: EditorSection[] = [
			{
				title: 'Custom component',
				content: result.accountScript.content,
				onChange: (value) => {
					if (result.accountScript.file) {
						updateFileContent(result.accountScript.file.id, value);
					}
				},
				readOnly: false
			}
		];

		if (result.walletScript.account.isWallet) {
			sections.push({
				title: 'Wallet',
				content: result.walletScript.content,
				isEnabled: true,
				accountId: result.walletScript.account.idHex,
				onDelete: disableWalletComponent,
				readOnly: true
			});
		}

		if (result.authScript.account.isAuth) {
			sections.push({
				title: 'Auth component',
				content: result.authScript.content,
				isEnabled: true,
				accountId: result.authScript.account.idHex,
				onDelete: disableAuthComponent,
				readOnly: true
			});
		}

		return sections;
	};

	const getTopPosition = (index: number): string => {
		if (index === 0) return '0';
		if (index === 1) return 'top-48';
		return 'top-96';
	};

	return (
		<div className="relative mx-9 mt-6 text-theme-text">
			{getEditorSections().map((section, index) => (
				<div key={section.title} className={`relative ${index > 0 ? getTopPosition(index) : ''}`}>
					<div className="flex mb-2 justify-between">
						<div className="font-bold">{section.title}</div>
						{section.onDelete && section.accountId && (
							<div
								className="cursor-pointer hover:bg-white/10 p-0.5 rounded-theme"
								onClick={(event) => {
									event.stopPropagation();
									section.onDelete?.(section.accountId!);
								}}
							>
								<InlineIcon variant={'trash'} color="white" className="w-4 h-4 opacity-80" />
							</div>
						)}
					</div>
					<CustomMonacoEditor
						readOnly={section.readOnly}
						value={section.content}
						onChange={section.onChange}
						className={cn('h-44 absolute top-0 left-0')}
					/>
				</div>
			))}
		</div>
	);
};
