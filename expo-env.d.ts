/// <reference types="expo" />

declare module "@env" {
  export const OPENAI_API_KEY: string
  export const OPENWEATHER_API_KEY: string
  export const EXPO_PUBLIC_OPENAI_API_KEY: string
  export const EXPO_PUBLIC_OPENWEATHER_API_KEY: string
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      OPENAI_API_KEY: string
      OPENWEATHER_API_KEY: string
      EXPO_PUBLIC_OPENAI_API_KEY: string
      EXPO_PUBLIC_OPENWEATHER_API_KEY: string
    }
  }
}
