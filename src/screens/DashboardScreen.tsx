"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { useAuth } from "../contexts/AuthContext"
import { useWeather } from "../contexts/WeatherContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function DashboardScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { user } = useAuth()
  const { weatherData, isLoading: weatherLoading, fetchWeather, getWeatherIcon } = useWeather()

  const [refreshing, setRefreshing] = useState(false)
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")
  const [tasks, setTasks] = useState([
    { id: 1, title: "Water tomatoes", completed: false },
    { id: 2, title: "Apply fertilizer to maize", completed: false },
    { id: 3, title: "Check greenhouse humidity", completed: true },
  ])

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

  const toggleTaskCompletion = (id) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>{`${t("welcome")}, ${user?.name || "Farmer"}`}</Text>
          <Text style={[styles.location, { color: colors.text }]}>{location || "Zimbabwe"}</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.primary + "20" }]}
          onPress={() => navigation.navigate("Settings" as never)}
        >
          <Ionicons name="person" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.farmTypeContainer}>
        <View style={[styles.farmTypeTag, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name={farmingType === "greenhouse" ? "leaf" : "sunny"} size={16} color={colors.primary} />
          <Text style={[styles.farmTypeText, { color: colors.primary }]}>
            {farmingType === "greenhouse" ? t("greenhouse") : t("openField")}
          </Text>
        </View>
      </View>

      {/* Weather Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t("weatherForecast")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Weather" as never)}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        {weatherLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={{ color: colors.text }}>Loading weather data...</Text>
          </View>
        ) : weatherData ? (
          <View style={styles.weatherContainer}>
            <View style={styles.currentWeather}>
              <Image source={{ uri: getWeatherIcon(weatherData.current.weather[0].icon) }} style={styles.weatherIcon} />
              <View>
                <Text style={[styles.temperature, { color: colors.text }]}>
                  {`${Math.round(weatherData.current.temp)}°C`}
                </Text>
                <Text style={[styles.weatherDescription, { color: colors.text }]}>
                  {weatherData.current.weather[0].description}
                </Text>
              </View>
            </View>

            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <Ionicons name="water-outline" size={20} color={colors.text} />
                <Text style={[styles.weatherDetailText, { color: colors.text }]}>
                  {`${weatherData.current.humidity}%`}
                </Text>
              </View>
              <View style={styles.weatherDetail}>
                <Ionicons name="speedometer-outline" size={20} color={colors.text} />
                <Text style={[styles.weatherDetailText, { color: colors.text }]}>
                  {`${weatherData.current.wind_speed} km/h`}
                </Text>
              </View>
            </View>

            {weatherData.alerts && weatherData.alerts.length > 0 && (
              <View style={[styles.alertContainer, { backgroundColor: colors.warning + "30" }]}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <Text style={[styles.alertText, { color: colors.text }]}>{weatherData.alerts[0].event}</Text>
              </View>
            )}

            {farmingType === "greenhouse" && (
              <View style={[styles.tipContainer, { backgroundColor: colors.info + "20" }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.info} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  {weatherData.current.temp > 30
                    ? "High temperatures expected. Ensure proper ventilation in your greenhouse."
                    : "Maintain optimal humidity levels in your greenhouse."}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={{ color: colors.text }}>No weather data available</Text>
          </View>
        )}
      </View>

      {/* Tasks Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t("todayTasks")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Planner" as never)}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tasksList}>
          {tasks.map((task) => (
            <TouchableOpacity key={task.id} style={styles.taskItem} onPress={() => toggleTaskCompletion(task.id)}>
              <View
                style={[
                  styles.checkbox,
                  task.completed
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { borderColor: colors.border },
                ]}
              >
                {task.completed && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={[styles.taskText, { color: colors.text }, task.completed && styles.completedTask]}>
                {task.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Planner" as never)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>{t("addTask")}</Text>
        </TouchableOpacity>
      </View>

      {/* Crop Status Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t("cropStatus")}</Text>
          <TouchableOpacity>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cropsList}>
          <CropItem name="Tomatoes" progress={0.7} daysToHarvest={21} colors={colors} />
          <CropItem name="Maize" progress={0.4} daysToHarvest={45} colors={colors} />
          <CropItem name="Beans" progress={0.9} daysToHarvest={7} colors={colors} />
        </View>

        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>{t("addCrop")}</Text>
        </TouchableOpacity>
      </View>

      {/* Pest Alerts */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t("alerts")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("PestGuide" as never)}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.alertsList}>
          <AlertItem
            title="High risk of Tomato Blight"
            description="Recent humidity levels increase risk. Check plants regularly."
            icon="bug"
            type="warning"
            colors={colors}
          />
          <AlertItem
            title="Fertilizer application due"
            description="Maize crop is due for top dressing fertilizer."
            icon="flask"
            type="info"
            colors={colors}
          />
        </View>
      </View>

      {/* Community Tips */}
      <View style={[styles.card, { backgroundColor: colors.card, marginBottom: 20 }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t("community")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Community" as never)}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t("viewAll")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.communityCard, { backgroundColor: colors.primary + "10" }]}>
          <View style={styles.communityCardContent}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <View style={styles.communityCardText}>
              <Text style={[styles.communityCardTitle, { color: colors.text }]}>Join the discussion</Text>
              <Text style={[styles.communityCardDescription, { color: colors.text }]}>
                Connect with other farmers in your area
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.communityCard, { backgroundColor: colors.info + "10" }]}>
          <View style={styles.communityCardContent}>
            <Ionicons name="chatbubble-ellipses" size={24} color={colors.info} />
            <View style={styles.communityCardText}>
              <Text style={[styles.communityCardTitle, { color: colors.text }]}>Ask AI Assistant</Text>
              <Text style={[styles.communityCardDescription, { color: colors.text }]}>Get instant farming advice</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.info} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function CropItem({ name, progress, daysToHarvest, colors }) {
  return (
    <View style={styles.cropItem}>
      <View style={styles.cropInfo}>
        <Text style={[styles.cropName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.cropDays, { color: colors.text }]}>{daysToHarvest} days to harvest</Text>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  )
}

