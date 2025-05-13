"use client"

import { useEffect, useState } from "react"
import { Text, StyleSheet, Animated } from "react-native"
import NetInfo from "@react-native-community/netinfo"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTheme } from "../contexts/ThemeContext"

export default function NetworkMonitor() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true)
  const [visible, setVisible] = useState(false)
  const slideAnim = useState(new Animated.Value(-50))[0]
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (isConnected === false) {
      setVisible(true)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()
    } else if (isConnected === true && visible) {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false)
      })
    }
  }, [isConnected, visible, slideAnim])

  if (!visible) return null

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isConnected ? colors.success : colors.error,
          paddingTop: insets.top,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>
        {isConnected ? "Back online! Syncing data..." : "You are offline. Some features may be limited."}
      </Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 999,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
})
