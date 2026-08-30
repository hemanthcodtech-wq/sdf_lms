# SDF LMS Mobile Application (React Native & Expo)

A cross-platform mobile application for SDF LMS built with React Native and Expo. Replicates all features, navigation flows, and design systems from the LMS web platform.

---

## 📱 Features Included

- **Authentication & User Management**:
  - Secure Login, Registration, Password Reset with OTP
  - AsyncStorage session persistence and automatic token refreshment
  - Multi-language support (English, Telugu, Hindi)

- **Home & Explore**:
  - Live Zoom Session countdowns and 1-tap join buttons
  - Batch WhatsApp community links
  - Horizontal course carousels & categorized exploration
  - Search with filters for Level, Category, and Faculty

- **Course Details & Learning**:
  - Course curriculum, syllabus overview, and faculty profiles
  - Interactive Student Classroom with Video lessons and completion tracking
  - Downloadable course PDF handbooks and practice materials
  - Direct checkout & enrollment flow

- **Certificates & Profile**:
  - Verified certificate gallery with PDF download & social sharing
  - Payment & transaction history
  - Wishlist management
  - Preferences and Help & Support center

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- Expo CLI or Expo Go app on your physical mobile phone

### 2. Installation
Navigate into the mobile directory and install dependencies:
```bash
cd mobile
npm install
```

### 3. Configure Backend URL
Open `mobile/src/services/api.js` to configure your API endpoint:
- **Android Emulator**: Uses `http://10.0.2.2:5000/api` (default)
- **iOS Simulator**: Uses `http://localhost:5000/api` (default)
- **Physical Device (Expo Go)**: Set `DEFAULT_HOST` to your computer's local Wi-Fi IP address (e.g. `http://192.168.1.15:5000`)

### 4. Run the Mobile App
```bash
npx expo start
```
- Scan the QR code in the terminal with the **Expo Go** app (Android) or **Camera** app (iOS).
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Press `w` to run web preview.

---

## 📁 Project Structure

```
mobile/
├── App.js                     # Root entry point with Providers
├── app.json                   # Expo application configuration
├── package.json
└── src/
    ├── theme/                 # Brand colors, typography, shadows
    ├── context/               # AuthContext & LanguageContext
    ├── services/              # Axios API client & course/payment services
    ├── components/            # CourseCard, Header, CustomButton, Inputs, etc.
    ├── navigation/            # Bottom Tab & Native Stack Navigators
    └── screens/
        ├── auth/              # Login, Register, ForgotPassword
        ├── home/              # HomeScreen with Live classes & carousels
        ├── courses/           # CourseList, CourseDetails, Checkout
        ├── learning/          # MyLearning, StudentClasses/Player
        ├── wishlist/          # WishlistScreen
        ├── certificates/      # CertificatesScreen
        └── profile/           # Profile, Settings, PaymentHistory, HelpSupport
```
