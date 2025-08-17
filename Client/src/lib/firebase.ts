// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_AUTH_API,
  authDomain: "orjin-d1e92.firebaseapp.com",
  projectId: "orjin-d1e92",
  storageBucket: "orjin-d1e92.firebasestorage.app",
  messagingSenderId: "895903142999",
  appId: "1:895903142999:web:b3ffdf81a01875db5d3f12",
  measurementId: "G-C2VFLGN6SM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth();
export const db=getFirestore(app);
export default app;