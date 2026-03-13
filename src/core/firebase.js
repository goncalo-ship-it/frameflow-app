import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore, doc, collection, onSnapshot, setDoc, updateDoc, addDoc, getDocs, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const app      = initializeApp(firebaseConfig)
export const auth     = getAuth(app)
export const db       = getFirestore(app)
export const provider = new GoogleAuthProvider()

// Re-export Firestore utilities
export { doc, collection, onSnapshot, setDoc, updateDoc, addDoc, getDocs, getDoc, serverTimestamp, query, orderBy }

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider)
  const u = result.user
  return {
    uid:   u.uid,
    name:  u.displayName,
    email: u.email,
    photo: u.photoURL,
  }
}

export async function firebaseSignOut() {
  await signOut(auth)
}

// ── Ensure user document exists in Firestore ──────────────────────
// Creates /projects/{projectId}/users/{uid} if it doesn't exist yet.
// Safe to call on every login — only writes on first time.
export async function ensureUserDoc(projectId, user, role, department) {
  if (!projectId || !user?.uid) return
  try {
    const ref = doc(db, `projects/${projectId}/users/${user.uid}`)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        name: user.name || user.displayName || '',
        email: user.email || '',
        role: role || null,
        department: department || null,
        createdAt: serverTimestamp(),
      })
    }
  } catch (e) {
    // Firestore may be unreachable — fail silently, app works offline
    console.warn('[Firebase] ensureUserDoc failed (offline?):', e.message)
  }
}
