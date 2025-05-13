import AsyncStorage from "@react-native-async-storage/async-storage"

// Zimbabwe's seasons
const SEASONS = {
  RAINY: "rainy", // November to March
  COOL_DRY: "cool_dry", // April to July
  HOT_DRY: "hot_dry", // August to October
}

// Zimbabwe's agricultural regions
const REGIONS = {
  REGION_1: ["Nyanga", "Mutare", "Chimanimani"],
  REGION_2: ["Harare", "Marondera", "Bindura", "Chinhoyi", "Gweru"],
  REGION_3: ["Masvingo", "Chegutu", "Kadoma", "Kwekwe"],
  REGION_4: ["Bulawayo", "Gwanda", "Beitbridge", "Chiredzi"],
  REGION_5: ["Binga", "Kariba", "Hwange"],
}

// Crop database with suitability by region and season
const CROPS_DATABASE = [
  {
    name: "Maize",
    regions: ["REGION_1", "REGION_2", "REGION_3"],
    seasons: [SEASONS.RAINY],
    greenhouseSuitable: true,
    openFieldSuitable: true,
    waterRequirement: "medium",
    growthDuration: 120, // days
    description: "Staple crop in Zimbabwe, requires good rainfall or irrigation.",
    tips: "Plant when soil is moist. Space plants 25-30cm apart with 75-90cm between rows.",
  },
  {
    name: "Tomatoes",
    regions: ["REGION_1", "REGION_2", "REGION_3", "REGION_4"],
    seasons: [SEASONS.RAINY, SEASONS.COOL_DRY, SEASONS.HOT_DRY],
    greenhouseSuitable: true,
    openFieldSuitable: true,
    waterRequirement: "high",
    growthDuration: 90, // days
    description: "High-value crop that grows well in most regions with proper care.",
    tips: "In greenhouses, can be grown year-round. In open fields, best during cooler months.",
  },
  {
    name: "Wheat",
    regions: ["REGION_1", "REGION_2"],
    seasons: [SEASONS.COOL_DRY],
    greenhouseSuitable: false,
    openFieldSuitable: true,
    waterRequirement: "medium",
    growthDuration: 120, // days
    description: "Winter crop grown after the rainy season.",
    tips: "Plant from April to May. Requires irrigation in most areas.",
  },
  {
    name: "Groundnuts",
    regions: ["REGION_2", "REGION_3", "REGION_4"],
    seasons: [SEASONS.RAINY],
    greenhouseSuitable: false,
    openFieldSuitable: true,
    waterRequirement: "medium",
    growthDuration: 130, // days
    description: "Important legume crop that improves soil fertility.",
    tips: "Plant at the onset of rains. Avoid waterlogged soils.",
  },
  {
    name: "Sweet Potatoes",
    regions: ["REGION_1", "REGION_2", "REGION_3", "REGION_4"],
    seasons: [SEASONS.RAINY, SEASONS.COOL_DRY],
    greenhouseSuitable: false,
    openFieldSuitable: true,
    waterRequirement: "low",
    growthDuration: 150, // days
    description: "Drought-tolerant crop with good nutritional value.",
    tips: "Can be planted throughout the year with irrigation. Drought resistant.",
  },
  {
    name: "Cabbage",
    regions: ["REGION_1", "REGION_2", "REGION_3"],
    seasons: [SEASONS.COOL_DRY, SEASONS.HOT_DRY],
    greenhouseSuitable: true,
    openFieldSuitable: true,
    waterRequirement: "high",
    growthDuration: 90, // days
    description: "Popular vegetable that grows well in cooler weather.",
    tips: "Best grown in the cool season. Requires regular watering and pest management.",
  },
  {
    name: "Onions",
    regions: ["REGION_1", "REGION_2", "REGION_3"],
    seasons: [SEASONS.COOL_DRY],
    greenhouseSuitable: true,
    openFieldSuitable: true,
    waterRequirement: "medium",
    growthDuration: 150, // days
    description: "High-value crop that stores well.",
    tips: "Plant in April-May. Harvest when tops fall over and begin to dry.",
  },
  {
    name: "Sorghum",
    regions: ["REGION_3", "REGION_4", "REGION_5"],
    seasons: [SEASONS.RAINY],
    greenhouseSuitable: false,
    openFieldSuitable: true,
    waterRequirement: "low",
    growthDuration: 120, // days
    description: "Drought-tolerant grain crop suitable for drier regions.",
    tips: "More drought-tolerant than maize. Good for food security in dry areas.",
  },
  {
    name: "Beans",
    regions: ["REGION_1", "REGION_2", "REGION_3"],
    seasons: [SEASONS.RAINY, SEASONS.COOL_DRY],
    greenhouseSuitable: true,
    openFieldSuitable: true,
    waterRequirement: "medium",
    growthDuration: 90, // days
    description: "Important source of protein and soil improvement.",
    tips: "Can be intercropped with maize. Fixes nitrogen in the soil.",
  },
  {
    name: "Peppers",
    regions: ["REGION_1", "REGION_2", "REGION_3"],
    seasons: [SEASONS.RAINY, SEASONS.COOL_DRY, SEASONS.HOT_DRY],
    greenhouseSuitable: true,
    openFieldSuitable: true,
    waterRequirement: "medium",
    growthDuration: 90, // days
    description: "High-value crop that grows well in greenhouses.",
    tips: "Greenhouse production allows year-round growing. Good crop rotation with tomatoes.",
  },
]

