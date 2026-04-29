
# MAFWeb v4.2 (Firebase + Clocks/Time/Word Problems)

Static HTML/JS build with optional Firebase connectivity.
- New problem types: analog & digital clocks, elapsed time, word problems.
- Sound effects + avatars.
- Works offline via localStorage; auto-uses Firebase when configured.

## Firebase
1) Paste your config into `js/firebase-init.js` (from Firebase Console → Web app).
2) Firestore collections:
   - `/scores/{uid}/sessions/{autoId}` with `{ accuracy, avgTimeMs, grade, total, at }`
   - `/robux_codes/{CODE}` with `{ code, reward, redeemed:false, redeemedBy:null, redeemedDate:null }`
3) Rules (starter) are in the previous message — tighten for production.

## Deploy (GitHub Pages)
- New repo → upload the folder → Settings → Pages (root).

Enjoy!
