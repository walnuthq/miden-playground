'use client';

import { ACCOUNT_AUTH_SCRIPT, ACCOUNT_WALLET_SCRIPT } from '@/lib/consts';
import { useMiden } from '@/lib/context-providers';
import { cn } from '@/lib/utils';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { Checkbox } from '@/components/ui/checkbox';

export function AccountScript() {
	const { selectedAccount, setAccountScript, toggleAuthComponent, toggleWalletComponent } =
		useMiden();

	return (
		<div className="h-full border-t border-neutral-200 overflow-hidden relative flex flex-col">
			<ReadOnlyCode
				code={ACCOUNT_WALLET_SCRIPT}
				label="Wallet script"
				switchValue={selectedAccount.isWallet}
				toggle={toggleWalletComponent}
			/>
			<ReadOnlyCode
				code={ACCOUNT_AUTH_SCRIPT}
				label="Auth script"
				switchValue={selectedAccount.isAuth}
				toggle={toggleAuthComponent}
			/>
			<div className="text-xs pl-9 flex flex-row items-center gap-3 bg-neutral-100 py-1 border-b border-neutral-200 mb-1">
				<span className="font-medium">Account script</span>
			</div>
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
					}
				}}
				value={selectedAccount.script}
				className={cn(
					'whitespace-pre-wrap overflow-hidden p-0 m-0 w-full h-full absolute top-0 left-0'
				)}
				onChange={(value) => {
					setAccountScript(value ?? '');
				}}
			/>
		</div>
	);
}

function ReadOnlyCode({
	code,
	label,
	switchValue,
	toggle
}: {
	code: string;
	label: string;
	switchValue: boolean;
	toggle: () => void;
}) {
	return (
		<div className="w-full bg-white border-b border-neutral-200 relative pb-6">
			<label className="text-xs px-2 flex flex-row items-center gap-3 bg-neutral-100 py-1 border-b border-neutral-200 cursor-pointer select-none">
				<Checkbox checked={switchValue} onCheckedChange={toggle} />
				<span className="font-medium">{label}</span>
			</label>
			<div
				className={cn(
					'whitespace-pre-wrap text-[12px] font-mono leading-[18px] pl-[62px] mt-1',
					!switchValue ? 'opacity-40' : ''
				)}
			>
				{code}
			</div>
		</div>
	);
}
