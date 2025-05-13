"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { useDatabase } from "../contexts/DatabaseContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getTasks, addTask, toggleTaskCompletion, getCrops } from "../services/dataService"
import { scheduleTaskReminder } from "../services/notifications"
import DateTimePicker from "@react-native-community/datetimepicker"

export default function PlannerScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { db, isLoading: dbLoading } = useDatabase()

  const [activeTab, setActiveTab] = useState("tasks")
  const [tasks, setTasks] = useState([])
  const [crops, setCrops] = useState([])
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString(),
    priority: "medium",
    completed: false,
    relatedTo: "general",
    relatedId: null,
  })

  useFocusEffect(
    useCallback(() => {
      if (db) {
        loadData()
      }
    }, [db]),
  )

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const tasksData = await getTasks(db)
      setTasks(tasksData)

      const cropsData = await getCrops(db)
      setCrops(cropsData)
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to load data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleToggleTaskCompletion = async (id, currentCompleted) => {
    try {
      await toggleTaskCompletion(db, id, !currentCompleted)
      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: currentCompleted ? 0 : 1 } : task)))
    } catch (error) {
      console.error("Error toggling task completion:", error)
      Alert.alert("Error", "Failed to update task. Please try again.")
    }
  }

  const handleAddTask = async () => {
    if (!newTask.title) {
      Alert.alert("Error", "Task title is required")
      return
    }

    try {
      const task = {
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate,
        completed: 0,
        relatedTo: newTask.relatedTo,
        relatedId: newTask.relatedId,
        priority: newTask.priority,
      }

      const addedTask = await addTask(db, task)
      setTasks([...tasks, addedTask])

      // Schedule a reminder notification
      await scheduleTaskReminder(addedTask.id, addedTask.title, addedTask.dueDate)

      setNewTask({
        title: "",
        description: "",
        dueDate: new Date().toISOString(),
        priority: "medium",
        completed: false,
        relatedTo: "general",
        relatedId: null,
      })
      setModalVisible(false)
    } catch (error) {
      console.error("Error adding task:", error)
      Alert.alert("Error", "Failed to add task. Please try again.")
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getDaysRemaining = (dateString) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(dateString)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    return `In ${diffDays} days`
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setNewTask({ ...newTask, dueDate: selectedDate.toISOString() })
    }
  }

  const navigateToCropRecommendation = () => {
    navigation.navigate("CropRecommendation" as never)
  }

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.taskItem, { backgroundColor: colors.card }]}
      onPress={() => handleToggleTaskCompletion(item.id, item.completed)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <View
            style={[
              styles.checkbox,
              item.completed
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { borderColor: colors.border },
            ]}
          >
            {item.completed ? <Ionicons name="checkmark" size={16} color="white" /> : null}
          </View>
          <Text style={[styles.taskTitle, { color: colors.text }, item.completed && styles.completedTask]}>
            {item.title}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) + "30" }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.taskDescription, { color: colors.text + "CC" }, item.completed && styles.completedTask]}>
          {item.description}
        </Text>
      )}

      <View style={styles.taskFooter}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color={colors.text + "AA"} />
          <Text style={[styles.dateText, { color: colors.text + "AA" }]}>{formatDate(item.dueDate)}</Text>
        </View>
        <Text
          style={[
            styles.daysText,
            {
              color:
                getDaysRemaining(item.dueDate).includes("ago") && !item.completed ? colors.error : colors.text + "AA",
            },
          ]}
        >
          {getDaysRemaining(item.dueDate)}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderCropItem = ({ item }) => (
    <View style={[styles.cropItem, { backgroundColor: colors.card }]}>
      <View style={styles.cropHeader}>
        <Text style={[styles.cropName, { color: colors.text }]}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "growing"
                  ? colors.primary + "30"
                  : item.status === "harvesting"
                    ? colors.success + "30"
                    : colors.warning + "30",
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "growing"
                    ? colors.primary
                    : item.status === "harvesting"
                      ? colors.success
                      : colors.warning,
              },
            ]}
          >
            {item.status ? item.status.toUpperCase() : "PLANNED"}
          </Text>
        </View>
      </View>

      <View style={styles.cropDetails}>
        <View style={styles.cropDetailItem}>
          <Text style={[styles.cropDetailLabel, { color: colors.text + "AA" }]}>Variety:</Text>
          <Text style={[styles.cropDetailValue, { color: colors.text }]}>{item.variety || "Not specified"}</Text>
        </View>

        <View style={styles.cropDetailItem}>
          <Text style={[styles.cropDetailLabel, { color: colors.text + "AA" }]}>Location:</Text>
          <Text style={[styles.cropDetailValue, { color: colors.text }]}>
            {item.fieldId ? `Field ${item.fieldId}` : "Not assigned"}
          </Text>
        </View>
      </View>

      <View style={styles.cropDates}>
        <View style={styles.cropDateItem}>
          <Text style={[styles.cropDateLabel, { color: colors.text + "AA" }]}>Planted:</Text>
          <Text style={[styles.cropDateValue, { color: colors.text }]}>
            {item.plantingDate ? formatDate(item.plantingDate) : "Not planted"}
          </Text>
        </View>

        <View style={styles.cropDateItem}>
          <Text style={[styles.cropDateLabel, { color: colors.text + "AA" }]}>Harvest:</Text>
          <Text style={[styles.cropDateValue, { color: colors.text }]}>
            {item.harvestDate ? formatDate(item.harvestDate) : "Not set"}
          </Text>
        </View>
      </View>

      {item.plantingDate && item.harvestDate && (
        <View style={styles.cropProgress}>
          <View style={styles.cropProgressHeader}>
            <Text style={[styles.cropProgressLabel, { color: colors.text }]}>Growth Progress</Text>
            <Text style={[styles.cropProgressDays, { color: colors.primary }]}>
              {getDaysRemaining(item.harvestDate)}
            </Text>
          </View>

          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${calculateProgress(item.plantingDate, item.harvestDate)}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  )

  const calculateProgress = (plantingDate, harvestDate) => {
    const start = new Date(plantingDate).getTime()
    const end = new Date(harvestDate).getTime()
    const now = Date.now()

    if (now <= start) return 0
    if (now >= end) return 100

    const total = end - start
    const elapsed = now - start

    return Math.round((elapsed / total) * 100)
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("planner")}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tasks" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("tasks")}
        >
          <Text style={[styles.tabText, { color: activeTab === "tasks" ? colors.primary : colors.text + "CC" }]}>
            {t("tasks")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "crops" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("crops")}
        >
          <Text style={[styles.tabText, { color: activeTab === "crops" ? colors.primary : colors.text + "CC" }]}>
            Crops
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "calendar" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("calendar")}
        >
          <Text style={[styles.tabText, { color: activeTab === "calendar" ? colors.primary : colors.text + "CC" }]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        </View>
      ) : (
        <>
          {activeTab === "tasks" && (
            <>
              <FlatList
                data={tasks}
                renderItem={renderTaskItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-done-circle" size={50} color={colors.text + "50"} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>No tasks available</Text>
                  </View>
                }
              />

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
                      <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Task</Text>
                      <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Ionicons name="close" size={24} color={colors.text} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Title *</Text>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              color: colors.text,
                            },
                          ]}
                          placeholder="Task title"
                          placeholderTextColor={colors.text + "80"}
                          value={newTask.title}
                          onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                        />
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
                          placeholder="Task description"
                          placeholderTextColor={colors.text + "80"}
                          value={newTask.description}
                          onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Due Date</Text>
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
                          <Text style={{ color: colors.text }}>{formatDate(newTask.dueDate)}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                          <DateTimePicker
                            value={new Date(newTask.dueDate)}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                          />
                        )}
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
                        <View style={styles.prioritySelector}>
                          <TouchableOpacity
                            style={[
                              styles.priorityOption,
                              newTask.priority === "low" && {
                                backgroundColor: colors.success + "20",
                                borderColor: colors.success,
                              },
                              { borderColor: colors.border },
                            ]}
                            onPress={() => setNewTask({ ...newTask, priority: "low" })}
                          >
                            <Text
                              style={[
                                styles.priorityOptionText,
                                { color: newTask.priority === "low" ? colors.success : colors.text },
                              ]}
                            >
                              Low
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.priorityOption,
                              newTask.priority === "medium" && {
                                backgroundColor: colors.warning + "20",
                                borderColor: colors.warning,
                              },
                              { borderColor: colors.border },
                            ]}
                            onPress={() => setNewTask({ ...newTask, priority: "medium" })}
                          >
                            <Text
                              style={[
                                styles.priorityOptionText,
                                { color: newTask.priority === "medium" ? colors.warning : colors.text },
                              ]}
                            >
                              Medium
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.priorityOption,
                              newTask.priority === "high" && {
                                backgroundColor: colors.error + "20",
                                borderColor: colors.error,
                              },
                              { borderColor: colors.border },
                            ]}
                            onPress={() => setNewTask({ ...newTask, priority: "high" })}
                          >
                            <Text
                              style={[
                                styles.priorityOptionText,
                                { color: newTask.priority === "high" ? colors.error : colors.text },
                              ]}
                            >
                              High
                            </Text>
                          </TouchableOpacity>
                        </View>
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
                          !newTask.title && { opacity: 0.5 },
                        ]}
                        onPress={handleAddTask}
                        disabled={!newTask.title}
                      >
                        <Text style={styles.modalButtonText}>Add Task</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          )}

          {activeTab === "crops" && (
            <>
              <FlatList
                data={crops}
                renderItem={renderCropItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="leaf" size={50} color={colors.text + "50"} />
                    <Text style={[styles.emptyText, { color: colors.text }]}>No crops available</Text>
                    <TouchableOpacity
                      style={[styles.recommendButton, { backgroundColor: colors.primary }]}
                      onPress={navigateToCropRecommendation}
                    >
                      <Text style={styles.recommendButtonText}>Get Crop Recommendations</Text>
                    </TouchableOpacity>
                  </View>
                }
              />

              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={navigateToCropRecommendation}
              >
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            </>
          )}

          {activeTab === "calendar" && (
            <View style={styles.comingSoonContainer}>
              <Ionicons name="calendar" size={50} color={colors.primary} />
              <Text style={[styles.comingSoonText, { color: colors.text }]}>Calendar view coming soon!</Text>
              <Text style={[styles.comingSoonSubtext, { color: colors.text + "AA" }]}>
                This feature will provide a calendar view of all your tasks and crop schedules.
              </Text>
            </View>
          )}
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  taskItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  completedTask: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  priorityBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    marginLeft: 5,
  },
  daysText: {
    fontSize: 13,
    fontWeight: "500",
  },
  cropItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
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
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  cropDetails: {
    marginBottom: 10,
  },
  cropDetailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cropDetailLabel: {
    fontSize: 14,
  },
  cropDetailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  cropDates: {
    marginBottom: 10,
  },
  cropDateItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cropDateLabel: {
    fontSize: 14,
  },
  cropDateValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  cropProgress: {
    marginBottom: 10,
  },
  cropProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  cropProgressLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  cropProgressDays: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  prioritySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: "500",
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    textAlign: "center",
  },
  comingSoonSubtext: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  recommendButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  recommendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  inputIcon: {
    marginRight: 10,
  },
})
