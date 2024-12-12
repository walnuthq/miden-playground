'use client';

import { useState } from 'react';
import { AccountScript } from './script';
import { AccountState } from './state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select';
import { useMiden } from '@/lib/context-providers';

export function Account() {
	const [tabValue, setTabValue] = useState<'state' | 'script'>('state');
	const { accounts, selectAccount, selectedAccount } = useMiden();

	return (
		<div className="h-full flex flex-col">
			<div className="flex flex-row justify-between p-2">
				<Select onValueChange={selectAccount} value={selectedAccount.id}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select Account" />
					</SelectTrigger>
					<SelectContent>
						{accounts
							.filter((account) => !account.isHidden)
							.map((account) => (
								<SelectItem key={account.id} value={account.id}>
									{account.name}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
				<Tabs value={tabValue} onValueChange={(value) => setTabValue(value as 'state' | 'script')}>
					<TabsList>
						<TabsTrigger value="state">State Viewer</TabsTrigger>
						<TabsTrigger value="script">Script Editor</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
			{tabValue === 'state' ? <AccountState /> : <AccountScript />}
		</div>
	);
}
