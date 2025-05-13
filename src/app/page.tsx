import { CustomCard } from '@/components/custom-card';
import { Playground } from '@/components/playground';
import { AccountsContextProvider, NotesContextProvider } from '@/lib/context-providers';
import { FilesContextProvider } from '@/lib/context-providers/files-context-provider';
import { MidenContextProvider } from '@/lib/context-providers/miden-context-provider';
import { steps } from '@/lib/tour-steps';
import { NextStepProvider, NextStep } from 'nextstepjs';

export const runtime = 'edge';

export default function Home() {
	return (
		<NextStepProvider>
			<FilesContextProvider>
				<AccountsContextProvider>
					<NotesContextProvider>
						<MidenContextProvider>
							<NextStep
								steps={steps}
								cardComponent={CustomCard}
								shadowRgb="0, 0, 0" // Default is "0, 0, 0" (black)
								shadowOpacity="0.65"
							>
								<Playground />
							</NextStep>
						</MidenContextProvider>
					</NotesContextProvider>
				</AccountsContextProvider>
			</FilesContextProvider>
		</NextStepProvider>
	);
}
