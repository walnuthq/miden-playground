import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { NextStep, NextStepProvider } from 'nextstepjs';
import {
	AccountsContextProvider,
	FilesContextProvider,
	MidenContextProvider,
	NotesContextProvider
} from '@/lib/context-providers';
import { steps } from '@/lib/tour-steps';
import { CustomCard } from '@/components/custom-card';

export const metadata: Metadata = {
	title: 'Miden Playground',
	description: 'Miden Playground'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className="antialiased">
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
										{children}
										<Toaster />
									</NextStep>
								</MidenContextProvider>
							</NotesContextProvider>
						</AccountsContextProvider>
					</FilesContextProvider>
				</NextStepProvider>
			</body>
		</html>
	);
}
