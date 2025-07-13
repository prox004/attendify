# Firebase Setup Guide

## 1. Firebase Project Setup

### Authentication Setup
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Google sign-in provider
3. Add your domain to authorized domains (for production)

### Firestore Database Setup
1. Go to Firebase Console → Firestore Database
2. Create database in production mode
3. Apply these security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Subjects belong to users
    match /users/{userId}/subjects/{subjectId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Attendance records belong to users
    match /users/{userId}/attendance/{attendanceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules (if using file uploads)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Environment Variables

Create `.env.local` file in your project root with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.region.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 3. Production Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Enable PWA by ensuring HTTPS is configured

### Domain Configuration
- Add your production domain to Firebase authorized domains
- Update manifest.json with your production URL
- Test PWA installation on mobile devices

## 4. Security Checklist

- ✅ Firestore security rules implemented
- ✅ Authentication required for all user data
- ✅ Environment variables properly configured
- ✅ HTTPS enabled in production
- ✅ Domain whitelist configured
- ✅ No sensitive data in client-side code
