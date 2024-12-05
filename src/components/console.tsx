'use client';

import { useMiden } from '@/lib/context-providers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function Console() {
	const { consoleLogs } = useMiden();

	return (
		<ScrollArea className="h-[240px] bg-neutral-50 flex flex-col pt-11 px-4 pb-4">
			<div className="absolute top-4 left-4 text-neutral-400 uppercase text-[13px] font-semibold leading-6">
				Console
			</div>
			{consoleLogs.map((log, index) => (
				<span
					key={index}
					className={cn('font-mono text-sm', log.type === 'error' ? 'text-red-500' : '')}
				>
					{log.message}
					<br />
				</span>
			))}
		</ScrollArea>
	);
}
