"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native"
import { Camera } from "expo-camera"
import * as ImagePicker from "expo-image-picker"
import * as ImageManipulator from "expo-image-manipulator"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useTheme } from "../contexts/ThemeContext"
import { useTranslation } from "../contexts/I18nContext"
import { identifyPest } from "../services/openai"

export default function PestIdentificationScreen() {
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { t } = useTranslation()

  const [hasPermission, setHasPermission] = useState(null)
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back)
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const cameraRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === "granted")

      const imagePickerStatus = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (imagePickerStatus.status !== "granted") {
        Alert.alert("Permission required", "Sorry, we need camera roll permissions to make this work!")
      }
    })()
  }, [])

  const onCameraReady = () => {
    setIsCameraReady(true)
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync()

        // Resize and compress the image
        const manipResult = await ImageManipulator.manipulateAsync(photo.uri, [{ resize: { width: 800 } }], {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        })

        setCapturedImage(manipResult)
      } catch (error) {
        console.error("Error taking picture:", error)
        Alert.alert("Error", "Failed to take picture. Please try again.")
      }
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      })

      if (!result.canceled) {
        // Resize and compress the image
        const manipResult = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 800 } }], {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        })

        setCapturedImage(manipResult)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const analyzeImage = async () => {
    if (!capturedImage) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      // Convert image to base64
      const response = await fetch(capturedImage.uri)
      const blob = await response.blob()

      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Image = reader.result.toString().split(",")[1]

            // Send to OpenAI for analysis
            const identificationResult = await identifyPest(base64Image)

            setResult(identificationResult)
            resolve(identificationResult)
          } catch (error) {
            console.error("Error analyzing image:", error)
            setResult({ error: "Failed to analyze image. Please try again." })
            reject(error)
          } finally {
            setIsAnalyzing(false)
          }
        }
        reader.onerror = (error) => {
          console.error("FileReader error:", error)
          setIsAnalyzing(false)
          setResult({ error: "Failed to process image. Please try again." })
          reject(error)
        }
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error("Error in analyzeImage:", error)
      setIsAnalyzing(false)
      setResult({ error: "Failed to analyze image. Please try again." })
    }
  }

  const resetCamera = () => {
    setCapturedImage(null)
    setResult(null)
  }

  if (hasPermission === null) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text, marginTop: 20 }]}>Requesting camera permission...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Ionicons name="camera-off" size={50} color={colors.error} />
        <Text style={[styles.text, { color: colors.text, marginTop: 20, textAlign: "center" }]}>
          No access to camera. Please enable camera permissions in your device settings.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t("identifyPest")}</Text>
        <View style={styles.placeholder} />
      </View>

      {!capturedImage ? (
        <View style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
            flashMode={flash}
            onCameraReady={onCameraReady}
            ratio="4:3"
          />

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setCameraType(
                  cameraType === Camera.Constants.Type.back ? Camera.Constants.Type.front : Camera.Constants.Type.back,
                )
              }}
            >
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture} disabled={!isCameraReady}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setFlash(
                  flash === Camera.Constants.FlashMode.off
                    ? Camera.Constants.FlashMode.on
                    : Camera.Constants.FlashMode.off,
                )
              }}
            >
              <Ionicons
                name={flash === Camera.Constants.FlashMode.off ? "flash-off" : "flash"}
                size={28}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.galleryButton, { backgroundColor: colors.primary }]} onPress={pickImage}>
            <Ionicons name="images" size={22} color="white" />
            <Text style={styles.galleryButtonText}>Gallery</Text>
          </TouchableOpacity>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>Take a clear photo of the pest or affected plant part</Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.resultContainer}>
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />

            <View style={styles.previewControls}>
              <TouchableOpacity style={[styles.previewButton, { backgroundColor: colors.error }]} onPress={resetCamera}>
                <Ionicons name="close" size={22} color="white" />
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>

              {!result && (
                <TouchableOpacity
                  style={[styles.previewButton, { backgroundColor: colors.primary }]}
                  onPress={analyzeImage}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <ActivityIndicator size="small" color="white" />
                      <Text style={styles.previewButtonText}>Analyzing...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="search" size={22} color="white" />
                      <Text style={styles.previewButtonText}>Identify</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isAnalyzing && (
            <View style={[styles.analysisContainer, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analysisText, { color: colors.text }]}>
                Analyzing image... This may take a moment.
              </Text>
            </View>
          )}

          {result && !result.error && (
            <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.resultTitle, { color: colors.text }]}>Identification Result</Text>

              <Text style={[styles.resultText, { color: colors.text }]}>{result.identification}</Text>

              <View style={styles.confidenceContainer}>
                <Text style={[styles.confidenceLabel, { color: colors.text + "AA" }]}>Confidence:</Text>
                <View style={[styles.confidenceBar, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.confidenceFill,
                      {
                        width: `${result.confidence * 100}%`,
                        backgroundColor:
                          result.confidence > 0.7
                            ? colors.success
                            : result.confidence > 0.5
                              ? colors.warning
                              : colors.error,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.confidenceValue, { color: colors.text }]}>
                  {Math.round(result.confidence * 100)}%
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // Navigate to pest guide with this pest
                  navigation.navigate("PestGuide" as never)
                }}
              >
                <Text style={styles.actionButtonText}>View Treatment Options</Text>
              </TouchableOpacity>
            </View>
          )}

          {result && result.error && (
            <View style={[styles.errorCard, { backgroundColor: colors.error + "20" }]}>
              <Ionicons name="alert-circle" size={40} color={colors.error} />
              <Text style={[styles.errorTitle, { color: colors.error }]}>Analysis Failed</Text>
              <Text style={[styles.errorText, { color: colors.text }]}>{result.error}</Text>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary, marginTop: 20 }]}
                onPress={analyzeImage}
              >
                <Text style={styles.actionButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
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
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  galleryButton: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  galleryButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "500",
  },
  instructionContainer: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "white",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
  },
  resultContainer: {
    flex: 1,
  },
  imagePreviewContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  previewButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "500",
  },
  analysisContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  analysisText: {
    marginTop: 15,
    textAlign: "center",
  },
  resultCard: {
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  confidenceLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  confidenceFill: {
    height: "100%",
  },
  confidenceValue: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "bold",
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  errorCard: {
    margin: 20,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
})
