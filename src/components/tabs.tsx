'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';

export const Tabs = () => {
	const { selectedTab, selectTab } = useMiden();

	return (
		<div className="flex  flex-row ">
			<div
				className={`p-3 w-[210px]  font-semibold border-x-2 border-t-2 border-theme-border rounded-tl-miden text-sm flex flex-row items-center gap-2 cursor-pointer select-none ${
					selectedTab === 'transaction'
						? 'bg-theme-surface-highlight text-theme-text'
						: 'text-theme-text-subtle'
				}`}
				onClick={() => {
					selectTab('transaction');
				}}
			>
				<InlineIcon
					variant="transaction-builder"
					className={`w-5 h-5 ${
						selectedTab === 'transaction' ? 'text-theme-primary' : 'text-theme-primary/40'
					}`}
				/>
				Compose transaction
			</div>
			<div
				className={`p-3 w-[210px] font-semibold border-r-2 border-t-2 rounded-tr-miden text-sm border-theme-border flex flex-row items-center gap-2 cursor-pointer select-none ${
					selectedTab === 'assets'
						? 'bg-theme-surface-highlight text-theme-text'
						: 'text-theme-text-subtle'
				}`}
				onClick={() => {
					selectTab('assets');
				}}
			>
				<InlineIcon
					variant="file"
					className={`w-5 h-5 ${
						selectedTab === 'assets' ? 'text-theme-primary' : 'text-theme-primary/40'
					}`}
				/>
				Editor
			</div>
		</div>
	);
};
