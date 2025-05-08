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
		<div className={`relative text-theme-text ${'step4'}`}>
			<div className="">
				{' '}
				<div className="flex flex-col">
					<div className="flex justify-between px-4 p-1">
						<div className="text-sm">CUSTOM COMPONENT</div>
					</div>

					<CustomMonacoEditor
						value={value}
						style={{ height: '18rem' }}
						// className="!h-96"
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
					<div className="flex justify-between px-4 pt-4 border-t border-theme-border">
						<div className="text-sm ">WALLET COMPONENT</div>
						<ToggleSwitch
							checked={account.isWallet}
							id="wallet-switch"
							onToggle={(isEnabled: boolean) =>
								isEnabled ? enableWalletComponent(accountId) : disableWalletComponent(accountId)
							}
						/>
					</div>
					<CustomMonacoEditor
						value={ACCOUNT_WALLET_SCRIPT}
						style={{ height: `${walletHeight > 100 ? 200 : walletHeight}px` }}
						className={`transition-opacity ease-in-out ${account.isWallet ? '' : 'opacity-25'} 
				`}
						readOnly
					/>
				</div>
				<div className="flex flex-col">
					<div className="flex justify-between  px-4 pt-4 border-t border-theme-border">
						<div className="text-sm">AUTH COMPONENT</div>
						<ToggleSwitch
							checked={account.isAuth}
							id="auth-switch"
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
