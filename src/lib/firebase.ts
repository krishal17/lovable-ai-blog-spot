
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC46jtvj9SP87iRkdjdzB2txtjVMnkC2Ao",
  authDomain: "blogspot-d28f8.firebaseapp.com",
  projectId: "blogspot-d28f8",
  storageBucket: "blogspot-d28f8.appspot.com",
  messagingSenderId: "174250403351",
  appId: "1:174250403351:web:6787b55b6c314eff5a5e52",
  measurementId: "G-WBP98E7GX3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics if in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
