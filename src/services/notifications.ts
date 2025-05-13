import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Register for push notifications
export async function registerForPushNotifications() {
  let token

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!")
      return
    }

    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: "your-project-id", // Replace with your Expo project ID
      })
    ).data

    // Store the token
    await AsyncStorage.setItem("pushToken", token)
  } else {
    console.log("Must use physical device for Push Notifications")
  }

  return token
}

// Schedule a local notification
export async function scheduleNotification(title: string, body: string, trigger: any = null) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { data: "goes here" },
    },
    trigger: trigger || null,
  })
}

// Schedule a task reminder notification
export async function scheduleTaskReminder(taskId: number, title: string, dueDate: string) {
  const scheduledDate = new Date(dueDate)

  // Set reminder for 1 day before due date at 8:00 AM
  scheduledDate.setDate(scheduledDate.getDate() - 1)
  scheduledDate.setHours(8, 0, 0, 0)

  // Only schedule if the date is in the future
  if (scheduledDate > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task Reminder",
        body: `Don't forget: ${title} is due tomorrow`,
        data: { taskId },
      },
      trigger: {
        date: scheduledDate,
      },
    })
  }
}

// Schedule weather alert notification
export async function scheduleWeatherAlert(event: string, description: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: event,
      body: description,
      data: { type: "weather" },
    },
    trigger: null, // Send immediately
  })
}

// Cancel all scheduled notifications
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
