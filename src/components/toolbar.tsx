'use client';

import React from 'react';
import InlineIcon from '@/components/ui/inline-icon';
import { useMiden } from '@/lib/context-providers';

export const Toolbar: React.FC = () => {
	const { runTransaction } = useMiden();

	return (
		<div
			className="h-[54px] border-b-2 border-dark-miden-700 bg-dark-miden-800
							flex flex-row items-center justify-between px-3"
		>
			<div></div>
			<div>
				<InlineIcon variant="play" className={`w-7 h-7 cursor-pointer`} onClick={runTransaction} />
			</div>
		</div>
	);
};
