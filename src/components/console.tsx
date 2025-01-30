'use client';

import { useMiden } from '@/lib/context-providers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export function Console() {
	const { consoleLogs } = useMiden();
	const logsEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [consoleLogs]);
	return (
		<ScrollArea className="h-[240px]  border-theme-border bg-theme-surface-highlight flex flex-col pt-11 px-4 pb-4">
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
	);
}
