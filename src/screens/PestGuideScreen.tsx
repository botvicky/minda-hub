"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useDatabase } from "../contexts/DatabaseContext"

export default function PestGuideScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { db } = useDatabase()

  const [activeTab, setActiveTab] = useState("pests")
  const [searchQuery, setSearchQuery] = useState("")
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")
  const [filteredItems, setFilteredItems] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [pestsAndDiseases, setPestsAndDiseases] = useState([])

  useEffect(() => {
    loadUserSettings()
    loadPestsAndDiseases()
  }, [])

  useEffect(() => {
    filterItems()
  }, [searchQuery, activeTab, pestsAndDiseases])

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

  const loadPestsAndDiseases = () => {
    if (db) {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM pestsAndDiseases",
          [],
          (_, { rows }) => {
            setPestsAndDiseases(rows._array)
          },
          (_, error) => {
            console.error("Error loading pests and diseases:", error)
            return false
          },
        )
      })
    }
  }

  const filterItems = () => {
    let filtered = pestsAndDiseases

    // Filter by type (pest or disease)
    if (activeTab === "pests") {
      filtered = filtered.filter((item) => item.type === "pest")
    } else if (activeTab === "diseases") {
      filtered = filtered.filter((item) => item.type === "disease")
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) => item.name.toLowerCase().includes(query) || item.affectedCrops.toLowerCase().includes(query),
      )
    }

    setFilteredItems(filtered)
  }

  const getThreatLevelColor = (level) => {
    switch (level) {
      case "high":
        return colors.error
      case "medium":
        return colors.warning
      case "low":
        return colors.success
      default:
        return colors.info
    }
  }

  const navigateToPestIdentification = () => {
    navigation.navigate("PestIdentification" as never)
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.itemCard, { backgroundColor: colors.card }]} onPress={() => setSelectedItem(item)}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.itemCrops, { color: colors.text + "CC" }]}>{`Affects: ${item.affectedCrops}`}</Text>
        <View style={styles.threatContainer}>
          <View style={[styles.threatBadge, { backgroundColor: getThreatLevelColor(item.localThreatLevel) + "30" }]}>
            <Text style={[styles.threatText, { color: getThreatLevelColor(item.localThreatLevel) }]}>
              {`${item.localThreatLevel.toUpperCase()} RISK`}
            </Text>
          </View>
          <Text style={[styles.locationText, { color: colors.text + "AA" }]}>{`in ${location || "your area"}`}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  function PestDetailView({ item, onBack, colors, location, getThreatLevelColor }) {
    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.detailTitle, { color: colors.text }]}>{item.name}</Text>
          <View style={styles.placeholder} />
        </View>

        <Image source={{ uri: item.imageUrl }} style={styles.detailImage} resizeMode="cover" />

        <View style={styles.detailContent}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: item.type === "pest" ? colors.error + "20" : colors.warning + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color: item.type === "pest" ? colors.error : colors.warning,
                },
              ]}
            >
              {item.type.toUpperCase()}
            </Text>
          </View>

          <View style={styles.threatRow}>
            <View style={[styles.threatBadge, { backgroundColor: getThreatLevelColor(item.localThreatLevel) + "30" }]}>
              <Text style={[styles.threatText, { color: getThreatLevelColor(item.localThreatLevel) }]}>
                {`${item.localThreatLevel.toUpperCase()} RISK`}
              </Text>
            </View>
            <Text style={[styles.locationText, { color: colors.text + "AA" }]}>{`in ${location || "your area"}`}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Affected Crops</Text>
            <View style={styles.cropTags}>
              {item.affectedCrops.split(",").map((crop, index) => (
                <View key={index} style={[styles.cropTag, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.cropTagText, { color: colors.primary }]}>{crop.trim()}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Symptoms</Text>
            <Text style={[styles.infoText, { color: colors.text }]}>{item.symptoms}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Treatments</Text>
            <Text style={[styles.infoText, { color: colors.text }]}>{item.treatments}</Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Prevention Tips</Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Practice crop rotation to break pest cycles
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.text }]}>
                  Maintain proper spacing between plants for air circulation
                </Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.text }]}>Remove and destroy infected plant material</Text>
              </View>
              <View style={styles.tipItem}>
                <View style={[styles.tipBullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.tipText, { color: colors.text }]}>Use resistant varieties when available</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {selectedItem ? (
        <PestDetailView
          item={selectedItem}
          onBack={() => setSelectedItem(null)}
          colors={colors}
          location={location}
          getThreatLevelColor={getThreatLevelColor}
        />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t("pestGuide")}</Text>
            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: colors.primary }]}
              onPress={navigateToPestIdentification}
            >
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
              <Ionicons name="search" size={20} color={colors.text + "CC"} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search pests or crops..."
                placeholderTextColor={colors.text + "CC"}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={20} color={colors.text + "CC"} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "all" && [styles.activeTab, { borderColor: colors.primary }]]}
              onPress={() => setActiveTab("all")}
            >
              <Text style={[styles.tabText, { color: activeTab === "all" ? colors.primary : colors.text + "CC" }]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "pests" && [styles.activeTab, { borderColor: colors.primary }]]}
              onPress={() => setActiveTab("pests")}
            >
              <Text style={[styles.tabText, { color: activeTab === "pests" ? colors.primary : colors.text + "CC" }]}>
                Pests
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "diseases" && [styles.activeTab, { borderColor: colors.primary }]]}
              onPress={() => setActiveTab("diseases")}
            >
              <Text style={[styles.tabText, { color: activeTab === "diseases" ? colors.primary : colors.text + "CC" }]}>
                Diseases
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={50} color={colors.text + "50"} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No results found</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={[styles.identifyButton, { backgroundColor: colors.primary }]}
            onPress={navigateToPestIdentification}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.identifyButtonText}>{t("identifyPest")}</Text>
          </TouchableOpacity>
        </>
      )}
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
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 45,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  itemCard: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemContent: {
    flex: 1,
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  itemCrops: {
    fontSize: 14,
    marginBottom: 10,
  },
  threatContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 5,
  },
  threatText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  locationText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
  identifyButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  identifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10,
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 34,
  },
  detailImage: {
    width: "100%",
    height: 200,
  },
  detailContent: {
    padding: 20,
  },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  threatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
  },
  cropTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cropTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  cropTagText: {
    fontSize: 14,
  },
  tipsList: {
    marginTop: 5,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  tipBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
})
