import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBqSTR5Yhp1UqM7qAtXKJg1I1xG4PbrHXU",
  authDomain: "react-firebase-chat-b1791.firebaseapp.com",
  projectId: "react-firebase-chat-b1791",
storageBucket: "react-firebase-chat-b1791.appspot.com", 
  messagingSenderId: "394479489523",
  appId: "1:394479489523:web:a316a9445174b43aca8286",
  measurementId: "G-5GNPCE5PHY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider(); 
export const storage = getStorage(app);
