"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { useAuth } from "../contexts/AuthContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function SettingsScreen() {
  const navigation = useNavigation()
  const { colors, dark, setTheme, themeType } = useTheme()
  const { t, locale, setLocale, languages } = useTranslation()
  const { user, logout } = useAuth()

  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")

  useEffect(() => {
    loadUserSettings()
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

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout()
          navigation.reset({
            index: 0,
            routes: [{ name: "Onboarding" as never }],
          })
        },
      },
    ])
  }

  const changeLanguage = (lang) => {
    setLocale(lang)
  }

  const changeTheme = (theme) => {
    setTheme(theme)
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("settings")}</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.profileImageContainer, { backgroundColor: colors.primary + "30" }]}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || "Demo Farmer"}</Text>
          <Text style={[styles.profileEmail, { color: colors.text + "CC" }]}>{user?.email || "demo@example.com"}</Text>
        </View>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Farm Settings</Text>

        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name={farmingType === "greenhouse" ? "leaf" : "sunny"} size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("farmingType")}</Text>
              <Text style={[styles.settingValue, { color: colors.text + "CC" }]}>
                {farmingType === "greenhouse" ? t("greenhouse") : t("openField")}
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="location" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("location")}</Text>
              <Text style={[styles.settingValue, { color: colors.text + "CC" }]}>{location || "Not set"}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>

        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="language" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("language")}</Text>
              <Text style={[styles.settingValue, { color: colors.text + "CC" }]}>{languages[locale]}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name={dark ? "moon" : "sunny"} size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("theme")}</Text>
              <Text style={[styles.settingValue, { color: colors.text + "CC" }]}>
                {themeType === "light" ? t("light") : themeType === "dark" ? t("dark") : t("system")}
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("notifications")}</Text>
              <Text style={[styles.settingValue, { color: colors.text + "CC" }]}>Enabled</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: colors.border, true: colors.primary + "70" }}
              thumbColor={colors.primary}
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Support</Text>

        <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="help-circle" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("help")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("about")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>{t("privacyPolicy")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + "80"} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error + "20" }]} onPress={handleLogout}>
        <Ionicons name="log-out" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>{t("logout")}</Text>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: colors.text + "80" }]}>MindaHub v1.0.0</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 20,
    marginBottom: 10,
  },
  settingCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 65,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  versionContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  versionText: {
    fontSize: 12,
  },
})
