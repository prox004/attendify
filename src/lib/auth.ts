import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Store user in Firestore
    await storeUserInFirestore(user);
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

const storeUserInFirestore = async (user: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    // Only create user document if it doesn't exist
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Update user info on login
      await setDoc(userRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error storing user in Firestore:', error);
    throw error;
  }
};
