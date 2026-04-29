
import { firebaseConfig } from './firebase-init.js';
let app, auth, db; let firebaseReady = false;

export async function initFirebase(){
  if(!firebaseConfig || Object.values(firebaseConfig).filter(Boolean).length<3){
    return { ok:false, reason:"Config missing" };
  }
  const [{ initializeApp }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js')
  ]);
  app = initializeApp(firebaseConfig);
  const [authMod, firestoreMod] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
  ]);
  auth = authMod.getAuth(app);
  db = firestoreMod.getFirestore(app);
  firebaseReady = true;
  return { ok:true, auth, db, modules:{authMod, firestoreMod} };
}

export async function signInEmail(email, password="password123"){
  if(!firebaseReady){ await initFirebase(); }
  const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  try{ const cred = await signInWithEmailAndPassword(auth, email, password); return cred.user; }
  catch(e){ const user = (await createUserWithEmailAndPassword(auth, email, password)).user; return user; }
}

export function onAuth(callback){
  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js').then(({onAuthStateChanged})=>{
    onAuthStateChanged(auth, callback);
  });
}

export async function signOut(){
  const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  return signOut(auth);
}

export async function saveScore(uid, data){
  if(!firebaseReady){ await initFirebase(); }
  const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const ref = collection(db, 'scores', uid, 'sessions');
  return addDoc(ref, { ...data, at: serverTimestamp() });
}

export async function getLeaderboard(limitN=20){
  if(!firebaseReady){ await initFirebase(); }
  const { collectionGroup, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const q = query(collectionGroup(db, 'sessions'), orderBy('accuracy','desc'), orderBy('avgTimeMs','asc'), limit(limitN));
  const snap = await getDocs(q);
  const rows = []; snap.forEach(doc=> rows.push(doc.data()));
  return rows;
}

export async function redeemCode(code, uid){
  if(!firebaseReady){ await initFirebase(); }
  const { doc, runTransaction, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const dref = doc(db, 'robux_codes', code);
  return runTransaction(db, async (tx)=>{
    const snap = await tx.get(dref);
    if(!snap.exists()) throw new Error('Invalid code.');
    const data = snap.data();
    if(data.redeemed) throw new Error('Code already redeemed.');
    tx.update(dref, { redeemed:true, redeemedBy: uid, redeemedDate: serverTimestamp() });
    return { ok:true, reward: data.reward || 'Robux reward' };
  });
}
