import AsyncStorage from "@react-native-async-storage/async-storage"

// Task operations
export const getTasks = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM tasks ORDER BY dueDate ASC",
        [],
        (_, { rows }) => {
          resolve(rows._array)
        },
        (_, error) => {
          console.error("Error fetching tasks:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const addTask = (db, task) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO tasks (title, description, dueDate, completed, relatedTo, relatedId, priority) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          task.title,
          task.description,
          task.dueDate,
          task.completed ? 1 : 0,
          task.relatedTo,
          task.relatedId,
          task.priority,
        ],
        (_, { insertId }) => {
          resolve({ ...task, id: insertId })
        },
        (_, error) => {
          console.error("Error adding task:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const updateTask = (db, task) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        `UPDATE tasks SET 
         title = ?, 
         description = ?, 
         dueDate = ?, 
         completed = ?, 
         relatedTo = ?, 
         relatedId = ?, 
         priority = ? 
         WHERE id = ?`,
        [
          task.title,
          task.description,
          task.dueDate,
          task.completed ? 1 : 0,
          task.relatedTo,
          task.relatedId,
          task.priority,
          task.id,
        ],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            resolve(task)
          } else {
            reject("Task not found")
          }
        },
        (_, error) => {
          console.error("Error updating task:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const deleteTask = (db, taskId) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM tasks WHERE id = ?",
        [taskId],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            resolve(taskId)
          } else {
            reject("Task not found")
          }
        },
        (_, error) => {
          console.error("Error deleting task:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const toggleTaskCompletion = (db, taskId, completed) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE tasks SET completed = ? WHERE id = ?",
        [completed ? 1 : 0, taskId],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            resolve({ id: taskId, completed })
          } else {
            reject("Task not found")
          }
        },
        (_, error) => {
          console.error("Error toggling task completion:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

// Record operations
export const getRecords = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM records ORDER BY date DESC",
        [],
        (_, { rows }) => {
          resolve(rows._array)
        },
        (_, error) => {
          console.error("Error fetching records:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const addRecord = (db, record) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
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
        (_, { insertId }) => {
          resolve({ ...record, id: insertId })
        },
        (_, error) => {
          console.error("Error adding record:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const deleteRecord = (db, recordId) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "DELETE FROM records WHERE id = ?",
        [recordId],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            resolve(recordId)
          } else {
            reject("Record not found")
          }
        },
        (_, error) => {
          console.error("Error deleting record:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

// Forum operations
export const getForumPosts = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM forumPosts ORDER BY date DESC",
        [],
        (_, { rows }) => {
          resolve(rows._array)
        },
        (_, error) => {
          console.error("Error fetching forum posts:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const addForumPost = (db, post) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO forumPosts (author, authorLocation, title, content, date, likes, comments, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          post.author,
          post.authorLocation,
          post.title,
          post.content,
          post.date || new Date().toISOString(),
          post.likes || 0,
          post.comments || 0,
          post.tags,
        ],
        (_, { insertId }) => {
          resolve({ ...post, id: insertId })
        },
        (_, error) => {
          console.error("Error adding forum post:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

// User settings operations
export const saveUserSettings = async (settings) => {
  try {
    for (const [key, value] of Object.entries(settings)) {
      await AsyncStorage.setItem(key, value.toString())
    }
    return true
  } catch (error) {
    console.error("Error saving user settings:", error)
    return false
  }
}

export const getUserSettings = async () => {
  try {
    const farmingType = await AsyncStorage.getItem("farmingType")
    const province = await AsyncStorage.getItem("province")
    const district = await AsyncStorage.getItem("district")
    const language = await AsyncStorage.getItem("language")
    const theme = await AsyncStorage.getItem("theme")

    return {
      farmingType,
      province,
      district,
      language,
      theme,
    }
  } catch (error) {
    console.error("Error getting user settings:", error)
    return {}
  }
}

// Crop operations
export const getCrops = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM crops",
        [],
        (_, { rows }) => {
          resolve(rows._array)
        },
        (_, error) => {
          console.error("Error fetching crops:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

export const addCrop = (db, crop) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO crops (name, variety, fieldId, plantingDate, harvestDate, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [crop.name, crop.variety, crop.fieldId, crop.plantingDate, crop.harvestDate, crop.status, crop.notes],
        (_, { insertId }) => {
          resolve({ ...crop, id: insertId })
        },
        (_, error) => {
          console.error("Error adding crop:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

// Pest and disease operations
export const getPestsAndDiseases = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM pestsAndDiseases",
        [],
        (_, { rows }) => {
          resolve(rows._array)
        },
        (_, error) => {
          console.error("Error fetching pests and diseases:", error)
          reject(error)
          return false
        },
      )
    })
  })
}

// Expert operations
export const getExperts = (db) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM experts ORDER BY rating DESC",
        [],
        (_, { rows }) => {
          resolve(rows._array)
        },
        (_, error) => {
          console.error("Error fetching experts:", error)
          reject(error)
          return false
        },
      )
    })
  })
}
