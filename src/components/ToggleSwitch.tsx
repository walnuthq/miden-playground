import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

interface ToggleSwitchProps {
	id: string;
	onToggle: (newState: boolean) => void;
	initialState?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, onToggle, initialState = true }) => {
	const [isEnabled, setIsEnabled] = useState<boolean>(initialState);

	const handleToggle = (checked: boolean) => {
		setIsEnabled(checked);
		onToggle(checked);
	};

	return (
		<div className="cursor-pointer p-0.5 rounded-theme">
			<Switch id={id} checked={isEnabled} onCheckedChange={handleToggle} />
		</div>
	);
};

export default ToggleSwitch;
