import type { Metadata, Viewport } from "next"
import StyledComponentsRegistry from '@/lib/styled-registry'
import ThemeProvider from '@/components/theme-provider'

export const metadata: Metadata = {
  title: "Personal tracker",
  description: "Track your daily metrics with AI",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}