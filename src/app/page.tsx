import { MidenContextProvider } from '@/lib/context-providers'

export default function Home() {
	return (
		<div className="">
			<MidenContextProvider>
				<main className="">
					<p>Hello world!</p>
				</main>
			</MidenContextProvider>
		</div>
	)
}
