
// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3GkEU-Zv3dRoPAGeZHiVVj8pebA5Hi40",
  authDomain: "claimant-403721.firebaseapp.com",
  databaseURL: "https://claimant-403721-default-rtdb.firebaseio.com",
  projectId: "claimant-403721",
  storageBucket: "claimant-403721.appspot.com",
  messagingSenderId: "920312975288",
  appId: "1:920312975288:web:ada618f2ceb4fb5f12894d",
  measurementId: "G-QWQPGMFR1G"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);