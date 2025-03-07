import type { Config } from 'tailwindcss';

export default {
	darkMode: ['class'],
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}'
	],
	theme: {
		extend: {
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				dark: {
					miden: {
						'950': 'var(--miden-dark-950)',
						'700': 'var(--miden-dark-700)',
						'800': 'var(--miden-dark-800)'
					}
				},
				blue: { miden: 'var(--miden-blue)' },
				theme: {
					surface: 'hsl(var(--theme-surface))',
					border: 'hsl(var(--theme-border))',
					'surface-highlight': 'hsl(var(--theme-surface-highlight))',
					text: 'hsl(var(--theme-text))',
					'text-subtle': 'hsl(var(--theme-text-subtle))',
					'text-subtlest': 'hsl(var(--theme-text-subtlest))',
					primary: 'hsl(var(--theme-primary))',
					'primary-hover': 'hsl(var(--theme-primary-hover))',
					secondary: 'hsl(var(--theme-secondary))',
					info: 'hsl(var(--theme-info))',
					success: 'hsl(var(--theme-success))',
					notice: 'hsl(var(--theme-notice))',
					warning: 'hsl(var(--theme-warning))',
					danger: 'hsl(var(--theme-danger))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				miden: 'var(--rounded-miden)',
				theme: 'var(--theme-radius)'
			}
		}
	},
	plugins: [require('tailwindcss-animate')]
} satisfies Config;
