'use client';

import { useMiden } from '@/lib/context-providers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

export function Console() {
	const { consoleLogs, executeTransaction, blockNumber, setBlockNumber } = useMiden();
	const logsEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [consoleLogs]);

	const [_blockNumber, _setBlockNumber] = useState(blockNumber.toString());

	return (
		<div className="h-full flex flex-col border-2 border-theme-border rounded-theme bg-theme-surface-highlight">
			<div className="flex flex-row border-b-2 border-theme-border h-10 items-center">
				<span className="text-theme-text-subtle pl-4">Block number:</span>
				<input
					type="text"
					placeholder="1"
					className="flex-1 bg-transparent outline-none text-theme-text placeholder:text-theme-text-subtlest px-4 py-2"
					value={_blockNumber}
					onChange={(e) => {
						_setBlockNumber(e.target.value);
						const valueInt = Number(e.target.value);
						setBlockNumber(Math.max(valueInt, 1));
					}}
				/>
				<button
					className="h-full px-4 flex flex-row gap-1 items-center justify-center text-theme-text-subtle cursor-pointer hover:text-theme-text"
					onClick={() => {
						executeTransaction();
					}}
				>
					<span>Execute</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						height="24px"
						viewBox="0 -960 960 960"
						width="24px"
						fill="currentColor"
						className="size-5"
					>
						<path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
					</svg>
				</button>
			</div>
			<ScrollArea className="relative">
				<div className="absolute px-4 pt-4 pb-1 top-0 left-0 text-theme-text uppercase text-[13px] font-semibold leading-6 bg-theme-surface-highlight w-full">
					Console
				</div>
				<div className="flex flex-col pt-11 px-4 pb-4">
					{consoleLogs.map((log, index) => (
						<span
							key={index}
							className={cn(
								'font-mono text-sm',
								log.type === 'error' ? 'text-theme-danger' : 'text-theme-secondary'
							)}
						>
							{log.message}
							<br />
						</span>
					))}
					<div ref={logsEndRef} />
				</div>
			</ScrollArea>
		</div>
	);
}
