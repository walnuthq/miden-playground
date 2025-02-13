import React, { useEffect, useState } from 'react';
import { CustomMonacoEditor } from './custom-monaco-editor';
import { useMiden } from '@/lib/context-providers';
import ToggleSwitch from './ToggleSwitch';
import { ACCOUNT_AUTH_SCRIPT, ACCOUNT_WALLET_SCRIPT } from '@/lib/account';

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
		enableAuthComponent,
		enableWalletComponent,
		accounts
	} = useMiden();
	const [value, setValue] = useState('');
	const account = accounts[accountId];
	const [walletHeight, setWalletHeight] = useState(0);
	const [authHeight, setAuthHeight] = useState(0);

	useEffect(() => {
		setWalletHeight(ACCOUNT_WALLET_SCRIPT.split('\n').length * 18);
		setAuthHeight(ACCOUNT_AUTH_SCRIPT.split('\n').length * 18);
	}, []);

	useEffect(() => {
		setValue(accountFile);
	}, [accountFile]);
	return (
		<div className="relative mx-9 mt-6 text-theme-text">
			<div className="space-y-6">
				{' '}
				<div className="flex flex-col">
					<div className="flex mb-2 justify-between">
						<div className="font-bold">Custom component</div>
					</div>
					<CustomMonacoEditor
						value={value}
						className="!h-96"
						onChange={(value) => {
							setValue(value ?? '');
							if (fileId) {
								updateFileContent(fileId, value ?? '');
							}
						}}
						readOnly={false}
					/>
				</div>
				<div className="flex flex-col">
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
						value={ACCOUNT_WALLET_SCRIPT}
						style={{ height: `${walletHeight > 100 ? 100 : walletHeight}px` }}
						className={`transition-opacity ease-in-out ${account.isWallet ? '' : 'opacity-25'} 
				`}
						readOnly
					/>
				</div>
				<div className="flex flex-col">
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
						value={ACCOUNT_AUTH_SCRIPT}
						style={{ height: `${authHeight > 100 ? 100 : authHeight}px` }}
						className={` transition-opacity ease-in-out ${account.isAuth ? '' : 'opacity-25'}`}
						readOnly
					/>
				</div>
			</div>
		</div>
	);
};

export default AccountCodeFile;
