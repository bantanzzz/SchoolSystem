import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA0kpt2JYnM0Lx-hQIJd0B-7f1E6jsN_K0",
  authDomain: "student-system-5380b.firebaseapp.com",
  projectId: "student-system-5380b",
  storageBucket: "student-system-5380b.firebasestorage.app",
  messagingSenderId: "403965191653",
  appId: "1:403965191653:web:34e2efe457e6c4d19a3b0c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseUtils = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  addDoc,
  serverTimestamp
};
console.log("Firebase initialized for EduManage Pro", app.name);
