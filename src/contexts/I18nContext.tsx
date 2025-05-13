"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Localization from "expo-localization"

// Define supported languages
const LANGUAGES = {
  en: "English",
  sn: "Shona",
  nd: "Ndebele",
}

// Translations
const translations = {
  en: {
    dashboard: "Dashboard",
    planner: "Planner",
    weather: "Weather",
    pestGuide: "Pest Guide",
    logbook: "Logbook",
    community: "Community",
    settings: "Settings",
    welcome: "Welcome to MindaHub",
    welcomeSubtitle: "Your Smart Farm Assistant",
    getStarted: "Get Started",
    login: "Login",
    register: "Register",
    farmingType: "Farming Type",
    greenhouse: "Greenhouse",
    openField: "Open Field",
    location: "Location",
    selectProvince: "Select Province",
    selectDistrict: "Select District",
    next: "Next",
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    email: "Email",
    password: "Password",
    name: "Name",
    phone: "Phone",
    forgotPassword: "Forgot Password?",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    signUp: "Sign Up",
    signIn: "Sign In",
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    logout: "Logout",
    todayTasks: "Today's Tasks",
    weatherForecast: "Weather Forecast",
    cropStatus: "Crop Status",
    livestockStatus: "Livestock Status",
    alerts: "Alerts",
    viewAll: "View All",
    addCrop: "Add Crop",
    addLivestock: "Add Livestock",
    addTask: "Add Task",
    addRecord: "Add Record",
    cropCalendar: "Crop Calendar",
    livestockCalendar: "Livestock Calendar",
    tasks: "Tasks",
    currentWeather: "Current Weather",
    forecast: "Forecast",
    humidity: "Humidity",
    rainfall: "Rainfall",
    temperature: "Temperature",
    wind: "Wind",
    pests: "Pests",
    diseases: "Diseases",
    treatments: "Treatments",
    identifyPest: "Identify Pest",
    records: "Records",
    expenses: "Expenses",
    income: "Income",
    yields: "Yields",
    fields: "Fields",
    livestock: "Livestock",
    addField: "Add Field",
    addPen: "Add Pen",
    forum: "Forum",
    askExpert: "Ask Expert",
    askAI: "Ask AI",
    notifications: "Notifications",
    profile: "Profile",
    about: "About",
    help: "Help",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
  },
  sn: {
    dashboard: "Bhodi Rekutanga",
    planner: "Murongwa",
    weather: "Mamiriro eKunze",
    pestGuide: "Zvikwekwe",
    logbook: "Bhuku Rezvakaitwa",
    community: "Vanhu",
    settings: "Zvimiso",
    welcome: "Mauya kuMindaHub",
    welcomeSubtitle: "Mubatsiri Wenyu Wekurima",
    getStarted: "Tangai",
    login: "Pindai",
    register: "Nyoresai",
    farmingType: "Mhando Yekurima",
    greenhouse: "Muimba Yemiriwo",
    openField: "Mumunda",
    location: "Nzvimbo",
    selectProvince: "Sarudza Dunhu",
    selectDistrict: "Sarudza Nzvimbo",
    next: "Enderera",
    back: "Dzokera",
    save: "Chengetedza",
    cancel: "Kanzura",
    email: "Imero",
    password: "Pasiwedhi",
    name: "Zita",
    phone: "Runhare",
    forgotPassword: "Wakanganwa Pasiwedhi?",
    noAccount: "Hauna Akaundi?",
    haveAccount: "Une Akaundi?",
    signUp: "Nyoresa",
    signIn: "Pinda",
    language: "Mutauro",
    theme: "Mavara",
    light: "Chena",
    dark: "Dema",
    system: "Sisitimu",
    logout: "Buda",
    todayTasks: "Mabasa eNhasi",
    weatherForecast: "Mamiriro eKunze",
    cropStatus: "Mamiriro eMiriwo",
    livestockStatus: "Mamiriro eZvipfuwo",
    alerts: "Yambiro",
    viewAll: "Ona Zvose",
    addCrop: "Wedzera Mbeu",
    addLivestock: "Wedzera Chipfuwo",
    addTask: "Wedzera Basa",
    addRecord: "Wedzera Chinyorwa",
    cropCalendar: "Kalendari yeMbeu",
    livestockCalendar: "Kalendari yeZvipfuwo",
    tasks: "Mabasa",
    currentWeather: "Mamiriro eKunze Zvino",
    forecast: "Ongororo",
    humidity: "Mwando",
    rainfall: "Mvura",
    temperature: "Kupisa",
    wind: "Mhepo",
    pests: "Zvikwekwe",
    diseases: "Zvirwere",
    treatments: "Mishonga",
    identifyPest: "Ziva Chikwekwe",
    records: "Zvinyorwa",
    expenses: "Mari Yakashandiswa",
    income: "Mari Yawanikwa",
    yields: "Goho",
    fields: "Minda",
    livestock: "Zvipfuwo",
    addField: "Wedzera Munda",
    addPen: "Wedzera Danga",
    forum: "Hurukuro",
    askExpert: "Bvunza Nyanzvi",
    askAI: "Bvunza AI",
    notifications: "Mashoko",
    profile: "Rondedzero",
    about: "Nezvedu",
    help: "Rubatsiro",
    privacyPolicy: "Zvakavanzika",
    termsOfService: "Mitemo",
  },
  nd: {
    dashboard: "Ibhodi",
    planner: "Uhlelo",
    weather: "Isimo Sezulu",
    pestGuide: "Izinambuzane",
    logbook: "Ibhuku Lemisebenzi",
    community: "Umphakathi",
    settings: "Izilungiselelo",
    welcome: "Siyakwamukela kuMindaHub",
    welcomeSubtitle: "Umsizi Wakho Welimo",
    getStarted: "Qalisa",
    login: "Ngena",
    register: "Bhalisisa",
    farmingType: "Uhlobo Lwelimo",
    greenhouse: "Indlu Yezilimo",
    openField: "Insimu",
    location: "Indawo",
    selectProvince: "Khetha Isifunda",
    selectDistrict: "Khetha Indawo",
    next: "Okulandelayo",
    back: "Buyela",
    save: "Gcina",
    cancel: "Khansela",
    email: "I-imeyili",
    password: "Iphasiwedi",
    name: "Ibizo",
    phone: "Ucingo",
    forgotPassword: "Ukhohlwe Yiphasiwedi?",
    noAccount: "Awulakhawunti?",
    haveAccount: "Ulakhawunti?",
    signUp: "Bhalisisa",
    signIn: "Ngena",
    language: "Ulimi",
    theme: "Umbala",
    light: "Ukukhanya",
    dark: "Ubumnyama",
    system: "Isistimu",
    logout: "Phuma",
    todayTasks: "Imisebenzi Yanamuhla",
    weatherForecast: "Isimo Sezulu",
    cropStatus: "Isimo Sezilimo",
    livestockStatus: "Isimo Sezifuyo",
    alerts: "Izexwayiso",
    viewAll: "Bona Konke",
    addCrop: "Engeza Isilimo",
    addLivestock: "Engeza Isifuyo",
    addTask: "Engeza Umsebenzi",
    addRecord: "Engeza Umbhalo",
    cropCalendar: "Ikhalenda Yezilimo",
    livestockCalendar: "Ikhalenda Yezifuyo",
    tasks: "Imisebenzi",
    currentWeather: "Isimo Sezulu Manje",
    forecast: "Isibikezelo",
    humidity: "Umswakama",
    rainfall: "Imvula",
    temperature: "Izinga Lokushisa",
    wind: "Umoya",
    pests: "Izinambuzane",
    diseases: "Izifo",
    treatments: "Imithi",
    identifyPest: "Hlonza Inambuzane",
    records: "Amarekhodi",
    expenses: "Izindleko",
    income: "Imali Engenayo",
    yields: "Isivuno",
    fields: "Amasimu",
    livestock: "Izifuyo",
    addField: "Engeza Insimu",
    addPen: "Engeza Isibaya",
    forum: "Inkundla",
    askExpert: "Buza Uchwepheshe",
    askAI: "Buza I-AI",
    notifications: "Izaziso",
    profile: "Iphrofayili",
    about: "Ngathi",
    help: "Usizo",
    privacyPolicy: "Inqubomgomo Yemfihlo",
    termsOfService: "Imigomo Yesevisi",
  },
}

