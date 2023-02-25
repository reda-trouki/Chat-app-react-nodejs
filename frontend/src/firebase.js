import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBixcDxQWQjMda-KMhIYPFmI8U6qoFuW-4",
  authDomain: "upload-files-react-938d9.firebaseapp.com",
  projectId: "upload-files-react-938d9",
  storageBucket: "upload-files-react-938d9.appspot.com",
  messagingSenderId: "597131316248",
  appId: "1:597131316248:web:f964720da61b4ea180876d"
};

const fire = initializeApp(firebaseConfig)
export const storage = getStorage(fire, process.env.REACT_APP_BUCKET_URL)