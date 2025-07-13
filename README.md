# 📱 Attendify - AI-Powered Attendance Tracker

A modern, Progressive Web App (PWA) built with Next.js 14, Firebase, and Tailwind CSS for students to track and manage their class attendance with AI-powered insights.

## ✨ Features

- 🔐 **Google Authentication** - Secure sign-in with Google
- 📊 **Smart Dashboard** - Visual overview of attendance statistics
- 📅 **Timetable Management** - Organize your class schedule
- 📆 **Calendar View** - Track upcoming classes and events
- 📚 **Subject-wise Tracking** - Manage attendance for each subject
- 🤖 **AI Insights** - Predictive analytics for attendance planning
- 📱 **PWA Support** - Install as native mobile app
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- ⚡ **Offline Support** - Works offline with service worker

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Google provider
   - Enable Firestore Database
   - Copy your Firebase config

4. **Environment Configuration**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - Sign in with Google to get started

## 🏗️ Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── dashboard/         # Main dashboard
│   ├── timetable/         # Class schedule management
│   ├── calendar/          # Calendar view
│   ├── subjects/          # Subject-wise attendance
│   ├── settings/          # User preferences
│   ├── onboarding/        # Welcome & sign-in
│   └── globals.css        # Global styles
├── components/            # Reusable React components
│   └── Navigation.tsx     # App navigation
└── lib/                   # Utility functions
    ├── firebase.ts        # Firebase configuration
    └── auth.ts           # Authentication helpers
```

## 🎨 Design System

### Colors
- **Primary**: #3F51B5 (Dark Blue)
- **Accent**: #FF5722 (Deep Orange)
- **Background**: #F5F5F5 (Light Gray)
- **Surface**: #FFFFFF (White)

### Typography
- **Font**: Inter (Google Fonts)
- **Smooth transitions**: 200ms ease-in-out

## 📱 PWA Features

The app includes full PWA support:
- **Installable** on mobile devices
- **Offline functionality** with service worker
- **App-like experience** in standalone mode
- **Custom app icons** and splash screens

## 🔒 Security & Privacy

- Secure authentication with Firebase Auth
- User data stored in Firestore with proper security rules
- No sensitive data stored locally
- HTTPS required for production

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
The app can be deployed on any platform supporting Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js 14](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Heroicons](https://heroicons.com/)
- Backend powered by [Firebase](https://firebase.google.com/)

---

**Happy Tracking! 📚✨**
