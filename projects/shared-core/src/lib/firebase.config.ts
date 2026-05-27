import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBFt5u7lHBDJkCgBfVb82wSyNp7Fa7H6Ow",
  authDomain: "proloom-bsh.firebaseapp.com",
  projectId: "proloom-bsh",
  storageBucket: "proloom-bsh.firebasestorage.app",
  messagingSenderId: "497053348447",
  appId: "1:497053348447:web:32355b283cddff86b8a1ea",
  measurementId: "G-F304GG9E92"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
