# MindaHub - Agricultural Assistant for Zimbabwean Farmers

MindaHub is a comprehensive mobile application designed to assist farmers in Zimbabwe with agricultural information, weather forecasts, pest identification, and community support.

## Features

- **Weather Forecasting**: Real-time weather data and agricultural alerts
- **Crop Recommendations**: Personalized crop suggestions based on location and season
- **Pest Identification**: AI-powered pest and disease identification using camera
- **Farming Assistant**: AI-powered farming advice tailored to Zimbabwean agriculture
- **Community Forum**: Connect with other farmers and agricultural experts
- **Farming Logbook**: Track farming activities and record observations
- **Task Planner**: Plan and manage farming tasks with reminders
- **Offline Support**: Full functionality even without internet connection

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
   \`\`\`
   git clone https://github.com/yourusername/mindahub.git
   cd mindahub
   \`\`\`

2. Install dependencies:
   \`\`\`
   yarn install
   \`\`\`

3. Create a `.env` file in the root directory with the following variables:
   \`\`\`
   OPENAI_API_KEY=your_openai_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   \`\`\`

4. Start the development server:
   \`\`\`
   yarn start
   \`\`\`

### Running on a Device

- For iOS: `yarn ios`
- For Android: `yarn android`

## Deployment

### Expo EAS Build

1. Install EAS CLI:
   \`\`\`
   npm install -g eas-cli
   \`\`\`

2. Log in to your Expo account:
   \`\`\`
   eas login
   \`\`\`

3. Configure the project:
   \`\`\`
   eas build:configure
   \`\`\`

4. Set up environment variables:
   \`\`\`
   eas secret:create --scope project --name OPENAI_API_KEY --value your_openai_api_key
   eas secret:create --scope project --name OPENWEATHER_API_KEY --value your_openweather_api_key
   \`\`\`

5. Build for Android:
   \`\`\`
   eas build --platform android
   \`\`\`

6. Build for iOS:
   \`\`\`
   eas build --platform ios
   \`\`\`

7. Submit to stores:
   \`\`\`
   eas submit --platform android
   eas submit --platform ios
   \`\`\`

## Project Structure

\`\`\`
mindahub/
├── assets/              # Static assets (images, fonts)
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── navigation/      # Navigation configuration
│   ├── screens/         # App screens
│   ├── services/        # API and service integrations
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── App.tsx              # Main application component
├── app.json             # Expo configuration
├── babel.config.js      # Babel configuration
└── tsconfig.json        # TypeScript configuration
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [OpenAI](https://openai.com/)
- [OpenWeather](https://openweathermap.org/)
\`\`\`

Let's create an EAS configuration file for deployment:
