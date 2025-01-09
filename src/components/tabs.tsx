'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';

export const Tabs = () => {
	const { selectedTab, selectTab } = useMiden();

	return (
		<div className="border-r-2 border-dark-miden-700 w-[44px]">
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 flex items-center justify-center cursor-pointer hover:bg-white/10"
				onClick={() => selectTab('transaction')}
			>
				<InlineIcon
					variant="transaction-builder"
					color={selectedTab === 'transaction' ? '#9748FF' : '#FFFDFD'}
					className={`w-5 h-5`}
				/>
			</div>
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 flex items-center justify-center cursor-pointer hover:bg-white/10"
				onClick={() => selectTab('accounts')}
			>
				<InlineIcon
					variant="user-square"
					color={selectedTab === 'accounts' ? '#9748FF' : '#FFFDFD'}
					className={`w-5 h-5`}
				/>
			</div>
			<div
				className="h-[54px] border-b-2 border-dark-miden-700 flex items-center justify-center cursor-pointer hover:bg-white/10"
				onClick={() => selectTab('notes')}
			>
				<InlineIcon
					variant="file"
					color={selectedTab === 'notes' ? '#9748FF' : '#FFFDFD'}
					className={`w-5 h-5`}
				/>
			</div>
		</div>
	);
};
