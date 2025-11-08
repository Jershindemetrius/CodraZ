// firebase-config.js
const firebaseConfig = {
  apiKey: "AIzaSyBbTQQ6ztZiYGjXSiwhKa700QxqFMRrD_Y",
  authDomain: "EduFlow Pro-3e717.firebaseapp.com",
  projectId: "EduFlow Pro-3e717",
  storageBucket: "EduFlow Pro-3e717.firebasestorage.app",
  messagingSenderId: "522391481845",
  appId: "1:522391481845:web:7aa2219ecfc4949accc4bc",
  measurementId: "G-XNBPG86LCN"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Set persistence to LOCAL to keep user logged in
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });