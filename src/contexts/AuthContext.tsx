"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useDatabase } from "./DatabaseContext"

type User = {
  id: string
  name: string
  email: string
  phone?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>
  logout: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
  error: null,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { db } = useDatabase()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user")
        if (userData) {
          setUser(JSON.parse(userData))
        }
      } catch (err) {
        console.error("Failed to get user data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null)

      // For demo purposes, we'll simulate a successful login
      // In a real app, you would validate credentials against a backend
      const mockUser = {
        id: "1",
        name: "Demo Farmer",
        email: email,
        phone: "+263 77 123 4567",
      }

      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)
      return true
    } catch (err) {
      console.error("Login error:", err)
      setError("Failed to login. Please try again.")
      return false
    }
  }

  const register = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    try {
      setError(null)

      // For demo purposes, we'll simulate a successful registration
      // In a real app, you would send this data to a backend
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        phone,
      }

      await AsyncStorage.setItem("user", JSON.stringify(newUser))
      setUser(newUser)
      return true
    } catch (err) {
      console.error("Registration error:", err)
      setError("Failed to register. Please try again.")
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("user")
      setUser(null)
    } catch (err) {
      console.error("Logout error:", err)
      setError("Failed to logout. Please try again.")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
