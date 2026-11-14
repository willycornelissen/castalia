import {
  signInWithEmailAndPassword as firebaseSignIn,
  signOut,
  onAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Authenticates the blog administrator with email and password.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<User> {
  const credential = await firebaseSignIn(auth, email, password);
  return credential.user;
}

/**
 * Signs out the currently authenticated user.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribes to Firebase authentication state changes.
 */
export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
