"use client"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"

// Screens
import DashboardScreen from "../screens/DashboardScreen"
import PlannerScreen from "../screens/PlannerScreen"
import WeatherScreen from "../screens/WeatherScreen"
import PestGuideScreen from "../screens/PestGuideScreen"
import PestIdentificationScreen from "../screens/PestIdentificationScreen"
import LogbookScreen from "../screens/LogbookScreen"
import CommunityScreen from "../screens/CommunityScreen"
import SettingsScreen from "../screens/SettingsScreen"
import CropRecommendationScreen from "../screens/CropRecommendationScreen"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function PestStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PestGuideMain" component={PestGuideScreen} />
      <Stack.Screen name="PestIdentification" component={PestIdentificationScreen} />
    </Stack.Navigator>
  )
}

function PlannerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlannerMain" component={PlannerScreen} />
      <Stack.Screen name="CropRecommendation" component={CropRecommendationScreen} />
    </Stack.Navigator>
  )
}

export default function MainTabs() {
  const { colors } = useTheme()
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "Planner") {
            iconName = focused ? "calendar" : "calendar-outline"
          } else if (route.name === "Weather") {
            iconName = focused ? "cloud" : "cloud-outline"
          } else if (route.name === "PestGuide") {
            iconName = focused ? "bug" : "bug-outline"
          } else if (route.name === "Logbook") {
            iconName = focused ? "book" : "book-outline"
          } else if (route.name === "Community") {
            iconName = focused ? "people" : "people-outline"
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline"
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t("dashboard") }} />
      <Tab.Screen name="Planner" component={PlannerStack} options={{ title: t("planner"), headerShown: false }} />
      <Tab.Screen name="Weather" component={WeatherScreen} options={{ title: t("weather") }} />
      <Tab.Screen name="PestGuide" component={PestStack} options={{ title: t("pestGuide"), headerShown: false }} />
      <Tab.Screen name="Logbook" component={LogbookScreen} options={{ title: t("logbook") }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ title: t("community") }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t("settings") }} />
    </Tab.Navigator>
  )
}
