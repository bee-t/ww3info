import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Great Conflict Archives | 2045-2067',
  description: 'Historical documentation of the last major global war before the Unified Earth Government - compiled 2100',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="scanlines">
          {children}
        </div>
      </body>
    </html>
  )
}
