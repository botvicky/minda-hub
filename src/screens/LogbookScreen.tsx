"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { useDatabase } from "../contexts/DatabaseContext"
import { getRecords, addRecord, deleteRecord } from "../services/dataService"
import DateTimePicker from "@react-native-community/datetimepicker"

export default function LogbookScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { db, isLoading: dbLoading } = useDatabase()

  const [activeTab, setActiveTab] = useState("records")
  const [records, setRecords] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredRecords, setFilteredRecords] = useState([])
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString(),
    type: "expense",
    category: "seeds",
    amount: "",
    description: "",
    relatedTo: "general",
    relatedId: null,
  })

  useFocusEffect(
    useCallback(() => {
      if (db) {
        loadRecords()
      }
    }, [db]),
  )

  useEffect(() => {
    filterRecords()
  }, [searchQuery, selectedFilter, records])

  const loadRecords = async () => {
    setIsLoading(true)
    try {
      const recordsData = await getRecords(db)
      setRecords(recordsData)
    } catch (error) {
      console.error("Error loading records:", error)
      Alert.alert("Error", "Failed to load records. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const filterRecords = () => {
    let filtered = records

    // Filter by type
    if (selectedFilter === "expenses") {
      filtered = filtered.filter((record) => record.type === "expense")
    } else if (selectedFilter === "income") {
      filtered = filtered.filter((record) => record.type === "income")
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (record) => record.description.toLowerCase().includes(query) || record.category.toLowerCase().includes(query),
      )
    }

    // Sort by date (newest first)
    filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredRecords(filtered)
  }

  const handleAddRecord = async () => {
    if (!newRecord.amount || isNaN(Number.parseFloat(newRecord.amount))) {
      Alert.alert("Error", "Please enter a valid amount")
      return
    }

    try {
      const record = {
        date: newRecord.date,
        type: newRecord.type,
        category: newRecord.category,
        amount: Number.parseFloat(newRecord.amount),
        description: newRecord.description,
        relatedTo: newRecord.relatedTo,
        relatedId: newRecord.relatedId,
      }

      const addedRecord = await addRecord(db, record)
      setRecords([...records, addedRecord])
      setModalVisible(false)
      setNewRecord({
        date: new Date().toISOString(),
        type: "expense",
        category: "seeds",
        amount: "",
        description: "",
        relatedTo: "general",
        relatedId: null,
      })
    } catch (error) {
      console.error("Error adding record:", error)
      Alert.alert("Error", "Failed to add record. Please try again.")
    }
  }

  const handleDeleteRecord = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this record?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecord(db, id)
              setRecords(records.filter((record) => record.id !== id))
            } catch (error) {
              console.error("Error deleting record:", error)
              Alert.alert("Error", "Failed to delete record. Please try again.")
            }
          },
        },
      ],
      { cancelable: true },
    )
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`
  }

  const getTotalIncome = () => {
    return records.filter((record) => record.type === "income").reduce((sum, record) => sum + record.amount, 0)
  }

  const getTotalExpenses = () => {
    return records.filter((record) => record.type === "expense").reduce((sum, record) => sum + record.amount, 0)
  }

  const getNetIncome = () => {
    return getTotalIncome() - getTotalExpenses()
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "seeds":
        return "seed"
      case "fertilizer":
        return "flask"
      case "pesticide":
        return "bug"
      case "equipment":
        return "construct"
      case "labor":
        return "people"
      case "sales":
        return "cash"
      default:
        return "document-text"
    }
  }

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNewRecord({ ...newRecord, date: selectedDate.toISOString() })
    }
  }

  const renderRecordItem = ({ item }) => (
    <TouchableOpacity style={[styles.recordItem, { backgroundColor: colors.card }]}>
      <View style={styles.recordHeader}>
        <View style={styles.recordLeft}>
          <View
            style={[
              styles.recordIconContainer,
              {
                backgroundColor: item.type === "income" ? colors.success + "20" : colors.error + "20",
              },
            ]}
          >
            <Ionicons
              name={getCategoryIcon(item.category)}
              size={20}
              color={item.type === "income" ? colors.success : colors.error}
            />
          </View>
          <View>
            <Text style={[styles.recordCategory, { color: colors.text }]}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
            <Text style={[styles.recordDate, { color: colors.text + "AA" }]}>{formatDate(item.date)}</Text>
          </View>
        </View>
        <View style={styles.recordRight}>
          <Text
            style={[
              styles.recordAmount,
              {
                color: item.type === "income" ? colors.success : colors.error,
              },
            ]}
          >
            {item.type === "income" ? "+" : "-"}
            {formatCurrency(item.amount)}
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteRecord(item.id)}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.recordDescription, { color: colors.text + "DD" }]}>{item.description}</Text>
    </TouchableOpacity>
  )

  if (dbLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("logbook")}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "records" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("records")}
        >
          <Text style={[styles.tabText, { color: activeTab === "records" ? colors.primary : colors.text + "CC" }]}>
            {t("records")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "fields" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("fields")}
        >
          <Text style={[styles.tabText, { color: activeTab === "fields" ? colors.primary : colors.text + "CC" }]}>
            {t("fields")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "livestock" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("livestock")}
        >
          <Text style={[styles.tabText, { color: activeTab === "livestock" ? colors.primary : colors.text + "CC" }]}>
            {t("livestock")}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "records" && (
        <>
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.text + "AA" }]}>{t("income")}</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {formatCurrency(getTotalIncome())}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: colors.text + "AA" }]}>{t("expenses")}</Text>
                  <Text style={[styles.summaryValue, { color: colors.error }]}>
                    {formatCurrency(getTotalExpenses())}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.netIncomeContainer}>
                <Text style={[styles.netIncomeLabel, { color: colors.text }]}>Net Income</Text>
                <Text
                  style={[
                    styles.netIncomeValue,
                    {
                      color: getNetIncome() >= 0 ? colors.success : colors.error,
                    },
                  ]}
                >
                  {getNetIncome() >= 0 ? "+" : ""}
                  {formatCurrency(getNetIncome())}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
              <Ionicons name="search" size={20} color={colors.text + "CC"} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search records..."
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

          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedFilter === "all" && [
                    styles.activeFilter,
                    { backgroundColor: colors.primary + "20", borderColor: colors.primary },
                  ],
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedFilter("all")}
              >
                <Text style={[styles.filterText, { color: selectedFilter === "all" ? colors.primary : colors.text }]}>
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedFilter === "income" && [
                    styles.activeFilter,
                    { backgroundColor: colors.success + "20", borderColor: colors.success },
                  ],
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedFilter("income")}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={selectedFilter === "income" ? colors.success : colors.text}
                  style={styles.filterIcon}
                />
                <Text
                  style={[styles.filterText, { color: selectedFilter === "income" ? colors.success : colors.text }]}
                >
                  Income
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedFilter === "expenses" && [
                    styles.activeFilter,
                    { backgroundColor: colors.error + "20", borderColor: colors.error },
                  ],
                  { borderColor: colors.border },
                ]}
                onPress={() => setSelectedFilter("expenses")}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={selectedFilter === "expenses" ? colors.error : colors.text}
                  style={styles.filterIcon}
                />
                <Text
                  style={[styles.filterText, { color: selectedFilter === "expenses" ? colors.error : colors.text }]}
                >
                  Expenses
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text }]}>Loading records...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredRecords}
              renderItem={renderRecordItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text" size={50} color={colors.text + "50"} />
                  <Text style={[styles.emptyText, { color: colors.text }]}>No records found</Text>
                </View>
              }
            />
          )}

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Record</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Type</Text>
                    <View style={styles.typeSelector}>
                      <TouchableOpacity
                        style={[
                          styles.typeOption,
                          newRecord.type === "income" && {
                            backgroundColor: colors.success + "20",
                            borderColor: colors.success,
                          },
                          { borderColor: colors.border },
                        ]}
                        onPress={() => setNewRecord({ ...newRecord, type: "income" })}
                      >
                        <Ionicons
                          name="arrow-up-circle"
                          size={18}
                          color={newRecord.type === "income" ? colors.success : colors.text}
                          style={styles.typeIcon}
                        />
                        <Text
                          style={[
                            styles.typeText,
                            { color: newRecord.type === "income" ? colors.success : colors.text },
                          ]}
                        >
                          Income
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.typeOption,
                          newRecord.type === "expense" && {
                            backgroundColor: colors.error + "20",
                            borderColor: colors.error,
                          },
                          { borderColor: colors.border },
                        ]}
                        onPress={() => setNewRecord({ ...newRecord, type: "expense" })}
                      >
                        <Ionicons
                          name="arrow-down-circle"
                          size={18}
                          color={newRecord.type === "expense" ? colors.error : colors.text}
                          style={styles.typeIcon}
                        />
                        <Text
                          style={[
                            styles.typeText,
                            { color: newRecord.type === "expense" ? colors.error : colors.text },
                          ]}
                        >
                          Expense
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
                    <View style={styles.categorySelector}>
                      {newRecord.type === "expense" ? (
                        <>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {["seeds", "fertilizer", "pesticide", "equipment", "labor", "other"].map((category) => (
                              <TouchableOpacity
                                key={category}
                                style={[
                                  styles.categoryOption,
                                  newRecord.category === category && {
                                    backgroundColor: colors.primary + "20",
                                    borderColor: colors.primary,
                                  },
                                  { borderColor: colors.border },
                                ]}
                                onPress={() => setNewRecord({ ...newRecord, category })}
                              >
                                <Ionicons
                                  name={getCategoryIcon(category)}
                                  size={18}
                                  color={newRecord.category === category ? colors.primary : colors.text}
                                  style={styles.categoryIcon}
                                />
                                <Text
                                  style={[
                                    styles.categoryText,
                                    { color: newRecord.category === category ? colors.primary : colors.text },
                                  ]}
                                >
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </>
                      ) : (
                        <>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {["sales", "subsidy", "loan", "other"].map((category) => (
                              <TouchableOpacity
                                key={category}
                                style={[
                                  styles.categoryOption,
                                  newRecord.category === category && {
                                    backgroundColor: colors.primary + "20",
                                    borderColor: colors.primary,
                                  },
                                  { borderColor: colors.border },
                                ]}
                                onPress={() => setNewRecord({ ...newRecord, category })}
                              >
                                <Ionicons
                                  name={getCategoryIcon(category)}
                                  size={18}
                                  color={newRecord.category === category ? colors.primary : colors.text}
                                  style={styles.categoryIcon}
                                />
                                <Text
                                  style={[
                                    styles.categoryText,
                                    { color: newRecord.category === category ? colors.primary : colors.text },
                                  ]}
                                >
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Amount *</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="0.00"
                      placeholderTextColor={colors.text + "80"}
                      value={newRecord.amount}
                      onChangeText={(text) => setNewRecord({ ...newRecord, amount: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Date</Text>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          flexDirection: "row",
                          alignItems: "center",
                        },
                      ]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={colors.text} style={styles.inputIcon} />
                      <Text style={{ color: colors.text }}>{formatDate(newRecord.date)}</Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                      <DateTimePicker
                        value={new Date(newRecord.date)}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          color: colors.text,
                        },
                      ]}
                      placeholder="Description"
                      placeholderTextColor={colors.text + "80"}
                      value={newRecord.description}
                      onChangeText={(text) => setNewRecord({ ...newRecord, description: text })}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: colors.border }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      { backgroundColor: colors.primary },
                      !newRecord.amount && { opacity: 0.5 },
                    ]}
                    onPress={handleAddRecord}
                    disabled={!newRecord.amount}
                  >
                    <Text style={styles.modalButtonText}>Add Record</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      {activeTab === "fields" && (
        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct" size={50} color={colors.text + "50"} />
          <Text style={[styles.comingSoonText, { color: colors.text }]}>Field management coming soon</Text>
        </View>
      )}

      {activeTab === "livestock" && (
        <View style={styles.comingSoonContainer}>
          <Ionicons name="construct" size={50} color={colors.text + "50"} />
          <Text style={[styles.comingSoonText, { color: colors.text }]}>Livestock management coming soon</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
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
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  netIncomeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netIncomeLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  netIncomeValue: {
    fontSize: 20,
    fontWeight: "bold",
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
  filterContainer: {
    marginBottom: 15,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  activeFilter: {
    borderWidth: 1,
  },
  filterIcon: {
    marginRight: 5,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  recordItem: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recordLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  recordCategory: {
    fontSize: 16,
    fontWeight: "500",
  },
  recordDate: {
    fontSize: 12,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
  deleteButton: {
    padding: 5,
  },
  recordDescription: {
    fontSize: 14,
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
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  comingSoonText: {
    marginTop: 10,
    fontSize: 18,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
  },
  typeIcon: {
    marginRight: 5,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categorySelector: {
    marginTop: 5,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  categoryIcon: {
    marginRight: 5,
  },
  categoryText: {
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
})
