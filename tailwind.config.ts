import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

const config: Config = {
	content: ['./src/pages/**/*.{js,ts,jsx,tsx,mdx}', './src/components/**/*.{js,ts,jsx,tsx,mdx}', './src/app/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
				'bg-gradient': 'linear-gradient(to bottom, #CAE9FF 0%, #FFFFFF 50%, #ECC76F 100%)',
			},
			transitionProperty: {
				all: 'all',
			},
			transitionTimingFunction: {
				'ease-custom': 'ease-in-out',
			},
			transitionDuration: {
				'300': '300ms',
			},
		},
	},
	plugins: [
		plugin(function ({ addUtilities }) {
			const newUtilities = {
				'.video-transition': {
					transition: 'all 300ms ease-in-out',
				},
				'.hidden': {
					opacity: '0',
					transform: 'scale(0.95)',
					pointerEvents: 'none',
				},
				'.visible': {
					opacity: '1',
					transform: 'scale(1)',
					pointerEvents: 'auto',
				},
				'.hover-scale': {
					transition: 'transform 300ms ease-in-out',
				},
			}

			addUtilities(newUtilities)
		}),
	],
}
export default config
