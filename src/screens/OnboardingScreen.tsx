"use client"
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { StatusBar } from "expo-status-bar"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { Ionicons } from "@expo/vector-icons"

const { width, height } = Dimensions.get("window")

export default function OnboardingScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t("welcome")}</Text>

        <Text style={[styles.subtitle, { color: colors.text }]}>{t("welcomeSubtitle")}</Text>

        <View style={styles.featuresContainer}>
          <FeatureItem icon="leaf-outline" text="Crop & Livestock Management" colors={colors} />
          <FeatureItem icon="cloud-outline" text="Weather Alerts & Forecasts" colors={colors} />
          <FeatureItem icon="bug-outline" text="Pest & Disease Identification" colors={colors} />
          <FeatureItem icon="book-outline" text="Farm Records & Analytics" colors={colors} />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Setup" as never)}
        >
          <Text style={styles.buttonText}>{t("getStarted")}</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("Login" as never)} style={styles.loginButton}>
            <Text style={[styles.loginText, { color: colors.primary }]}>{t("login")}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register" as never)} style={styles.loginButton}>
            <Text style={[styles.loginText, { color: colors.primary }]}>{t("register")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

function FeatureItem({ icon, text, colors }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.featureText, { color: colors.text }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.8,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  featureText: {
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "500",
  },
})
