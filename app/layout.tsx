import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientToastProvider from './components/ClientToastProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Presentation Generator',
  description: 'Generate professional presentations in seconds using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientToastProvider>
          {children}
        </ClientToastProvider>
      </body>
    </html>
  )
}
