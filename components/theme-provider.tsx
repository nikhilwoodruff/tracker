'use client'

import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { useState, useEffect } from 'react'
import { lightTheme, darkTheme } from '@/lib/theme'
import { GlobalStyles } from '@/lib/global-styles'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always use dark theme for the glassmorphism effect
  const theme = darkTheme

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles theme={theme} />
      {children}
    </StyledThemeProvider>
  )
}