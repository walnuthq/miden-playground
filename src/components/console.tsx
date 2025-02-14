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
		<div className="h-full flex flex-col bg-theme-surface-highlight">
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
