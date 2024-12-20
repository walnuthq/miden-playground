'use client';

import React, { useState } from 'react';
import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { Note, Transaction } from '@/lib/types';

export const TransactionBuilder: React.FC = () => {
	const { transactions, createTransaction } = useMiden();

	return (
		<div className="flex flex-col">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
							text-white text-lg font-medium flex items-center px-3 gap-2"
			>
				<InlineIcon
					variant="plus-square"
					className="w-6 h-6 cursor-pointer"
					onClick={createTransaction}
				/>
				<span>Transaction builder</span>
			</div>
			<div className="flex flex-col">
				{Object.values(transactions).map((transaction) => (
					<TransactionItem key={transaction.id} transaction={transaction} />
				))}
			</div>
		</div>
	);
};

function TransactionItem({ transaction }: { transaction: Transaction }) {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const { selectTransaction, selectedTransactionId } = useMiden();

	return (
		<>
			<ListItem
				name={transaction.name}
				isSelected={selectedTransactionId === transaction.id}
				isCollapsed={isCollapsed}
				switchCollapsed={() => setIsCollapsed(!isCollapsed)}
				onClick={() => selectTransaction(transaction.id)}
			/>
			{!isCollapsed && (
				<>
					{transaction.accounts.map((account) => (
						<ListItem key={account.id} name={account.name} level={1} />
					))}
					{transaction.notes.map((note) => (
						<NoteItem key={note.id} note={note} />
					))}
					<ListItem name="Arguments" level={1} />
				</>
			)}
		</>
	);
}

function NoteItem({ note }: { note: Note }) {
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<>
			<ListItem name={note.name} level={1} switchCollapsed={() => setIsCollapsed(!isCollapsed)} />
			{!isCollapsed && (
				<>
					<ListItem name="Script" level={2} />
					<ListItem name="Inputs" level={2} />
				</>
			)}
		</>
	);
}

function ListItem({
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
    ${isSelected ? 'bg-dark-miden-800' : ''}
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
