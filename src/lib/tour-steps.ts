import { Tour } from 'nextstepjs';

export const steps: Tour[] = [
	{
		tour: 'mainTour',
		steps: [
			{
				title: 'Welcome',
				content: 'Select the editor, explain why we need it',
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
				title: 'Code component',
				content: 'Select code',
				selector: '#step3',
				icon: '',
				side: 'top',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Code component',
				content: 'Explain what are components',
				selector: '.step4',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Compose transaction tab',
				content: 'Select Compose transaction',
				selector: '#step5',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Select created account',
				content: 'Select Account C',
				selector: '.step6',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Create new P2ID note',
				content: 'Explain different kinds of notes',
				selector: '.step7',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Note script',
				content: 'Explain what is note script',
				selector: '.step8',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Select Compose Transaction',
				content: 'Select Compose Transaction',
				selector: '#step5',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Add note',
				content: 'Add note',
				selector: '#step10',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Add note',
				content: 'Select note',
				selector: '.step11',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Transaction script',
				content: 'Edit transaction script',
				selector: '#step12',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Transaction script',
				content: 'Explain what is transaction script',
				selector: '.step8',
				icon: '',
				side: 'left',
				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Compose transaction',
				content: 'Go back to the Compose transaction',
				selector: '#step5',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Execute transaction',
				content: 'Execute transaction',
				selector: '#step15',
				icon: '',
				side: 'right',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Transaction output',
				content: 'Explain transaction output',
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
				content: 'Explain that note can be consumed once',
				selector: '.step18',
				icon: '',
				side: 'left',

				showControls: true,
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},
			{
				title: 'Updated account’s vault',
				content: 'Open updated account’s vault',
				selector: '#step19',
				icon: '',
				side: 'left',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			},

			{
				title: 'Updated account’s vault',
				content:
					'Check updated account vault (it will appear here after merging the corresponding pr)',
				selector: '.step8',
				showControls: true,
				icon: '',
				side: 'left',
				pointerPadding: 0, // Padding around the target element (in pixels)
				pointerRadius: 0
			}
			// ... more steps
		]
	}
];
