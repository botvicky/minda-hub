"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { getRecommendedCrops, getPlantingCalendar } from "../services/cropRecommendation"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function CropRecommendationScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()

  const [recommendedCrops, setRecommendedCrops] = useState([])
  const [selectedCrop, setSelectedCrop] = useState(null)
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserSettings()
    loadRecommendedCrops()
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

  const loadRecommendedCrops = async () => {
    setIsLoading(true)
    try {
      const crops = await getRecommendedCrops()
      setRecommendedCrops(crops)
    } catch (error) {
      console.error("Error loading recommended crops:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWaterRequirementIcon = (requirement) => {
    switch (requirement) {
      case "low":
        return "water-outline"
      case "medium":
        return "water"
      case "high":
        return "water-sharp"
      default:
        return "water"
    }
  }

  const renderCropItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.cropCard, { backgroundColor: colors.card }]}
      onPress={() => setSelectedCrop(item.name)}
    >
      <View style={styles.cropHeader}>
        <Text style={[styles.cropName, { color: colors.text }]}>{item.name}</Text>
        <View style={[styles.cropBadge, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.cropBadgeText, { color: colors.primary }]}>
            {item.greenhouseSuitable && item.openFieldSuitable
              ? "Greenhouse & Open Field"
              : item.greenhouseSuitable
                ? "Greenhouse"
                : "Open Field"}
          </Text>
        </View>
      </View>

      <View style={styles.cropDetails}>
        <View style={styles.cropDetailItem}>
          <Ionicons name="time-outline" size={18} color={colors.text + "AA"} />
          <Text style={[styles.cropDetailText, { color: colors.text }]}>{item.growthDuration} days to harvest</Text>
        </View>

        <View style={styles.cropDetailItem}>
          <Ionicons name={getWaterRequirementIcon(item.waterRequirement)} size={18} color={colors.text + "AA"} />
          <Text style={[styles.cropDetailText, { color: colors.text }]}>
            {item.waterRequirement.charAt(0).toUpperCase() + item.waterRequirement.slice(1)} water needs
          </Text>
        </View>
      </View>

      <Text style={[styles.cropDescription, { color: colors.text + "DD" }]}>{item.description}</Text>

      <View style={styles.cropFooter}>
        <TouchableOpacity
          style={[styles.cropButton, { backgroundColor: colors.primary }]}
          onPress={() => setSelectedCrop(item.name)}
        >
          <Text style={styles.cropButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Crop Recommendations</Text>
        <View style={styles.placeholder} />
      </View>

      {selectedCrop ? (
        <CropDetailView
          cropName={selectedCrop}
          onBack={() => setSelectedCrop(null)}
          colors={colors}
          farmingType={farmingType}
          location={location}
        />
      ) : (
        <>
          <View style={styles.infoContainer}>
            <View style={[styles.infoCard, { backgroundColor: colors.primary + "15" }]}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Personalized Recommendations</Text>
                <Text style={[styles.infoText, { color: colors.text + "DD" }]}>
                  These crops are recommended based on your {farmingType} farming type in {location || "Zimbabwe"} and
                  the current season.
                </Text>
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="leaf" size={50} color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>Loading recommendations...</Text>
            </View>
          ) : (
            <FlatList
              data={recommendedCrops}
              renderItem={renderCropItem}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="leaf" size={50} color={colors.text + "50"} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No crop recommendations available</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  )
}

function CropDetailView({ cropName, onBack, colors, farmingType, location }) {
  const [calendar, setCalendar] = useState(null)

  useEffect(() => {
    if (cropName) {
      const plantingCalendar = getPlantingCalendar(cropName)
      setCalendar(plantingCalendar)
    }
  }, [cropName])

  if (!calendar) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="leaf" size={50} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading crop details...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.detailContainer} contentContainerStyle={styles.detailContent}>
      <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.detailTitle, { color: colors.text }]}>{calendar.crop}</Text>

        <View style={styles.growthInfoContainer}>
          <View style={styles.growthInfoItem}>
            <Ionicons name="time-outline" size={24} color={colors.primary} />
            <Text style={[styles.growthInfoValue, { color: colors.text }]}>{calendar.growthDuration}</Text>
            <Text style={[styles.growthInfoLabel, { color: colors.text + "AA" }]}>Days to Harvest</Text>
          </View>

          <View style={styles.growthInfoItem}>
            <Ionicons
              name={
                calendar.waterRequirement === "low"
                  ? "water-outline"
                  : calendar.waterRequirement === "medium"
                    ? "water"
                    : "water-sharp"
              }
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.growthInfoValue, { color: colors.text }]}>
              {calendar.waterRequirement.charAt(0).toUpperCase() + calendar.waterRequirement.slice(1)}
            </Text>
            <Text style={[styles.growthInfoLabel, { color: colors.text + "AA" }]}>Water Needs</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Planting Calendar</Text>

          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarLabel, { color: colors.text + "AA" }]}>Best Planting Months:</Text>
            </View>
            <View style={styles.monthsContainer}>
              {calendar.bestPlantingMonths.map((month, index) => (
                <View
                  key={index}
                  style={[
                    styles.monthBadge,
                    {
                      backgroundColor:
                        month === calendar.nextPlantingMonth ? colors.primary + "30" : colors.primary + "15",
                      borderColor: month === calendar.nextPlantingMonth ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.monthText,
                      { color: month === calendar.nextPlantingMonth ? colors.primary : colors.text },
                    ]}
                  >
                    {month}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {calendar.nextPlantingMonth && (
            <View style={[styles.nextPlantingContainer, { backgroundColor: colors.success + "15" }]}>
              <Ionicons name="calendar" size={20} color={colors.success} />
              <Text style={[styles.nextPlantingText, { color: colors.text }]}>
                Next planting season: <Text style={{ fontWeight: "bold" }}>{calendar.nextPlantingMonth}</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Growing Tips</Text>
          <Text style={[styles.tipsText, { color: colors.text }]}>{calendar.tips}</Text>

          <View style={styles.farmingTypeContainer}>
            <Text style={[styles.farmingTypeLabel, { color: colors.text + "AA" }]}>
              {farmingType === "greenhouse" ? "Greenhouse Tips:" : "Open Field Tips:"}
            </Text>
            <Text style={[styles.farmingTypeText, { color: colors.text }]}>
              {farmingType === "greenhouse"
                ? "Maintain optimal temperature between 21-27°C. Monitor humidity levels and ensure proper ventilation to prevent fungal diseases."
                : "Prepare soil well before planting. Consider mulching to conserve moisture and suppress weeds. Monitor for pests regularly."}
            </Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Local Considerations</Text>
          <Text style={[styles.localText, { color: colors.text }]}>
            {location
              ? `In ${location}, consider the local rainfall patterns and soil conditions. Consult with local agricultural extension officers for specific advice for your area.`
              : "Consider your local rainfall patterns and soil conditions. Consult with local agricultural extension officers for specific advice for your area."}
          </Text>
        </View>

        <TouchableOpacity style={[styles.backToListButton, { backgroundColor: colors.primary }]} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text style={styles.backToListText}>Back to Recommendations</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  infoCard: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 15,
  },
  infoIconContainer: {
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cropCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  cropHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cropName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  cropBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  cropBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cropDetails: {
    flexDirection: "row",
    marginBottom: 10,
  },
  cropDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  cropDetailText: {
    fontSize: 14,
    marginLeft: 5,
  },
  cropDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  cropFooter: {
    alignItems: "flex-end",
  },
  cropButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cropButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },
  detailContainer: {
    flex: 1,
  },
  detailContent: {
    padding: 20,
  },
  detailCard: {
    borderRadius: 12,
    padding: 15,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  growthInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  growthInfoItem: {
    alignItems: "center",
  },
  growthInfoValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  growthInfoLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  calendarContainer: {
    marginBottom: 15,
  },
  calendarHeader: {
    marginBottom: 10,
  },
  calendarLabel: {
    fontSize: 14,
  },
  monthsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  monthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  monthText: {
    fontSize: 14,
  },
  nextPlantingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
  },
  nextPlantingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 15,
  },
  farmingTypeContainer: {
    marginBottom: 10,
  },
  farmingTypeLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
  },
  farmingTypeText: {
    fontSize: 14,
    lineHeight: 22,
  },
  localText: {
    fontSize: 14,
    lineHeight: 22,
  },
  backToListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  backToListText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
})
