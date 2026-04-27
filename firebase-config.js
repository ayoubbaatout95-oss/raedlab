// RAED LAB - Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

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

// تعريف الأدوات مرة واحدة فقط
const db = getFirestore(app);
const auth = getAuth(app);

// التصدير الجماعي - هذا هو الأسلوب الأفضل والأضمن
export { db, auth, analytics };
