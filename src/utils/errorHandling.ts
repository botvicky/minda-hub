import * as Sentry from "sentry-expo"
import { Alert } from "react-native"
import NetInfo from "@react-native-community/netinfo"
import AsyncStorage from "@react-native-async-storage/async-storage"

declare const __DEV__: boolean

// Initialize Sentry for production error tracking
// You would add your Sentry DSN in app.json under expo.extra.sentryDsn
export function initErrorTracking() {
  if (__DEV__) {
    // Don't initialize Sentry in development
    return
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enableInExpoDevelopment: false,
    debug: false,
  })
}

// Log errors to console in development and to Sentry in production
export function logError(error: Error, context = "app") {
  if (__DEV__) {
    console.error(`[${context}]`, error)
  } else {
    Sentry.Native.captureException(error, {
      tags: {
        context,
      },
    })
  }
}

// Check if the device is online
export async function isOnline(): Promise<boolean> {
  const netInfo = await NetInfo.fetch()
  return netInfo.isConnected === true
}

// Handle API errors with appropriate user feedback
export async function handleApiError(error: any, fallbackMessage = "Something went wrong. Please try again.") {
  logError(error, "api")

  // Check if it's a network error
  const online = await isOnline()
  if (!online) {
    return {
      success: false,
      message: "You appear to be offline. Please check your internet connection and try again.",
      offline: true,
    }
  }

  // Handle different types of errors
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status

    if (status === 401 || status === 403) {
      return {
        success: false,
        message: "Authentication error. Please log in again.",
        authError: true,
      }
    }

    if (status === 429) {
      return {
        success: false,
        message: "Too many requests. Please try again later.",
        rateLimited: true,
      }
    }

    return {
      success: false,
      message: error.response.data?.message || fallbackMessage,
      status,
    }
  } else if (error.request) {
    // The request was made but no response was received
    return {
      success: false,
      message: "No response from server. Please try again later.",
      noResponse: true,
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      success: false,
      message: error.message || fallbackMessage,
    }
  }
}

// Show an error alert to the user
export function showErrorAlert(title: string, message: string, onOk?: () => void) {
  Alert.alert(title, message, [{ text: "OK", onPress: onOk }], { cancelable: false })
}

// Log user actions for analytics
export async function logUserAction(action: string, details: any = {}) {
  try {
    // In development, just log to console
    if (__DEV__) {
      console.log("User Action:", action, details)
      return
    }

    // In production, we would send this to an analytics service
    // For now, we'll just store it locally for debugging
    const actionsString = (await AsyncStorage.getItem("user_actions")) || "[]"
    const actions = JSON.parse(actionsString)

    actions.push({
      action,
      details,
      timestamp: new Date().toISOString(),
    })

    // Keep only the last 100 actions to avoid using too much storage
    const trimmedActions = actions.slice(-100)
    await AsyncStorage.setItem("user_actions", JSON.stringify(trimmedActions))

    // Here you would also send to your analytics service
    // analytics.logEvent(action, details);
  } catch (error) {
    console.error("Failed to log user action:", error)
  }
}
