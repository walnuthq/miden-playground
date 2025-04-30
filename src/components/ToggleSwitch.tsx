import { Switch } from '@/components/ui/switch';

interface ToggleSwitchProps {
	id: string;
	onToggle: (newState: boolean) => void;
	checked: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, onToggle, checked }) => {
	const handleToggle = (checked: boolean) => {
		onToggle(checked);
	};

	return (
		<div className="cursor-pointer p-0.5 rounded-theme">
			<Switch id={id} checked={checked} onCheckedChange={handleToggle} />
		</div>
	);
};

export default ToggleSwitch;
