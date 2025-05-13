"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { useDatabase } from "../contexts/DatabaseContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Zimbabwe provinces and districts
const ZIMBABWE_LOCATIONS = {
  Harare: ["Harare"],
  Bulawayo: ["Bulawayo"],
  Manicaland: ["Mutare", "Chipinge", "Nyanga", "Buhera", "Chimanimani", "Makoni", "Mutasa"],
  "Mashonaland Central": ["Bindura", "Centenary", "Guruve", "Mazowe", "Mount Darwin", "Rushinga", "Shamva"],
  "Mashonaland East": ["Marondera", "Chikomba", "Goromonzi", "Hwedza", "Mudzi", "Murehwa", "Mutoko", "Seke", "UMP"],
  "Mashonaland West": [
    "Chinhoyi",
    "Chegutu",
    "Hurungwe",
    "Kadoma",
    "Kariba",
    "Makonde",
    "Mhondoro-Ngezi",
    "Sanyati",
    "Zvimba",
  ],
  Masvingo: ["Masvingo", "Bikita", "Chiredzi", "Chivi", "Gutu", "Mwenezi", "Zaka"],
  "Matabeleland North": ["Lupane", "Binga", "Bubi", "Hwange", "Nkayi", "Tsholotsho", "Umguza"],
  "Matabeleland South": ["Gwanda", "Beitbridge", "Bulilima", "Insiza", "Mangwe", "Matobo", "Umzingwane"],
  Midlands: ["Gweru", "Chirumhanzu", "Gokwe North", "Gokwe South", "Kwekwe", "Mberengwa", "Shurugwi", "Zvishavane"],
}

export default function SetupScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { db } = useDatabase()

  const [step, setStep] = useState(1)
  const [farmingType, setFarmingType] = useState("")
  const [province, setProvince] = useState("")
  const [district, setDistrict] = useState("")

  const handleNext = async () => {
    if (step === 1 && !farmingType) {
      // Show error or validation message
      return
    }

    if (step === 2 && (!province || !district)) {
      // Show error or validation message
      return
    }

    if (step < 2) {
      setStep(step + 1)
    } else {
      // Save settings
      try {
        await AsyncStorage.setItem("setupComplete", "true")
        await AsyncStorage.setItem("farmingType", farmingType)
        await AsyncStorage.setItem("province", province)
        await AsyncStorage.setItem("district", district)

        // Save to database if available
        if (db) {
          db.transaction((tx) => {
            tx.executeSql(
              "INSERT OR REPLACE INTO settings (id, farmingType, province, district, language, theme) VALUES (1, ?, ?, ?, ?, ?)",
              [farmingType, province, district, "en", "system"],
              () => {
                console.log("Settings saved to database")
              },
              (_, error) => {
                console.error("Error saving settings:", error)
                return false
              },
            )
          })
        }

        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" as never }],
        })
      } catch (error) {
        console.error("Error saving settings:", error)
      }
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {step === 1 ? t("farmingType") : t("location")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progress,
              {
                backgroundColor: colors.primary,
                width: `${(step / 2) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.text }]}>{step}/2</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {step === 1 ? (
          <View style={styles.optionsContainer}>
            <Text style={[styles.question, { color: colors.text }]}>{t("farmingType")}</Text>

            <TouchableOpacity
              style={[
                styles.optionCard,
                farmingType === "greenhouse" && { borderColor: colors.primary },
                { backgroundColor: colors.card },
              ]}
              onPress={() => setFarmingType("greenhouse")}
            >
              <View style={styles.optionContent}>
                <Ionicons name="leaf" size={40} color={farmingType === "greenhouse" ? colors.primary : colors.text} />
                <Text
                  style={[styles.optionText, { color: farmingType === "greenhouse" ? colors.primary : colors.text }]}
                >
                  {t("greenhouse")}
                </Text>
              </View>

              {farmingType === "greenhouse" && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                farmingType === "openField" && { borderColor: colors.primary },
                { backgroundColor: colors.card },
              ]}
              onPress={() => setFarmingType("openField")}
            >
              <View style={styles.optionContent}>
                <Ionicons name="sunny" size={40} color={farmingType === "openField" ? colors.primary : colors.text} />
                <Text
                  style={[styles.optionText, { color: farmingType === "openField" ? colors.primary : colors.text }]}
                >
                  {t("openField")}
                </Text>
              </View>

              {farmingType === "openField" && (
                <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.locationContainer}>
            <Text style={[styles.question, { color: colors.text }]}>{t("location")}</Text>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t("selectProvince")}</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.provincesContainer}
            >
              {Object.keys(ZIMBABWE_LOCATIONS).map((prov) => (
                <TouchableOpacity
                  key={prov}
                  style={[
                    styles.provinceCard,
                    province === prov && { borderColor: colors.primary, backgroundColor: colors.primary + "20" },
                    { backgroundColor: colors.card },
                  ]}
                  onPress={() => {
                    setProvince(prov)
                    setDistrict("")
                  }}
                >
                  <Text style={[styles.provinceText, { color: province === prov ? colors.primary : colors.text }]}>
                    {prov}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {province && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>{t("selectDistrict")}</Text>

                <View style={styles.districtsContainer}>
                  {ZIMBABWE_LOCATIONS[province].map((dist) => (
                    <TouchableOpacity
                      key={dist}
                      style={[
                        styles.districtCard,
                        district === dist && { borderColor: colors.primary, backgroundColor: colors.primary + "20" },
                        { backgroundColor: colors.card },
                      ]}
                      onPress={() => setDistrict(dist)}
                    >
                      <Text style={[styles.districtText, { color: district === dist ? colors.primary : colors.text }]}>
                        {dist}
                      </Text>

                      {district === dist && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.primary },
            (step === 1 && !farmingType) || (step === 2 && (!province || !district))
              ? { opacity: 0.5 }
              : { opacity: 1 },
          ]}
          onPress={handleNext}
          disabled={(step === 1 && !farmingType) || (step === 2 && (!province || !district))}
        >
          <Text style={styles.nextButtonText}>{step === 2 ? t("save") : t("next")}</Text>
          {step < 2 && <Ionicons name="arrow-forward" size={20} color="white" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionsContainer: {
    flex: 1,
  },
  question: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 20,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: 15,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  locationContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  provincesContainer: {
    paddingBottom: 10,
  },
  provinceCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  provinceText: {
    fontSize: 14,
    fontWeight: "500",
  },
  districtsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  districtCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  districtText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 10,
  },
  nextButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 5,
  },
})
