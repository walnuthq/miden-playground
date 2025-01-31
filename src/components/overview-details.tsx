import React, { ReactNode } from 'react';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ValueWithCopy {
	value: ReactNode;
	copyable?: boolean;
	label?: string;
	divider?: boolean;
}

interface OverviewLayoutProps {
	data: Record<string, ReactNode | ValueWithCopy>;
}

const OverviewLayout = ({ data }: OverviewLayoutProps) => {
	const entries = Object.entries(data);
	const { toast } = useToast();

	const handleCopy = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast({
			title: `${label} has been copied`,
			variant: 'default'
		});
	};

	const renderValue = (value: ReactNode | ValueWithCopy, label: string) => {
		if (value && typeof value === 'object' && 'value' in value) {
			return (
				<div className="flex items-center gap-2">
					<div>{value.value}</div>
					{value.copyable && typeof value.value !== 'object' && (
						<button
							onClick={() => handleCopy(String(value.value), label)}
							className="p-1 hover:bg-theme-surface-highlight rounded transition-colors"
						>
							<Copy className="w-4 h-4 text-theme-secondary" />
						</button>
					)}
				</div>
			);
		}

		return <div className="w-full">{value}</div>;
	};

	return (
		<div className="w-full p-6">
			{entries.map(([label, value]) => {
				const hasDivider =
					value && typeof value === 'object' && 'divider' in value && value.divider;

				return (
					<div key={label} className={`${hasDivider ? 'border-b border-theme-border mb-4' : ''}`}>
						<div className="flex items-start gap-24 mb-4">
							<div className="text-theme-text-subtle min-w-[120px]">{label}:</div>
							{renderValue(value, label)}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default OverviewLayout;
