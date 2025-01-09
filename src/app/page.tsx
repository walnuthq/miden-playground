import { Playground } from '@/components/playground';
import { MidenContextProvider } from '@/lib/context-providers/miden-context-provider';

export const runtime = 'edge';

export default function Home() {
	return (
		<MidenContextProvider>
			<Playground />
		</MidenContextProvider>
	);
}
