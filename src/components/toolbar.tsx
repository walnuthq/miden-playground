'use client';

import React from 'react';
import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export const Toolbar: React.FC = () => {
	const { files, closeFile, selectFile, selectedFileId, executeTransaction } = useMiden();

	return (
		<div
			className="h-[54px] bg-dark-miden-800
							flex flex-row items-center justify-between"
		>
			<div className="h-full flex flex-col justify-end overflow-hidden">
				<ScrollArea>
					<div className="flex flex-row gap-2">
						{Object.keys(files)
							.filter((fileId) => files[fileId].isOpen)
							.map((fileId) => (
								<div
									key={fileId}
									className={`text-white px-3 py-2 rounded-t-miden flex flex-row items-center gap-2 cursor-pointer ${
										selectedFileId === fileId ? 'bg-dark-miden-950' : ''
									}`}
									onClick={() => {
										selectFile(fileId);
									}}
								>
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
			<div className="px-3">
				<InlineIcon
					variant="play"
					className={`w-7 h-7 cursor-pointer`}
					onClick={() => {
						executeTransaction();
					}}
				/>
			</div>
		</div>
	);
};
