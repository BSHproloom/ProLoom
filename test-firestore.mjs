import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFt5u7lHBDJkCgBfVb82wSyNp7Fa7H6Ow",
  authDomain: "proloom-bsh.firebaseapp.com",
  projectId: "proloom-bsh",
  storageBucket: "proloom-bsh.firebasestorage.app",
  messagingSenderId: "497053348447",
  appId: "1:497053348447:web:32355b283cddff86b8a1ea"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    console.log("Testing read...");
    const snap = await getDocs(collection(db, "projects"));
    console.log("Read success. Docs count:", snap.size);

    console.log("Testing write...");
    await addDoc(collection(db, "projects"), { test: true });
    console.log("Write success.");
  } catch (e) {
    console.error("Firestore Error:", e.message);
  }
  process.exit();
}

test();
