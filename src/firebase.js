import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBe3PhyBZ1byDYOluhrbuUpj1G3bqEkuvY",
  authDomain: "bookkaboo5.firebaseapp.com",
  projectId: "bookkaboo5",
  storageBucket: "bookkaboo5.firebasestorage.app",
  messagingSenderId: "888992551425",
  appId: "1:888992551425:web:f214c2c0662160334b2600"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
};
