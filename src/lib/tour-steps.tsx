import { Tour } from 'nextstepjs';

export const steps: Tour[] = [
	{
		tour: 'mainTour',
		steps: [
			{
				title: 'Welcome',
				content: 'Select Editor to create an account',
				selector: '#step1',
				icon: '',
				side: 'bottom',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'New account',
				content: 'Create new account',
				selector: '.step2',
				icon: '',
				side: 'bottom',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Code',
				content: 'Accounts are smart contracts with a code interface',
				selector: '#step3',
				icon: '',
				side: 'top',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Code components',
				content: 'Pull in standard components (like wallet or authentication) or build your own',
				selector: '.step4',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Add or remove code components with this switch',
				content: '',
				selector: '#auth-switch',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Go to Info',
				content: '',
				selector: '#step19',
				icon: '',
				side: 'left',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Info',
				content:
					'Inspect and define basic account data, add and remove assets, and modify initial storage',
				selector: '.account-code-step',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Create second account',
				content: 'Create second account',
				selector: '.step2',
				icon: '',
				side: 'bottom',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Compose transaction tab',
				content: 'Select compose transaction',
				selector: '#step5',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Select new account',
				content: '',
				selector: '.step6',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Create new P2ID note',
				content:
					'Miden offers different standard notes, pay-to-ids, and a token swap. Users can also build custom notes.',
				selector: '.step7',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Note script',
				content:
					'Note scripts define spend conditions. The executing account must process the script at execution.',
				selector: '.step8',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Note info',
				content: 'Users can define inputs for the note script and add assets to the notes',
				selector: '.step8',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Get Account ID',
				content: 'Copy account ID of the created account',
				selector: '#account-info',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Note Inputs',
				content:
					'The P2ID note script requires the account ID of the executing account as input (pay-to-ID). Save it here',
				selector: '#note-inputs',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Compose transaction tab',
				content: 'Select Compose Transaction',
				selector: '#step5',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Add note',
				content: 'Add the note that the account consumes in the transaction',
				selector: '#step10',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Select note',
				content:
					'Select the right note. For P2IDs the note inputs and the consuming account ID must match',
				selector: '.step11',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Transaction script',
				content: 'Optional scripts to be executed at the end of a transaction',
				selector: '#step12',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Edit transaction script',
				content:
					"The default transaction script signs the transaction and increases the account's nonce",
				selector: '.step8',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Compose transaction',
				content: 'Almost done',
				selector: '#step5',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Execute transaction',
				content: 'Now, having defined the initial account and note state, execute.',
				selector: '#step15',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Transaction result',
				content: 'Inspect the changes in the account',
				selector: '#step16',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Editor tab',
				content: 'Go to the editor',
				selector: '#step1',
				icon: '',
				side: 'left',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Consumed note',
				content: (
					<>
						All notes can only be consumed once (see{' '}
						<a
							className="text-theme-primary"
							href="https://0xmiden.github.io/miden-docs/imported/miden-base/src/note.html#note-nullifier-ensuring-private-consumption"
						>
							Nullifiers
						</a>
						)
					</>
				),
				selector: '.step18',
				icon: '',
				side: 'left',

				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			}
			// ... more steps
		]
	}
];
