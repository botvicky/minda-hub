"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import * as SQLite from "expo-sqlite"

type DatabaseContextType = {
  db: SQLite.SQLiteDatabase | null
  isLoading: boolean
  error: string | null
  resetDatabase: () => Promise<void>
}

const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isLoading: true,
  error: null,
  resetDatabase: async () => {},
})

export const useDatabase = () => useContext(DatabaseContext)

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initDatabase()
  }, [])

  const initDatabase = async () => {
    try {
      setIsLoading(true)

      // Open the database
      const database = SQLite.openDatabase("mindahub.db")

      // Initialize tables
      await new Promise<void>((resolve, reject) => {
        database.transaction(
          (tx) => {
            // User settings table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY NOT NULL,
                farmingType TEXT NOT NULL,
                province TEXT NOT NULL,
                district TEXT NOT NULL,
                language TEXT NOT NULL,
                theme TEXT NOT NULL
              );`,
            )

            // Crops table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS crops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                variety TEXT,
                fieldId INTEGER,
                plantingDate TEXT,
                harvestDate TEXT,
                status TEXT,
                notes TEXT
              );`,
            )

            // Livestock table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS livestock (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                breed TEXT,
                quantity INTEGER,
                penId INTEGER,
                acquisitionDate TEXT,
                notes TEXT
              );`,
            )

            // Fields table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS fields (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                size REAL,
                unit TEXT,
                location TEXT,
                soilType TEXT,
                notes TEXT
              );`,
            )

            // Pens table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS pens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                size REAL,
                unit TEXT,
                location TEXT,
                type TEXT,
                notes TEXT
              );`,
            )

            // Tasks table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                dueDate TEXT,
                completed INTEGER DEFAULT 0,
                relatedTo TEXT,
                relatedId INTEGER,
                priority TEXT
              );`,
            )

            // Records table
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                type TEXT NOT NULL,
                category TEXT,
                amount REAL,
                description TEXT,
                relatedTo TEXT,
                relatedId INTEGER
              );`,
            )

            // Weather data cache
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS weatherCache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location TEXT NOT NULL,
                data TEXT NOT NULL,
                timestamp INTEGER NOT NULL
              );`,
            )

            // Pests and diseases reference
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS pestsAndDiseases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                affectedCrops TEXT,
                symptoms TEXT,
                treatments TEXT,
                imageUrl TEXT,
                localThreatLevel TEXT
              );`,
            )

            // Forum posts
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS forumPosts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author TEXT,
                authorLocation TEXT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                date TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                tags TEXT
              );`,
            )

            // Experts
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS experts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                specialty TEXT NOT NULL,
                organization TEXT,
                imageUrl TEXT,
                rating REAL,
                reviews INTEGER,
                contactInfo TEXT
              );`,
            )

            // Chat history
            tx.executeSql(
              `CREATE TABLE IF NOT EXISTS chatHistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL
              );`,
            )
          },
          (error) => {
            console.error("Error creating tables:", error)
            setError("Failed to initialize database")
            reject(error)
          },
          () => {
            console.log("Database initialized successfully")
            resolve()
          },
        )
      })

      // Check if we need to populate sample data
      await checkAndPopulateSampleData(database)

      setDb(database)
    } catch (err) {
      console.error("Database initialization error:", err)
      setError("Failed to initialize database")
    } finally {
      setIsLoading(false)
    }
  }

  const checkAndPopulateSampleData = async (database: SQLite.SQLiteDatabase) => {
    return new Promise<void>((resolve, reject) => {
      // Check if pests and diseases table is empty
      database.transaction(
        (tx) => {
          tx.executeSql(
            "SELECT COUNT(*) as count FROM pestsAndDiseases",
            [],
            (_, { rows }) => {
              const count = rows.item(0).count
              if (count === 0) {
                // Populate sample data
                populateSampleData(tx)
              }
              resolve()
            },
            (_, error) => {
              console.error("Error checking for sample data:", error)
              reject(error)
              return false
            },
          )
        },
        (error) => {
          console.error("Transaction error:", error)
          reject(error)
        },
      )
    })
  }

  const populateSampleData = (tx: SQLite.SQLTransaction) => {
    // Sample pests and diseases
    const pestsAndDiseases = [
      {
        name: "Tomato Blight",
        type: "disease",
        affectedCrops: "Tomato, Potato",
        symptoms: "Brown spots on leaves, stems, and fruits. Leaves may curl and wither.",
        treatments: "Copper-based fungicides, crop rotation, remove infected plants.",
        imageUrl: "https://www.gardeningknowhow.com/wp-content/uploads/2019/05/tomato-blight.jpg",
        localThreatLevel: "high",
      },
      {
        name: "Aphids",
        type: "pest",
        affectedCrops: "Tomato, Cabbage, Kale, Beans",
        symptoms: "Curling leaves, stunted growth, sticky residue on leaves.",
        treatments: "Neem oil, insecticidal soap, ladybugs as natural predators.",
        imageUrl: "https://www.gardeningknowhow.com/wp-content/uploads/2021/07/aphids-on-leaf.jpg",
        localThreatLevel: "medium",
      },
      {
        name: "Powdery Mildew",
        type: "disease",
        affectedCrops: "Squash, Cucumber, Pumpkin, Zucchini",
        symptoms: "White powdery spots on leaves and stems.",
        treatments: "Sulfur-based fungicides, milk spray (1:10 ratio with water), improve air circulation.",
        imageUrl: "https://www.gardeningknowhow.com/wp-content/uploads/2018/12/powdery-mildew.jpg",
        localThreatLevel: "medium",
      },
      {
        name: "Fall Armyworm",
        type: "pest",
        affectedCrops: "Maize, Sorghum, Rice",
        symptoms: "Ragged holes in leaves, sawdust-like frass, damage to whorls and tassels.",
        treatments: "Bt spray, neem oil, early planting, crop rotation.",
        imageUrl: "https://www.cabi.org/wp-content/uploads/fall-armyworm-1.jpg",
        localThreatLevel: "high",
      },
      {
        name: "Maize Streak Virus",
        type: "disease",
        affectedCrops: "Maize",
        symptoms: "Yellow streaks on leaves, stunted growth, poor cob development.",
        treatments: "No cure, control leafhoppers (vectors), plant resistant varieties.",
        imageUrl: "https://www.plantwise.org/KnowledgeBank/800x640/PMDG_97553.jpg",
        localThreatLevel: "medium",
      },
    ]

    // Sample forum posts
    const forumPosts = [
      {
        author: "John Moyo",
        authorLocation: "Harare",
        title: "Best practices for tomato growing in greenhouse",
        content:
          "I've been growing tomatoes in my greenhouse for 2 years now. Here are some tips that have worked well for me: 1) Maintain consistent watering schedule, 2) Use organic fertilizers, 3) Ensure good ventilation to prevent fungal diseases, 4) Prune regularly to improve air circulation. What practices have worked for you?",
        date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        likes: 24,
        comments: 8,
        tags: "greenhouse,tomatoes,tips",
      },
      {
        author: "Sarah Ndlovu",
        authorLocation: "Bulawayo",
        title: "Dealing with Fall Armyworm in maize",
        content:
          "My maize crop has been affected by Fall Armyworm. I've tried several methods to control it including neem oil spray and Bt spray. The Bt spray seems to be more effective but needs to be applied early. Has anyone had success with other methods?",
        date: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
        likes: 32,
        comments: 15,
        tags: "maize,pests,armyworm",
      },
      {
        author: "David Mutasa",
        authorLocation: "Mutare",
        title: "Water conservation techniques for dry season",
        content:
          "With the dry season approaching, I wanted to share some water conservation techniques that have helped me: 1) Mulching around plants, 2) Drip irrigation instead of sprinklers, 3) Watering early morning or evening to reduce evaporation, 4) Collecting rainwater during rainy season. What techniques do you use?",
        date: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
        likes: 45,
        comments: 12,
        tags: "water,conservation,drought",
      },
      {
        author: "Grace Chigumba",
        authorLocation: "Gweru",
        title: "Organic fertilizers for vegetable gardens",
        content:
          "I've been using organic fertilizers in my vegetable garden with great results. I make compost from kitchen scraps and garden waste, and also use manure from my chickens. My vegetables taste better and seem more resistant to pests. Anyone else using organic methods?",
        date: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
        likes: 38,
        comments: 9,
        tags: "organic,fertilizer,vegetables",
      },
    ]

    // Sample experts
    const experts = [
      {
        name: "Dr. Tendai Murisa",
        specialty: "Crop Science",
        organization: "University of Zimbabwe",
        imageUrl: "https://randomuser.me/api/portraits/men/1.jpg",
        rating: 4.8,
        reviews: 56,
        contactInfo: "tmurisa@uz.ac.zw",
      },
      {
        name: "Eng. Farai Mapondera",
        specialty: "Irrigation Systems",
        organization: "Agricultural Research Council",
        imageUrl: "https://randomuser.me/api/portraits/men/2.jpg",
        rating: 4.7,
        reviews: 42,
        contactInfo: "fmapondera@arc.org.zw",
      },
      {
        name: "Dr. Nyasha Chikwamba",
        specialty: "Livestock Management",
        organization: "Veterinary Services",
        imageUrl: "https://randomuser.me/api/portraits/women/3.jpg",
        rating: 4.9,
        reviews: 63,
        contactInfo: "nchikwamba@vet.gov.zw",
      },
    ]

    // Sample tasks
    const tasks = [
      {
        title: "Water tomatoes",
        description: "Water tomato plants in greenhouse",
        dueDate: new Date().toISOString(),
        completed: 0,
        relatedTo: "crop",
        relatedId: 1,
        priority: "high",
      },
      {
        title: "Apply fertilizer to maize",
        description: "Apply NPK fertilizer to maize field",
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        completed: 0,
        relatedTo: "crop",
        relatedId: 2,
        priority: "medium",
      },
      {
        title: "Check greenhouse humidity",
        description: "Ensure proper humidity levels in greenhouse",
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        completed: 1,
        relatedTo: "field",
        relatedId: 1,
        priority: "medium",
      },
      {
        title: "Harvest ripe tomatoes",
        description: "Harvest ripe tomatoes from greenhouse",
        dueDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        completed: 0,
        relatedTo: "crop",
        relatedId: 1,
        priority: "high",
      },
      {
        title: "Spray pesticides on cabbage",
        description: "Apply organic pesticide to cabbage plants",
        dueDate: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        completed: 0,
        relatedTo: "crop",
        relatedId: 3,
        priority: "low",
      },
    ]

    // Sample records (financial)
    const records = [
      {
        date: new Date().toISOString(),
        type: "expense",
        category: "seeds",
        amount: 50,
        description: "Purchased tomato seeds",
        relatedTo: "crop",
        relatedId: 1,
      },
      {
        date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        type: "expense",
        category: "fertilizer",
        amount: 120,
        description: "NPK fertilizer for maize",
        relatedTo: "crop",
        relatedId: 2,
      },
      {
        date: new Date(Date.now() - 5 * 86400000).toISOString(), // 5 days ago
        type: "income",
        category: "sales",
        amount: 200,
        description: "Sold tomatoes at local market",
        relatedTo: "crop",
        relatedId: 1,
      },
      {
        date: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
        type: "expense",
        category: "pesticide",
        amount: 75,
        description: "Organic pesticide for vegetables",
        relatedTo: "field",
        relatedId: 1,
      },
      {
        date: new Date(Date.now() - 15 * 86400000).toISOString(), // 15 days ago
        type: "expense",
        category: "equipment",
        amount: 300,
        description: "New irrigation pipes",
        relatedTo: "field",
        relatedId: 2,
      },
      {
        date: new Date(Date.now() - 20 * 86400000).toISOString(), // 20 days ago
        type: "income",
        category: "sales",
        amount: 350,
        description: "Sold maize to local buyer",
        relatedTo: "crop",
        relatedId: 2,
      },
    ]

    // Insert sample pests and diseases
    pestsAndDiseases.forEach((item) => {
      tx.executeSql(
        `INSERT INTO pestsAndDiseases (name, type, affectedCrops, symptoms, treatments, imageUrl, localThreatLevel) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.name,
          item.type,
          item.affectedCrops,
          item.symptoms,
          item.treatments,
          item.imageUrl,
          item.localThreatLevel,
        ],
      )
    })

    // Insert sample forum posts
    forumPosts.forEach((post) => {
      tx.executeSql(
        `INSERT INTO forumPosts (author, authorLocation, title, content, date, likes, comments, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [post.author, post.authorLocation, post.title, post.content, post.date, post.likes, post.comments, post.tags],
      )
    })

    // Insert sample experts
    experts.forEach((expert) => {
      tx.executeSql(
        `INSERT INTO experts (name, specialty, organization, imageUrl, rating, reviews, contactInfo) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          expert.name,
          expert.specialty,
          expert.organization,
          expert.imageUrl,
          expert.rating,
          expert.reviews,
          expert.contactInfo,
        ],
      )
    })

    // Insert sample tasks
    tasks.forEach((task) => {
      tx.executeSql(
        `INSERT INTO tasks (title, description, dueDate, completed, relatedTo, relatedId, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [task.title, task.description, task.dueDate, task.completed, task.relatedTo, task.relatedId, task.priority],
      )
    })

    // Insert sample records
    records.forEach((record) => {
      tx.executeSql(
        `INSERT INTO records (date, type, category, amount, description, relatedTo, relatedId) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.date,
          record.type,
          record.category,
          record.amount,
          record.description,
          record.relatedTo,
          record.relatedId,
        ],
      )
    })

    console.log("Sample data populated successfully")
  }

  const resetDatabase = async () => {
    if (!db) return

    setIsLoading(true)
    try {
      await new Promise<void>((resolve, reject) => {
        db.transaction(
          (tx) => {
            // Drop all tables
            tx.executeSql("DROP TABLE IF EXISTS settings")
            tx.executeSql("DROP TABLE IF EXISTS crops")
            tx.executeSql("DROP TABLE IF EXISTS livestock")
            tx.executeSql("DROP TABLE IF EXISTS fields")
            tx.executeSql("DROP TABLE IF EXISTS pens")
            tx.executeSql("DROP TABLE IF EXISTS tasks")
            tx.executeSql("DROP TABLE IF EXISTS records")
            tx.executeSql("DROP TABLE IF EXISTS weatherCache")
            tx.executeSql("DROP TABLE IF EXISTS pestsAndDiseases")
            tx.executeSql("DROP TABLE IF EXISTS forumPosts")
            tx.executeSql("DROP TABLE IF EXISTS experts")
            tx.executeSql("DROP TABLE IF EXISTS chatHistory")
          },
          (error) => {
            console.error("Error dropping tables:", error)
            reject(error)
          },
          () => {
            console.log("Database reset successfully")
            resolve()
          },
        )
      })

      // Reinitialize the database
      await initDatabase()
    } catch (err) {
      console.error("Database reset error:", err)
      setError("Failed to reset database")
    } finally {
      setIsLoading(false)
    }
  }

  return <DatabaseContext.Provider value={{ db, isLoading, error, resetDatabase }}>{children}</DatabaseContext.Provider>
}
