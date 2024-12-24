'use client';

import { useMiden } from '@/lib/context-providers';
import { TransactionBuilder } from './transaction-builder';
import { Accounts } from './accounts';
import { Notes } from './notes';
import InlineIcon from '@/components/ui/inline-icon';

export function Inspector() {
	const { selectedTab, selectedAccountId, accounts } = useMiden();
	const tabName =
		selectedTab === 'transaction'
			? 'Compose transaction'
			: selectedTab === 'accounts'
			? accounts[selectedAccountId].name
			: selectedTab === 'notes'
			? 'Note'
			: selectedTab === 'transaction-arguments'
			? 'Transaction arguments'
			: '';

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
					text-white font-medium flex items-center px-3"
			>
				{tabName}
			</div>
			{selectedTab === 'transaction' && <TransactionBuilder />}
			{selectedTab === 'accounts' && <Accounts />}
			{selectedTab === 'notes' && <Notes />}
		</div>
	);
}

export function ListItem({
	name,
	isSelected,
	isCollapsed,
	level,
	switchCollapsed,
	onClick
}: {
	name: string;
	isSelected?: boolean;
	isCollapsed?: boolean;
	level?: number;
	switchCollapsed?: () => void;
	onClick?: () => void;
}) {
	return (
		<div
			className={`border-b-2 border-dark-miden-700 h-[54px] flex flex-row items-center gap-2 text-white select-none cursor-pointer
    ${isSelected ? 'bg-dark-miden-800' : 'hover:bg-white/5'}
    `}
			style={{ paddingLeft: `${(level ?? 0) * 20 + 24 + (switchCollapsed ? 0 : 20)}px` }}
			onClick={onClick}
		>
			{switchCollapsed && (
				<InlineIcon
					variant="arrow"
					className={`w-3 h-3 cursor-pointer ${!isCollapsed ? 'rotate-90' : ''}`}
					onClick={switchCollapsed}
				/>
			)}
			<span>{name}</span>
		</div>
	);
}
