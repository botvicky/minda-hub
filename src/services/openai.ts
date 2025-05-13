import OpenAI from "openai"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"

// Get the API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || Constants.expoConfig?.extra?.OPENAI_API_KEY

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // For React Native
})

export async function askAI(question: string): Promise<string> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured")
    }

    // Get user context from AsyncStorage
    const farmingType = (await AsyncStorage.getItem("farmingType")) || "unknown"
    const province = (await AsyncStorage.getItem("province")) || "unknown"
    const district = (await AsyncStorage.getItem("district")) || "unknown"

    // Create a system message with context
    const systemMessage = `You are an agricultural assistant for farmers in Zimbabwe. 
    The farmer you're helping uses ${farmingType} farming and is located in ${district}, ${province}. 
    Provide specific, practical advice relevant to their location and farming type. 
    Keep responses concise and focused on farming in Zimbabwe.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response."
  } catch (error) {
    console.error("Error asking AI:", error)
    return "Sorry, I encountered an error. Please check your internet connection and try again."
  }
}

export async function identifyPest(imageBase64: string): Promise<any> {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured")
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in agricultural pest identification for Zimbabwe. Identify the pest or disease in the image and provide treatment recommendations specific to Zimbabwe.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "What pest or disease is this? Provide identification details and treatment options.",
            },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 500,
    })

    return {
      identification: response.choices[0].message.content,
      confidence: 0.85, // Placeholder for confidence score
    }
  } catch (error) {
    console.error("Error identifying pest:", error)
    throw new Error("Failed to identify pest. Please try again.")
  }
}
