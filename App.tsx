"use client"

import { useEffect } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import * as Notifications from "expo-notifications"
import Constants from "expo-constants"
import { I18nProvider } from "./src/contexts/I18nContext"
import { AuthProvider } from "./src/contexts/AuthContext"
import { DatabaseProvider } from "./src/contexts/DatabaseContext"
import { ThemeProvider } from "./src/contexts/ThemeContext"
import { WeatherProvider } from "./src/contexts/WeatherContext"
import { registerForPushNotifications } from "./src/services/notifications"
import NetworkMonitor from "./src/components/NetworkMonitor"
import { initErrorTracking } from "./src/utils/errorHandling"

// Screens
import OnboardingScreen from "./src/screens/OnboardingScreen"
import SetupScreen from "./src/screens/SetupScreen"
import LoginScreen from "./src/screens/LoginScreen"
import RegisterScreen from "./src/screens/RegisterScreen"
import MainTabs from "./src/navigation/MainTabs"

// Initialize error tracking
initErrorTracking()

// Set up environment variables
if (Constants.expoConfig?.extra) {
  // For production builds, use the extra field in app.json
  process.env.OPENAI_API_KEY = Constants.expoConfig.extra.OPENAI_API_KEY
  process.env.OPENWEATHER_API_KEY = Constants.expoConfig.extra.OPENWEATHER_API_KEY
} else {
  // For development, use the .env file (loaded by expo-env)
  // This is handled automatically by the expo-env package
}

const Stack = createNativeStackNavigator()

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function App() {
  const [fontsLoaded] = useFonts({
    "Roboto-Regular": require("./assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("./assets/fonts/Roboto-Bold.ttf"),
    "Roboto-Medium": require("./assets/fonts/Roboto-Medium.ttf"),
  })

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        await SplashScreen.hideAsync()

        // Register for push notifications
        await registerForPushNotifications()
      }
    }
    prepare()
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <AuthProvider>
            <I18nProvider>
              <WeatherProvider>
                <NavigationContainer>
                  <StatusBar style="auto" />
                  <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="Setup" component={SetupScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                  </Stack.Navigator>
                  <NetworkMonitor />
                </NavigationContainer>
              </WeatherProvider>
            </I18nProvider>
          </AuthProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
