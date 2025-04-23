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
				side: 'right'
			},
			{
				title: 'Welcome',
				content: 'Create new account',
				selector: '#step2',
				icon: '',
				side: 'bottom'
			},
			{
				title: 'Welcome',
				content: 'Select code',
				selector: '#step3',
				icon: '',
				side: 'top'
			},
			{
				title: 'Welcome',
				content: 'Explain what are components',
				selector: '.tutorial-acc',
				icon: '',
				side: 'left'
			}
			// ... more steps
		]
	}
];
