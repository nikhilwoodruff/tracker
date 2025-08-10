import type { Metadata } from "next"
import StyledComponentsRegistry from '@/lib/styled-registry'
import ThemeProvider from '@/components/theme-provider'

export const metadata: Metadata = {
  title: "Personal tracker",
  description: "Track your daily metrics with AI",
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