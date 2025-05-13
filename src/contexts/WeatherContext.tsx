"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { fetchWeatherData, getWeatherIcon, getWeatherAlerts } from "../services/weather"
import { scheduleWeatherAlert } from "../services/notifications"
import * as Location from "expo-location"

type WeatherContextType = {
  weatherData: any | null
  isLoading: boolean
  error: string | null
  fetchWeather: (latitude: number, longitude: number) => Promise<void>
  getWeatherIcon: (iconCode: string) => string
  refreshWeather: () => Promise<void>
  weatherAlerts: any[]
}

const WeatherContext = createContext<WeatherContextType>({
  weatherData: null,
  isLoading: false,
  error: null,
  fetchWeather: async () => {},
  getWeatherIcon: () => "",
  refreshWeather: async () => {},
  weatherAlerts: [],
})

export const useWeather = () => useContext(WeatherContext)

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weatherData, setWeatherData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    // Get user's location on initial load
    getUserLocation()
  }, [])

  const getUserLocation = async () => {
    try {
      // First check if we have stored coordinates
      const storedLat = await AsyncStorage.getItem("userLatitude")
      const storedLon = await AsyncStorage.getItem("userLongitude")

      if (storedLat && storedLon) {
        const latitude = Number.parseFloat(storedLat)
        const longitude = Number.parseFloat(storedLon)
        setUserLocation({ latitude, longitude })
        fetchWeather(latitude, longitude)
        return
      }

      // If not, try to get current location
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        setError("Permission to access location was denied")
        // Use default coordinates for Zimbabwe (Harare)
        fetchWeather(-17.8292, 31.0522)
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      const { latitude, longitude } = location.coords

      // Store the coordinates for future use
      await AsyncStorage.setItem("userLatitude", latitude.toString())
      await AsyncStorage.setItem("userLongitude", longitude.toString())

      setUserLocation({ latitude, longitude })
      fetchWeather(latitude, longitude)
    } catch (error) {
      console.error("Error getting location:", error)
      setError("Failed to get location. Using default location.")
      // Use default coordinates for Zimbabwe (Harare)
      fetchWeather(-17.8292, 31.0522)
    }
  }

  const fetchWeather = async (latitude: number, longitude: number): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await fetchWeatherData(latitude, longitude)
      setWeatherData(data)

      // Get farming type for context-specific alerts
      const farmingType = (await AsyncStorage.getItem("farmingType")) || "openField"

      // Generate and set weather alerts
      const alerts = getWeatherAlerts(data, farmingType)
      setWeatherAlerts(alerts)

      // Schedule notifications for important alerts
      if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          await scheduleWeatherAlert(alert.event, alert.description)
        }
      }
    } catch (err) {
      console.error("Weather fetch error:", err)
      setError("Failed to fetch weather data")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshWeather = async (): Promise<void> => {
    if (userLocation) {
      await fetchWeather(userLocation.latitude, userLocation.longitude)
    } else {
      // Use default coordinates for Zimbabwe (Harare)
      await fetchWeather(-17.8292, 31.0522)
    }
  }

  return (
    <WeatherContext.Provider
      value={{
        weatherData,
        isLoading,
        error,
        fetchWeather,
        getWeatherIcon,
        refreshWeather,
        weatherAlerts,
      }}
    >
      {children}
    </WeatherContext.Provider>
  )
}