type I18nContextType = {
  t: (key: string) => string
  locale: string
  setLocale: (locale: string) => void
  languages: typeof LANGUAGES
}

const I18nContext = createContext<I18nContextType>({
  t: () => "",
  locale: "en",
  setLocale: () => {},
  languages: LANGUAGES,
})

export const useTranslation = () => useContext(I18nContext)

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState("en")

  useEffect(() => {
    // Load saved language preference or use device locale
    const loadLocale = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem("locale")
        if (savedLocale && Object.keys(translations).includes(savedLocale)) {
          setLocale(savedLocale)
        } else {
          // Use device locale if available and supported
          const deviceLocale = Localization.locale.split("-")[0]
          if (Object.keys(translations).includes(deviceLocale)) {
            setLocale(deviceLocale)
          }
        }
      } catch (error) {
        console.error("Failed to load language preference:", error)
      }
    }

    loadLocale()
  }, [])

  const changeLocale = async (newLocale: string) => {
    setLocale(newLocale)
    try {
      await AsyncStorage.setItem("locale", newLocale)
    } catch (error) {
      console.error("Failed to save language preference:", error)
    }
  }

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations.en[key] || key
  }

  return (
    <I18nContext.Provider value={{ t, locale, setLocale: changeLocale, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  )
}
