import { Playground } from '@/components/playground';
import { FilesContextProvider } from '@/lib/context-providers/files-context-provider';
import { MidenContextProvider } from '@/lib/context-providers/miden-context-provider';

export const runtime = 'edge';

export default function Home() {
	return (
		<FilesContextProvider>
			<MidenContextProvider>
				<Playground />
			</MidenContextProvider>
		</FilesContextProvider>
	);
}
