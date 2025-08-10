'use client'

import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { useState, useEffect } from 'react'
import { lightTheme, darkTheme } from '@/lib/theme'
import { GlobalStyles } from '@/lib/global-styles'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(lightTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      setTheme(mediaQuery.matches ? darkTheme : lightTheme)
    }
    
    handleChange()
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  )
}