function AlertItem({ title, description, icon, type, colors }) {
  const alertColor =
    type === "warning"
      ? colors.warning
      : type === "error"
        ? colors.error
        : type === "success"
          ? colors.success
          : colors.info

  return (
    <View style={[styles.alertItem, { backgroundColor: alertColor + "15" }]}>
      <View style={[styles.alertIconContainer, { backgroundColor: alertColor + "30" }]}>
        <Ionicons name={icon} size={20} color={alertColor} />
      </View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.alertDescription, { color: colors.text + "CC" }]}>{description}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "bold",
  },
  location: {
    fontSize: 14,
    opacity: 0.7,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  farmTypeContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  farmTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: "flex-start",
  },
  farmTypeText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 5,
  },
  card: {
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  viewAll: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  weatherContainer: {
    gap: 15,
  },
  currentWeather: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherIcon: {
    width: 60,
    height: 60,
    marginRight: 10,
  },
  temperature: {
    fontSize: 24,
    fontWeight: "bold",
  },
  weatherDescription: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weatherDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherDetailText: {
    marginLeft: 5,
    fontSize: 14,
  },
  alertContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  alertText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  tipText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  tasksList: {
    marginBottom: 15,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  taskText: {
    fontSize: 14,
  },
  completedTask: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 5,
  },
  cropsList: {
    marginBottom: 15,
  },
  cropItem: {
    marginBottom: 15,
  },
  cropInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cropName: {
    fontWeight: "500",
  },
  cropDays: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  alertsList: {
    gap: 10,
  },
  alertItem: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 10,
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  communityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  communityCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  communityCardText: {
    marginLeft: 10,
  },
  communityCardTitle: {
    fontWeight: "500",
    marginBottom: 2,
  },
  communityCardDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
})
