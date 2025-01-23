'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';

export const Tabs = () => {
	const { selectedTab, selectTab } = useMiden();

	return (
		<div className="flex  flex-row ">
			<div
				className={`text-white border-x-2 border-t-2 border-dark-miden-700 rounded-tl-miden text-sm px-4 py-4 flex flex-row items-center gap-2 cursor-pointer select-none ${
					selectedTab === 'transaction' ? 'bg-[#040113]' : ''
				}`}
				onClick={() => {
					selectTab('transaction');
				}}
			>
				<InlineIcon
					variant="transaction-builder"
					color={selectedTab === 'transaction' ? '#9748FF' : '#FFFDFD'}
					className={`w-5 h-5`}
				/>
				Compose transaction
			</div>
			<div
				className={`text-white border-r-2 border-t-2 rounded-tr-miden text-sm px-4 py-4 border-dark-miden-700 flex flex-row items-center gap-2 cursor-pointer select-none ${
					selectedTab === 'assets' ? 'bg-[#040113]' : ''
				}`}
				onClick={() => selectTab('assets')}
			>
				<InlineIcon
					variant="file"
					color={selectedTab === 'assets' ? '#9748FF' : '#FFFDFD'}
					className={`w-5 h-5`}
				/>
				Assets Explorer
			</div>
		</div>
	);
};
