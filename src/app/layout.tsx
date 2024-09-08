import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: '#ToComAssis13',
	description: 'Mostre o seu apoio a Assis',
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-br">
			<head>
				<meta name="theme-color" content="#000000" />
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
				<meta name="apple-mobile-web-app-title" content="#ToComAssis13" />
				<meta name="mobile-web-app-capable" content="yes" />
				<link rel="icon" type="image/png" sizes="192x192" href="/assets/icons/icon-192x192.png" />
				<link rel="icon" type="image/png" sizes="512x512" href="/assets/icons/icon-512x512.png" />
				<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/icon-192x192.png" />
				<link rel="apple-touch-icon" sizes="152x152" href="/assets/icons/icon-192x192.png" />
				<link rel="apple-touch-icon" sizes="120x120" href="/assets/icons/icon-192x192.png" />
				<link rel="apple-touch-icon" sizes="76x76" href="/assets/icons/icon-192x192.png" />
				<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/icon-192x192.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/icon-192x192.png" />
				<link rel="manifest" href="/manifest.json" />
			</head>
			<Analytics />
			<SpeedInsights />
			<body className={`bg-bg-gradient ${inter.className}`}>{children}</body>
		</html>
	)
}
