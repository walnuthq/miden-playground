'use client';

import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const Toolbar = () => {
	const { files, closeFile, selectFile, selectedFileId, selectedTab } = useMiden();
	const filesToDisplay = Object.keys(files)
		.filter((fileId) => files[fileId].isOpen)
		.sort((a, b) => (files[a]?.positionOrder ?? 0) - (files[b]?.positionOrder ?? 0));

	return (
		<div
			className="h-[36px] bg-theme-surface-highlight
							flex flex-row items-end justify-between"
		>
			{selectedTab !== 'transaction' ? (
				<ScrollArea>
					<div className="flex flex-row">
						{filesToDisplay.map((fileId) => (
							<div
								key={fileId}
								className={`text-theme-text text-sm px-3 py-2 first:border-l-0 border-l-[1.5px] border-t-[1.5px]   border-theme-border flex flex-row items-center gap-2 cursor-pointer select-none ${
									selectedFileId === fileId ? 'bg-[#040113]' : ''
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
									className="cursor-pointer hover:bg-theme-border p-1 rounded-theme"
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
			) : (
				<></>
			)}
			<div className="h-full flex gap-4 items-end overflow-hidden">
				{/* <div
					onClick={() => {
						toggleInspector();
						collapseTabs();
					}}
					className="ml-4 self-center cursor-pointer hover:bg-theme-border p-1.5 rounded-theme"
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
