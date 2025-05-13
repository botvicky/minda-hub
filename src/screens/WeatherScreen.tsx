"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Image, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { useWeather } from "../contexts/WeatherContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function WeatherScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { weatherData, isLoading, fetchWeather, getWeatherIcon } = useWeather()

  const [refreshing, setRefreshing] = useState(false)
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    loadUserSettings()

    // Mock location for weather
    fetchWeather(-17.8292, 31.0522) // Harare coordinates
  }, [])

  const loadUserSettings = async () => {
    try {
      const storedFarmingType = await AsyncStorage.getItem("farmingType")
      const province = await AsyncStorage.getItem("province")
      const district = await AsyncStorage.getItem("district")

      if (storedFarmingType) {
        setFarmingType(storedFarmingType)
      }

      if (province && district) {
        setLocation(`${district}, ${province}`)
      }
    } catch (error) {
      console.error("Error loading user settings:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadUserSettings()
    await fetchWeather(-17.8292, 31.0522)
    setRefreshing(false)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000)
    const options = { weekday: "short", month: "short", day: "numeric" }
    return date.toLocaleDateString("en-US", options)
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("weather")}</Text>
      </View>

      <View style={styles.locationContainer}>
        <Ionicons name="location" size={20} color={colors.primary} />
        <Text style={[styles.locationText, { color: colors.text }]}>{location || "Zimbabwe"}</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading weather data...</Text>
        </View>
      ) : weatherData ? (
        <>
          {/* Current Weather Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("currentWeather")}</Text>

            <View style={styles.currentWeatherContainer}>
              <View style={styles.currentWeatherMain}>
                <Image
                  source={{ uri: getWeatherIcon(weatherData.current.weather[0].icon) }}
                  style={styles.weatherIcon}
                />
                <Text style={[styles.temperature, { color: colors.text }]}>
                  {`${Math.round(weatherData.current.temp)}°C`}
                </Text>
                <Text style={[styles.weatherDescription, { color: colors.text }]}>
                  {weatherData.current.weather[0].description}
                </Text>
              </View>

              <View style={styles.weatherDetailsGrid}>
                <WeatherDetailItem
                  icon="water-outline"
                  label={t("humidity")}
                  value={`${weatherData.current.humidity}%`}
                  colors={colors}
                />
                <WeatherDetailItem
                  icon="speedometer-outline"
                  label={t("wind")}
                  value={`${weatherData.current.wind_speed} km/h`}
                  colors={colors}
                />
                <WeatherDetailItem
                  icon="thermometer-outline"
                  label="Feels Like"
                  value={`${Math.round(weatherData.current.feels_like || weatherData.current.temp)}°C`}
                  colors={colors}
                />
                <WeatherDetailItem
                  icon="umbrella-outline"
                  label="Precipitation"
                  value={`${Math.round((weatherData.daily[0].pop || 0) * 100)}%`}
                  colors={colors}
                />
              </View>
            </View>
          </View>

          {/* Forecast Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("forecast")}</Text>

            <View style={styles.forecastContainer}>
              {weatherData.daily.slice(0, 5).map((day, index) => (
                <View
                  key={index}
                  style={[
                    styles.forecastDay,
                    index < weatherData.daily.length - 1 && [
                      styles.forecastDivider,
                      { borderBottomColor: colors.border },
                    ],
                  ]}
                >
                  <Text style={[styles.forecastDate, { color: colors.text }]}>
                    {index === 0 ? "Today" : formatDate(day.dt)}
                  </Text>

                  <View style={styles.forecastMiddle}>
                    <Image source={{ uri: getWeatherIcon(day.weather[0].icon) }} style={styles.forecastIcon} />
                    <Text style={[styles.forecastDescription, { color: colors.text }]}>
                      {day.weather[0].description}
                    </Text>
                  </View>

                  <View style={styles.forecastTemps}>
                    <Text style={[styles.forecastTemp, { color: colors.text }]}>{`${Math.round(day.temp.max)}°`}</Text>
                    <Text style={[styles.forecastTempMin, { color: colors.text + "AA" }]}>
                      {`${Math.round(day.temp.min)}°`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Farming Tips Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Farming Tips</Text>

            {farmingType === "greenhouse" ? (
              <View style={styles.tipsContainer}>
                <FarmingTipItem
                  icon="thermometer"
                  title="Temperature Control"
                  description={
                    weatherData.current.temp > 30
                      ? "High temperatures expected. Ensure proper ventilation in your greenhouse."
                      : weatherData.current.temp < 15
                        ? "Low temperatures expected. Consider additional heating if needed."
                        : "Temperatures are in the optimal range for most greenhouse crops."
                  }
                  colors={colors}
                />

                <FarmingTipItem
                  icon="water"
                  title="Humidity Management"
                  description={
                    weatherData.current.humidity > 80
                      ? "High humidity levels. Increase ventilation to prevent fungal diseases."
                      : weatherData.current.humidity < 40
                        ? "Low humidity levels. Consider misting or using a humidifier."
                        : "Humidity levels are in the optimal range for most greenhouse crops."
                  }
                  colors={colors}
                />
              </View>
            ) : (
              <View style={styles.tipsContainer}>
                <FarmingTipItem
                  icon="rainy"
                  title="Rainfall Forecast"
                  description={
                    weatherData.daily[0].pop > 0.7
                      ? "High chance of rain in the next 24 hours. Consider postponing outdoor activities like spraying or fertilizing."
                      : weatherData.daily[0].pop > 0.3
                        ? "Moderate chance of rain. Good conditions for planting if soil is workable."
                        : "Low chance of rain. Ensure adequate irrigation for your crops."
                  }
                  colors={colors}
                />

                <FarmingTipItem
                  icon="sunny"
                  title="Sun Exposure"
                  description={
                    weatherData.current.weather[0].main === "Clear"
                      ? "Clear skies with strong sun exposure. Consider providing shade for sensitive crops."
                      : weatherData.current.weather[0].main === "Clouds"
                        ? "Partly cloudy conditions. Good for most field operations."
                        : "Overcast conditions. Limited sunlight may slow plant growth."
                  }
                  colors={colors}
                />
              </View>
            )}
          </View>

          {/* Weather Alerts */}
          {weatherData.alerts && weatherData.alerts.length > 0 && (
            <View style={[styles.alertCard, { backgroundColor: colors.warning + "20" }]}>
              <View style={styles.alertHeader}>
                <Ionicons name="warning" size={24} color={colors.warning} />
                <Text style={[styles.alertTitle, { color: colors.text }]}>Weather Alert</Text>
              </View>

              {weatherData.alerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Text style={[styles.alertEvent, { color: colors.text }]}>{alert.event}</Text>
                  <Text style={[styles.alertDescription, { color: colors.text + "DD" }]}>{alert.description}</Text>
                  <Text style={[styles.alertTime, { color: colors.text + "AA" }]}>
                    {`Valid until: ${formatDate(alert.end)}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>No weather data available</Text>
        </View>
      )}
    </ScrollView>
  )
}

function WeatherDetailItem({ icon, label, value, colors }) {
  return (
    <View style={styles.weatherDetailItem}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.weatherDetailValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.weatherDetailLabel, { color: colors.text + "AA" }]}>{label}</Text>
    </View>
  )
}

function FarmingTipItem({ icon, title, description, colors }) {
  return (
    <View style={[styles.tipItem, { borderColor: colors.border }]}>
      <View style={[styles.tipIconContainer, { backgroundColor: colors.primary + "20" }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.tipContent}>
        <Text style={[styles.tipTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.tipDescription, { color: colors.text + "DD" }]}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    marginLeft: 5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  currentWeatherContainer: {
    alignItems: "center",
  },
  currentWeatherMain: {
    alignItems: "center",
    marginBottom: 20,
  },
  weatherIcon: {
    width: 100,
    height: 100,
  },
  temperature: {
    fontSize: 48,
    fontWeight: "bold",
  },
  weatherDescription: {
    fontSize: 18,
    textTransform: "capitalize",
  },
  weatherDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  weatherDetailItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
  },
  weatherDetailValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  weatherDetailLabel: {
    fontSize: 14,
  },
  forecastContainer: {
    width: "100%",
  },
  forecastDay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  forecastDivider: {
    borderBottomWidth: 1,
  },
  forecastDate: {
    width: "25%",
    fontSize: 14,
    fontWeight: "500",
  },
  forecastMiddle: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
  },
  forecastIcon: {
    width: 40,
    height: 40,
    marginRight: 5,
  },
  forecastDescription: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  forecastTemps: {
    width: "25%",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  forecastTempMin: {
    fontSize: 16,
  },
  tipsContainer: {
    width: "100%",
  },
  tipItem: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  tipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  alertCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  alertItem: {
    marginBottom: 10,
  },
  alertEvent: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5,
  },
  alertTime: {
    fontSize: 12,
  },
})
