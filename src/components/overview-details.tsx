import React, { ReactNode } from 'react';

interface OverviewLayoutProps {
	data: Record<string, ReactNode>;
}

const OverviewLayout = ({ data }: OverviewLayoutProps) => {
	const entries = Object.entries(data);

	return (
		<div className="flex gap-52 mt-1">
			<div className="flex flex-col gap-4">
				{entries.map(([label]) => (
					<div key={label} className="text-gray-400">
						{label}:
					</div>
				))}
			</div>
			<div className="flex flex-col gap-4">
				{entries.map(([label, value]) => (
					<div key={label}>{value}</div>
				))}
			</div>
		</div>
	);
};

export default OverviewLayout;