// Get current season based on date
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1 // JavaScript months are 0-indexed

  if (month >= 11 || month <= 3) {
    return SEASONS.RAINY
  } else if (month >= 4 && month <= 7) {
    return SEASONS.COOL_DRY
  } else {
    return SEASONS.HOT_DRY
  }
}

// Determine agricultural region based on district
function getRegionForDistrict(district: string): string | null {
  for (const [region, districts] of Object.entries(REGIONS)) {
    if (districts.includes(district)) {
      return region
    }
  }
  return null
}

// Get recommended crops based on user's location, farming type, and current season
export async function getRecommendedCrops() {
  try {
    const farmingType = (await AsyncStorage.getItem("farmingType")) || ""
    const district = (await AsyncStorage.getItem("district")) || ""

    const currentSeason = getCurrentSeason()
    const region = getRegionForDistrict(district)

    let recommendedCrops = CROPS_DATABASE.filter((crop) => {
      // Filter by season
      const seasonMatch = crop.seasons.includes(currentSeason)

      // Filter by farming type
      const farmingTypeMatch =
        (farmingType === "greenhouse" && crop.greenhouseSuitable) ||
        (farmingType === "openField" && crop.openFieldSuitable)

      // Filter by region if we have a match
      const regionMatch = region ? crop.regions.includes(region) : true

      return seasonMatch && farmingTypeMatch && regionMatch
    })

    // Sort by suitability (more matching criteria = higher score)
    recommendedCrops = recommendedCrops.sort((a, b) => {
      const scoreA =
        (a.seasons.includes(currentSeason) ? 2 : 0) +
        (region && a.regions.includes(region) ? 2 : 0) +
        (farmingType === "greenhouse" && a.greenhouseSuitable ? 1 : 0) +
        (farmingType === "openField" && a.openFieldSuitable ? 1 : 0)

      const scoreB =
        (b.seasons.includes(currentSeason) ? 2 : 0) +
        (region && b.regions.includes(region) ? 2 : 0) +
        (farmingType === "greenhouse" && b.greenhouseSuitable ? 1 : 0) +
        (farmingType === "openField" && b.openFieldSuitable ? 1 : 0)

      return scoreB - scoreA
    })

    return recommendedCrops
  } catch (error) {
    console.error("Error getting crop recommendations:", error)
    return []
  }
}

// Get planting calendar for a specific crop
export function getPlantingCalendar(cropName: string) {
  const crop = CROPS_DATABASE.find((c) => c.name === cropName)
  if (!crop) return null

  const currentMonth = new Date().getMonth() + 1
  const plantingMonths = []

  // Determine planting months based on seasons
  if (crop.seasons.includes(SEASONS.RAINY)) {
    plantingMonths.push(...[11, 12, 1]) // November, December, January
  }

  if (crop.seasons.includes(SEASONS.COOL_DRY)) {
    plantingMonths.push(...[4, 5]) // April, May
  }

  if (crop.seasons.includes(SEASONS.HOT_DRY)) {
    plantingMonths.push(...[8, 9]) // August, September
  }

  // Calculate next planting month
  let nextPlantingMonth = null
  for (const month of plantingMonths) {
    if (month >= currentMonth) {
      nextPlantingMonth = month
      break
    }
  }

  // If no future month found, take the first month (next year)
  if (nextPlantingMonth === null && plantingMonths.length > 0) {
    nextPlantingMonth = plantingMonths[0]
  }

  // Convert month number to name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  return {
    crop: crop.name,
    bestPlantingMonths: plantingMonths.map((m) => monthNames[m - 1]),
    nextPlantingMonth: nextPlantingMonth ? monthNames[nextPlantingMonth - 1] : null,
    growthDuration: crop.growthDuration,
    tips: crop.tips,
    waterRequirement: crop.waterRequirement,
  }
}
