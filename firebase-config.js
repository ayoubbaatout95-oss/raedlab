// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSHLkEehR9yDRcZhIuQ7_mr9KxJmmqdnY",
  authDomain: "raedlab-28435.firebaseapp.com",
  projectId: "raedlab-28435",
  storageBucket: "raedlab-28435.firebasestorage.app",
  messagingSenderId: "1004482037387",
  appId: "1:1004482037387:web:76274a1815e9060b53368e",
  measurementId: "G-GGNV5LSDEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
