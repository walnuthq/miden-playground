import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { useMiden } from '@/lib/context-providers';
import {
	AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID,
	WALLET_COMPONENT_SCRIPT_FILE_ID
} from '@/lib/consts';
import ToggleSwitch from './ToggleSwitch';

const AccountCodeFile = ({
	accountFile,
	fileId,
	accountId
}: {
	accountFile: string;
	fileId: string;
	accountId: string;
}) => {
	const {
		updateFileContent,
		disableWalletComponent,
		disableAuthComponent,
		files,
		enableAuthComponent,
		enableWalletComponent,
		accounts
	} = useMiden();
	const [value, setValue] = useState('');
	const account = accounts[accountId];

	useEffect(() => {
		setValue(accountFile);
	}, [accountFile]);
	return (
		<div className="relative mx-9 mt-6 text-theme-text">
			<div className={`relative top-0`}>
				<div className="flex mb-2 justify-between">
					<div className="font-bold">Custom component</div>
				</div>
				<CustomMonacoEditor
					value={value}
					className={cn('h-44 absolute top-0 left-0')}
					onChange={(value) => {
						setValue(value ?? '');
						if (fileId) {
							updateFileContent(fileId, value ?? '');
						}
					}}
					readOnly={false}
				/>
			</div>
			<div className={`relative top-48`}>
				<div className="flex mb-2 justify-between">
					<div className="font-bold">Wallet component</div>

					<ToggleSwitch
						id="wallet-switch"
						onToggle={(isEnabled: boolean) =>
							isEnabled ? enableWalletComponent(accountId) : disableWalletComponent(accountId)
						}
					/>
				</div>
				<CustomMonacoEditor
					value={files[WALLET_COMPONENT_SCRIPT_FILE_ID].content.value}
					className={cn(
						`h-44 absolute top-0 left-0 transition-opacity ease-in-out ${
							account.isWallet ? '' : 'opacity-25'
						}`
					)}
					readOnly
				/>
			</div>
			<div className={`relative top-96`}>
				<div className="flex mb-2 justify-between">
					<div className="font-bold">Auth component</div>

					<ToggleSwitch
						id="wallet-switch"
						onToggle={(isEnabled: boolean) =>
							isEnabled ? enableAuthComponent(accountId) : disableAuthComponent(accountId)
						}
					/>
				</div>
				<CustomMonacoEditor
					value={files[AUTHENTICATION_COMPONENT_SCRIPT_FILE_ID].content.value}
					className={cn(
						`h-44 absolute top-0 left-0 transition-opacity ease-in-out ${
							account.isAuth ? '' : 'opacity-25'
						}`
					)}
					readOnly
				/>
			</div>
		</div>
	);
};

export default AccountCodeFile;
