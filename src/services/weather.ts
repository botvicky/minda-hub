import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"

// Get the API key from environment variables
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || Constants.expoConfig?.extra?.OPENWEATHER_API_KEY

export async function fetchWeatherData(latitude: number, longitude: number) {
  try {
    if (!WEATHER_API_KEY) {
      throw new Error("OpenWeather API key is not configured")
    }

    // Check if we have cached data
    const cacheKey = `weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`
    const cachedData = await AsyncStorage.getItem(cacheKey)

    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData)
      const cacheAge = Date.now() - timestamp

      // Use cache if it's less than 1 hour old
      if (cacheAge < 3600000) {
        return data
      }
    }

    // Fetch new data from OpenWeather API
    const response = await axios.get(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=metric&appid=${WEATHER_API_KEY}`,
    )

    const data = response.data

    // Cache the data
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }))

    return data
  } catch (error) {
    console.error("Error fetching weather data:", error)
    throw new Error("Failed to fetch weather data. Please check your internet connection.")
  }
}

export function getWeatherIcon(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}

export function getWeatherAlerts(weatherData: any, farmingType: string): any[] {
  const alerts = []

  // Add existing weather alerts if any
  if (weatherData.alerts && weatherData.alerts.length > 0) {
    alerts.push(...weatherData.alerts)
  }

  // Generate custom alerts based on weather conditions and farming type
  const current = weatherData.current

  // High temperature alert
  if (current.temp > 35) {
    alerts.push({
      event: "High Temperature Alert",
      description:
        farmingType === "greenhouse"
          ? "Extremely high temperatures detected. Ensure proper ventilation in your greenhouse and consider shade cloth."
          : "Extremely high temperatures detected. Consider irrigating crops during cooler parts of the day.",
      start: Date.now() / 1000,
      end: Date.now() / 1000 + 86400,
    })
  }

  // Heavy rain alert
  const nextDayRain = weatherData.daily[0].pop
  if (nextDayRain > 0.7) {
    alerts.push({
      event: "Heavy Rain Alert",
      description:
        farmingType === "greenhouse"
          ? "Heavy rainfall expected. Check greenhouse drainage systems."
          : "Heavy rainfall expected. Consider drainage for your fields and delay any chemical applications.",
      start: Date.now() / 1000,
      end: Date.now() / 1000 + 86400,
    })
  }

  // Drought alert
  const fiveDayRain = weatherData.daily.slice(0, 5).reduce((sum, day) => sum + day.pop, 0) / 5
  if (fiveDayRain < 0.1 && current.humidity < 40) {
    alerts.push({
      event: "Drought Conditions",
      description: "Low rainfall and humidity expected for the next 5 days. Consider water conservation measures.",
      start: Date.now() / 1000,
      end: Date.now() / 1000 + 86400 * 5,
    })
  }

  return alerts
}
