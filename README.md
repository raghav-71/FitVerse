# ⚡ FitVerse AI — Next-Gen Biomechanical Fitness App

An AI-powered biomechanical workout tracking and fitness gamification platform built with **React Native**, **Expo SDK 57**, **TypeScript**, and **Tailored Cyber/Light Themes**.

---

## 🚀 One-Command Quick Setup

Clone the repository and run:

```bash
npm install && npm start
```

That's it! Metro Bundler will launch with an interactive QR code.

- **On Mobile:** Scan the terminal QR code with **Expo Go** (Android or iOS).
- **In Browser:** Press `w` in the terminal or run `npm run web` to open the web version.

---

## ❓ Does this project need a `.env` file?

**No.** FitVerse AI is 100% self-contained out of the box:
- All workout tracking algorithms, biomechanical state stores, and gamification mechanics run client-side.
- The multi-lingual translation engine (supporting 10 Indian regional languages + authentic native script numerals) is bundled locally without requiring external translation API keys.
- You do **not** need to create or configure any `.env` file to clone and run the application.

---

## 🛠️ System Prerequisites

- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **Git**

---

## 📱 Available Commands

| Command | Action |
| :--- | :--- |
| `npm start` | Starts the Metro bundler & generates an Expo Go QR code |
| `npm run web` | Launches the responsive web app in your browser |
| `npm run android` | Boots the app on a connected Android device or emulator |
| `npm run ios` | Boots the app on macOS iOS Simulator |
| `npm run build:apk` | Compiles a standalone downloadable Android `.apk` via EAS Build |
| `npm run build:all` | Compiles Android and iOS production packages via EAS Build |

---

## 🎨 Key Features

- **Dynamic Theme Engine**: Seamless toggle between warm cream Light Theme (`#F7F5EE`) and futuristic Cyber Dark Theme (`#0B0D12`).
- **Full Indian Regional Localization**: Real-time switching across 10 Indian regional languages (Hindi, Marathi, Gujarati, Bengali, Telugu, Tamil, Kannada, Malayalam, Punjabi, Odia) + English.
- **Native Numeral Representation**: Automatic conversion of numbers, sets, reps, streaks, and timestamps into regional Indian digit scripts.
- **Computer Vision Biomechanical Mirror**: Camera-ready HUD with skeletal pose tracking, repetition validation, tempo cadence, and form accuracy scoring.
- **Responsive Layout**: Fluid experience optimized across Android, iOS, tablets, and desktop browsers with centered `maxWidth: 680` constraints.
