'use client';

import React from 'react';
import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const Toolbar: React.FC = () => {
	const {
		files,
		closeFile,
		selectFile,
		selectedFileId,
		executeTransaction,
		collapsedTabs,
		isExecutingTransaction
	} = useMiden();
	const filesToDisplay = Object.keys(files)
		.filter((fileId) => files[fileId].isOpen)
		.sort((a, b) => (files[a]?.positionOrder ?? 0) - (files[b]?.positionOrder ?? 0));

	return (
		<div
			className="h-[54px] bg-dark-miden-800
							flex flex-row items-center justify-between"
		>
			<div className="h-full flex gap-4 items-end overflow-hidden">
				<div
					onClick={() => collapsedTabs()}
					className="ml-4 self-center cursor-pointer hover:bg-white/10 p-1.5 rounded-miden"
				>
					<InlineIcon variant={'left-arrow'} color="white" className={` w-6 h-6`} />
				</div>
				<ScrollArea>
					<div className="flex flex-row">
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
			</div>
			<div
				className={`mr-2 cursor-pointer ${
					isExecutingTransaction ? 'cursor-not-allowed' : 'hover:bg-white/10'
				} p-1.5 rounded-miden`}
				onClick={() => {
					if (!isExecutingTransaction) {
						executeTransaction();
					}
				}}
			>
				<InlineIcon variant="play" className={`w-7 h-7 cursor-pointer`} />
			</div>
		</div>
	);
};
