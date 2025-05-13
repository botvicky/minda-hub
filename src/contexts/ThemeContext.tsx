"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useColorScheme } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Define theme colors
const lightTheme = {
  primary: "#4CAF50",
  secondary: "#8BC34A",
  background: "#FFFFFF",
  card: "#F5F5F5",
  text: "#212121",
  border: "#E0E0E0",
  notification: "#FF9800",
  error: "#F44336",
  success: "#4CAF50",
  warning: "#FFC107",
  info: "#2196F3",
}

const darkTheme = {
  primary: "#4CAF50",
  secondary: "#8BC34A",
  background: "#121212",
  card: "#1E1E1E",
  text: "#FFFFFF",
  border: "#333333",
  notification: "#FF9800",
  error: "#F44336",
  success: "#4CAF50",
  warning: "#FFC107",
  info: "#2196F3",
}

type Theme = {
  colors: typeof lightTheme
  dark: boolean
  setTheme: (theme: "light" | "dark" | "system") => void
  themeType: "light" | "dark" | "system"
}

const ThemeContext = createContext<Theme>({
  colors: lightTheme,
  dark: false,
  setTheme: () => {},
  themeType: "system",
})

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme()
  const [themeType, setThemeType] = useState<"light" | "dark" | "system">("system")

  useEffect(() => {
    // Load saved theme preference
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("theme")
        if (savedTheme) {
          setThemeType(savedTheme as "light" | "dark" | "system")
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error)
      }
    }

    loadTheme()
  }, [])

  const setTheme = async (theme: "light" | "dark" | "system") => {
    setThemeType(theme)
    try {
      await AsyncStorage.setItem("theme", theme)
    } catch (error) {
      console.error("Failed to save theme preference:", error)
    }
  }

  // Determine if we should use dark mode
  const isDark = themeType === "system" ? systemColorScheme === "dark" : themeType === "dark"

  // Choose the appropriate theme colors
  const colors = isDark ? darkTheme : lightTheme

  return <ThemeContext.Provider value={{ colors, dark: isDark, setTheme, themeType }}>{children}</ThemeContext.Provider>
}
