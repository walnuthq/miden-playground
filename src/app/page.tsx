import { CustomCard } from '@/components/custom-card';
import { Playground } from '@/components/playground';
import { MidenContextProvider } from '@/lib/context-providers/miden-context-provider';
import { steps } from '@/lib/tour-steps';
import { NextStepProvider, NextStep } from 'nextstepjs';

export const runtime = 'edge';

export default function Home() {
	return (
		<NextStepProvider>
			<NextStep
				steps={steps}
				cardComponent={CustomCard}
				shadowRgb="0, 0, 0" // Default is "0, 0, 0" (black)
				shadowOpacity="0.4"
			>
				<MidenContextProvider>
					<Playground />
				</MidenContextProvider>
			</NextStep>
		</NextStepProvider>
	);
}
