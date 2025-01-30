'use client';

import { useMiden } from '@/lib/context-providers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';

export function Console() {
	const { consoleLogs, executeTransaction } = useMiden();
	const logsEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [consoleLogs]);
	return (
		<>
			<div className="flex flex-row p-1 border-b-2 border-theme-border">
				<input
					type="text"
					placeholder="Block number"
					className="flex-1 bg-transparent outline-none placeholder:text-theme-text-subtlest px-2 text-theme-text"
				/>
				<Button variant="secondary" onClick={() => executeTransaction()}>
					Execute
				</Button>
			</div>
			<div className="flex-1">
				<ScrollArea className="border-dark-miden-700 bg-dark-miden-800 flex flex-col pt-11 px-4 pb-4 w-full h-full">
					<div className="absolute top-4 left-4 text-neutral-400 uppercase text-[13px] font-semibold leading-6">
						Console
					</div>
					{consoleLogs.map((log, index) => (
						<span
							key={index}
							className={cn(
								'font-mono text-sm',
								log.type === 'error' ? 'text-red-500' : 'text-neutral-400'
							)}
						>
							{log.message}
							<br />
						</span>
					))}
					<div ref={logsEndRef} />
				</ScrollArea>
			</div>
		</>
	);
}
