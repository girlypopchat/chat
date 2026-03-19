import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GirlyPopChat - For Bad Bitches, Mermaids, Unicorns, Fairies & Slay Queens',
  description: 'Video chat for pixies, sprites, goddesses, witches, sirens, and every other kind of magical creature. Body-positive, women-first, open to all.',
  icons: {
    icon: { url: '/favicon.svg?v=3', type: 'image/svg+xml' },
    apple: '/favicon.svg?v=3',
  },
  keywords: ['video chat', 'community', 'streaming', 'social', 'make friends'],
  openGraph: {
    title: 'GirlyPopChat - For Bad Bitches, Mermaids, Unicorns, Fairies & Slay Queens',
    description: 'Video chat for pixies, sprites, goddesses, witches, sirens, and every other kind of magical creature.',
    type: 'website',
    url: 'https://girlypopchat.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GirlyPopChat',
    description: 'For bad bitches, mermaids, unicorns, fairies & slay queens',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
