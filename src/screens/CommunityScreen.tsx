"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { askAI } from "../services/openai"
import { useDatabase } from "../contexts/DatabaseContext"

// Types for messages
interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: number
}

export default function CommunityScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const { db } = useDatabase()

  const [activeTab, setActiveTab] = useState("forum")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredPosts, setFilteredPosts] = useState([])
  const [selectedTag, setSelectedTag] = useState("")
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")
  const [aiQuery, setAiQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // State for forum posts and experts
  const [posts, setPosts] = useState([])
  const [experts, setExperts] = useState([])

  // State for AI chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI farming assistant. How can I help you today?",
      sender: "ai",
      timestamp: Date.now(),
    },
  ])

  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    loadUserSettings()
    loadForumData()
    loadExpertsData()
    loadChatHistory()
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

  const loadForumData = () => {
    if (db) {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM forumPosts ORDER BY date DESC",
          [],
          (_, { rows }) => {
            setPosts(rows._array)
          },
          (_, error) => {
            console.error("Error loading forum posts:", error)
            return false
          },
        )
      })
    }
  }

  const loadExpertsData = () => {
    if (db) {
      db.transaction((tx) => {
        tx.executeSql(
          "SELECT * FROM experts ORDER BY rating DESC",
          [],
          (_, { rows }) => {
            setExperts(rows._array)
          },
          (_, error) => {
            console.error("Error loading experts:", error)
            return false
          },
        )
      })
    }
  }

  const loadChatHistory = async () => {
    try {
      const chatHistory = await AsyncStorage.getItem("aiChatHistory")
      if (chatHistory) {
        setMessages(JSON.parse(chatHistory))
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  const saveChatHistory = async (newMessages: Message[]) => {
    try {
      await AsyncStorage.setItem("aiChatHistory", JSON.stringify(newMessages))
    } catch (error) {
      console.error("Error saving chat history:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!aiQuery.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: aiQuery,
      sender: "user",
      timestamp: Date.now(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    saveChatHistory(updatedMessages)
    setAiQuery("")

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)

    // Get AI response
    setIsLoading(true)
    try {
      const response = await askAI(userMessage.content)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: "ai",
        timestamp: Date.now(),
      }

      const finalMessages = [...updatedMessages, aiMessage]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)

      // Scroll to bottom again
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error("Error getting AI response:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again later.",
        sender: "ai",
        timestamp: Date.now(),
      }

      const finalMessages = [...updatedMessages, errorMessage]
      setMessages(finalMessages)
      saveChatHistory(finalMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = posts

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags.includes(selectedTag))
    }

    // Sort by date (newest first)
    filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    setFilteredPosts(filtered)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  const getAllTags = () => {
    if (!posts || posts.length === 0) return []

    const allTags = posts.reduce((tags, post) => {
      return [...tags, ...(post.tags ? post.tags.split(",") : [])]
    }, [])

    // Get unique tags
    return [...new Set(allTags)]
  }

  const renderPostItem = ({ item }) => (
    <TouchableOpacity style={[styles.postItem, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <View style={styles.authorContainer}>
          <View style={[styles.authorAvatar, { backgroundColor: colors.primary + "30" }]}>
            <Text style={[styles.authorInitial, { color: colors.primary }]}>
              {item.author ? item.author.charAt(0) : "U"}
            </Text>
          </View>
          <View>
            <Text style={[styles.authorName, { color: colors.text }]}>{item.author || "Unknown"}</Text>
            <Text style={[styles.authorLocation, { color: colors.text + "AA" }]}>
              {item.authorLocation || "Zimbabwe"}
            </Text>
          </View>
        </View>
        <Text style={[styles.postDate, { color: colors.text + "AA" }]}>{formatDate(item.date)}</Text>
      </View>

      <Text style={[styles.postTitle, { color: colors.text }]}>{item.title}</Text>

      <Text style={[styles.postContent, { color: colors.text + "DD" }]} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.tagsContainer}>
        {item.tags &&
          item.tags.split(",").map((tag, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tagBadge,
                {
                  backgroundColor: tag === selectedTag ? colors.primary + "30" : colors.card,
                  borderColor: tag === selectedTag ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedTag(tag === selectedTag ? "" : tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: tag === selectedTag ? colors.primary : colors.text + "CC",
                  },
                ]}
              >
                #{tag}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="heart-outline" size={20} color={colors.text + "CC"} />
          <Text style={[styles.footerButtonText, { color: colors.text + "CC" }]}>{item.likes || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.text + "CC"} />
          <Text style={[styles.footerButtonText, { color: colors.text + "CC" }]}>{item.comments || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerButton}>
          <Ionicons name="share-social-outline" size={20} color={colors.text + "CC"} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  const renderExpertItem = ({ item }) => (
    <TouchableOpacity style={[styles.expertItem, { backgroundColor: colors.card }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.expertImage} resizeMode="cover" />
      <View style={styles.expertInfo}>
        <Text style={[styles.expertName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.expertSpecialty, { color: colors.primary }]}>{item.specialty}</Text>
        <Text style={[styles.expertOrganization, { color: colors.text + "CC" }]}>{item.organization}</Text>
        <View style={styles.ratingContainer}>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(item.rating) ? "star" : star <= item.rating ? "star-half" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={[styles.reviewCount, { color: colors.text + "AA" }]}>({item.reviews})</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.contactButtonText}>Contact</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("community")}</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "forum" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("forum")}
        >
          <Text style={[styles.tabText, { color: activeTab === "forum" ? colors.primary : colors.text + "CC" }]}>
            {t("forum")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "experts" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("experts")}
        >
          <Text style={[styles.tabText, { color: activeTab === "experts" ? colors.primary : colors.text + "CC" }]}>
            {t("askExpert")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "ai" && [styles.activeTab, { borderColor: colors.primary }]]}
          onPress={() => setActiveTab("ai")}
        >
          <Text style={[styles.tabText, { color: activeTab === "ai" ? colors.primary : colors.text + "CC" }]}>
            {t("askAI")}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "forum" && (
        <>
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
              <Ionicons name="search" size={20} color={colors.text + "CC"} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search posts..."
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

          <View style={styles.tagsScrollContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
            >
              {getAllTags().map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: tag === selectedTag ? colors.primary + "30" : colors.card,
                      borderColor: tag === selectedTag ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedTag(tag === selectedTag ? "" : tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      {
                        color: tag === selectedTag ? colors.primary : colors.text + "CC",
                      },
                    ]}
                  >
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={posts}
            renderItem={renderPostItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles" size={50} color={colors.text + "50"} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No posts found</Text>
              </View>
            }
          />

          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="create" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}

      {activeTab === "experts" && (
        <>
          <FlatList
            data={experts}
            renderItem={renderExpertItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people" size={50} color={colors.text + "50"} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No experts available</Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === "ai" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.aiContainer}
          keyboardVerticalOffset={100}
        >
          <View style={[styles.aiChatContainer, { backgroundColor: colors.card }]}>
            <ScrollView ref={scrollViewRef} style={styles.aiMessages} contentContainerStyle={styles.aiMessagesContent}>
              {messages.map((message) =>
                message.sender === "ai" ? (
                  <View key={message.id} style={[styles.aiMessageBubble, { backgroundColor: colors.primary + "20" }]}>
                    <Text style={[styles.aiMessageText, { color: colors.text }]}>{message.content}</Text>
                  </View>
                ) : (
                  <View key={message.id} style={styles.userMessageContainer}>
                    <View style={[styles.userMessageBubble, { backgroundColor: colors.primary }]}>
                      <Text style={styles.userMessageText}>{message.content}</Text>
                    </View>
                  </View>
                ),
              )}

              {isLoading && (
                <View style={[styles.aiMessageBubble, { backgroundColor: colors.primary + "20" }]}>
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.text }]}>Thinking...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={[styles.aiInputContainer, { borderTopColor: colors.border }]}>
              <TextInput
                style={[
                  styles.aiInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Ask me anything about farming..."
                placeholderTextColor={colors.text + "80"}
                value={aiQuery}
                onChangeText={setAiQuery}
                multiline
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[
                  styles.aiSendButton,
                  { backgroundColor: colors.primary },
                  (!aiQuery.trim() || isLoading) && { opacity: 0.5 },
                ]}
                onPress={handleSendMessage}
                disabled={!aiQuery.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.aiSuggestionsContainer}>
            <Text style={[styles.aiSuggestionsTitle, { color: colors.text }]}>Suggested Questions</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.aiSuggestionsContent}
            >
              <TouchableOpacity
                style={[styles.aiSuggestion, { backgroundColor: colors.card }]}
                onPress={() => setAiQuery("How do I control tomato blight in my greenhouse?")}
                disabled={isLoading}
              >
                <Text style={[styles.aiSuggestionText, { color: colors.text }]}>
                  How do I control tomato blight in my greenhouse?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiSuggestion, { backgroundColor: colors.card }]}
                onPress={() => setAiQuery("What's the best fertilizer for maize in sandy soil?")}
                disabled={isLoading}
              >
                <Text style={[styles.aiSuggestionText, { color: colors.text }]}>
                  What's the best fertilizer for maize in sandy soil?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.aiSuggestion, { backgroundColor: colors.card }]}
                onPress={() => setAiQuery("How can I improve water retention in my soil?")}
                disabled={isLoading}
              >
                <Text style={[styles.aiSuggestionText, { color: colors.text }]}>
                  How can I improve water retention in my soil?
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  tagsScrollContainer: {
    marginBottom: 15,
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  tagText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  postItem: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  authorInitial: {
    fontSize: 18,
    fontWeight: "bold",
  },
  authorName: {
    fontSize: 16,
    fontWeight: "500",
  },
  authorLocation: {
    fontSize: 12,
  },
  postDate: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    paddingTop: 10,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  footerButtonText: {
    marginLeft: 5,
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
  expertItem: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  expertImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15,
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  expertSpecialty: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 3,
  },
  expertOrganization: {
    fontSize: 12,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 5,
  },
  reviewCount: {
    fontSize: 12,
  },
  contactButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "center",
  },
  contactButtonText: {
    color: "white",
    fontWeight: "500",
  },
  aiContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  aiChatContainer: {
    flex: 1,
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
  },
  aiMessages: {
    flex: 1,
  },
  aiMessagesContent: {
    padding: 15,
  },
  aiMessageBubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    maxWidth: "85%",
  },
  aiMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageContainer: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  userMessageBubble: {
    borderRadius: 12,
    padding: 12,
    maxWidth: "85%",
  },
  userMessageText: {
    fontSize: 14,
    lineHeight: 20,
    color: "white",
  },
  aiInputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    maxHeight: 100,
  },
  aiSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  aiSuggestionsContainer: {
    marginBottom: 20,
  },
  aiSuggestionsTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  aiSuggestionsContent: {
    paddingBottom: 5,
  },
  aiSuggestion: {
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    maxWidth: 250,
  },
  aiSuggestionText: {
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
})
