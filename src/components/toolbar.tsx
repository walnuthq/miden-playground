'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Toolbar = ({ toggleInspector }: { toggleInspector: () => void }) => {
	const { files, closeFile, selectFile, selectedFileId, selectedTab, selectedOverview } =
		useMiden();
	const filesToDisplay = Object.keys(files)
		.filter((fileId) => files[fileId].isOpen)
		.sort((a, b) => (files[a]?.positionOrder ?? 0) - (files[b]?.positionOrder ?? 0));

	return (
		<div
			className="h-[54px] bg-dark-miden-800
							flex flex-row items-end justify-between"
		>
			{selectedTab !== 'transaction' ? (
				<ScrollArea>
					<div className="flex flex-row px-2">
						{filesToDisplay.map((fileId, index) => (
							<div
								key={fileId}
								className={`text-white text-sm px-3 py-2 border-l-[1.5px] border-t-[1.5px] last:border-r-[1.5px]  border-dark-miden-700 flex flex-row items-center gap-2 cursor-pointer select-none ${
									selectedFileId === fileId ? 'bg-[#040113]' : ''
								} ${index === 0 ? 'rounded-tl-miden' : ''} ${
									index === filesToDisplay.length - 1 ? 'rounded-tr-miden' : ''
								}`}
								onClick={() => selectFile(fileId)}
								onAuxClick={(event) => {
									if (event.button === 1) {
										// middle mouse button
										event.preventDefault();
										closeFile(fileId);
									}
								}}
							>
								<InlineIcon
									variant={files[fileId].readonly ? 'lock' : 'unlock'}
									className={`w-4 h-4`}
								/>
								<span className="text-nowrap">{files[fileId].name}</span>
								<div
									className="cursor-pointer hover:bg-white/10 p-1.5 rounded-miden"
									onClick={(event) => {
										event.stopPropagation();
										closeFile(fileId);
									}}
								>
									<InlineIcon variant="x" className="w-3 h-3" />
								</div>
							</div>
						))}
					</div>
					<ScrollBar orientation="horizontal" className="h-1 p-0" />
				</ScrollArea>
			) : selectedOverview === 'account' ? (
				<div className="text-white px-3 flex self-center">Account overview</div>
			) : selectedOverview === 'transaction-script' ? (
				<div className="text-white px-3 flex self-center">Transaction script</div>
			) : (
				selectedOverview && <div className="text-white px-3 flex self-center">Note overview</div>
			)}
			<div className="h-full flex gap-4 items-end overflow-hidden">
				{/* <div
					onClick={() => {
						toggleInspector();
						collapseTabs();
					}}
					className="ml-4 self-center cursor-pointer hover:bg-white/10 p-1.5 rounded-miden"
				>
					<InlineIcon
						variant={'left-arrow'}
						color="white"
						className={`${isCollapsedTabs ? 'rotate-180' : 'rotate-0'} w-6 h-6`}
					/>
				</div> */}
			</div>
		</div>
	);
};
