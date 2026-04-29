
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
export function isFirebaseConfigured(){
  return Object.values(firebaseConfig||{}).filter(Boolean).length >= 3;
}
