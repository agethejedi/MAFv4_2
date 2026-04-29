
export const MockAuth = {
  currentUser: null,
  signIn(email){ this.currentUser = { uid: `local_${btoa(email).slice(0,8)}`, email }; localStorage.setItem("maf_current_user", JSON.stringify(this.currentUser)); return this.currentUser; },
  signOut(){ this.currentUser = null; localStorage.removeItem("maf_current_user"); },
  load(){ try{ this.currentUser = JSON.parse(localStorage.getItem("maf_current_user")||"null"); }catch{} return this.currentUser; }
};
export const MockDB = {
  saveScore(uid, data){
    const all = JSON.parse(localStorage.getItem("maf_scores")||"{}");
    all[uid] = all[uid] || []; all[uid].push({...data, at: Date.now()});
    localStorage.setItem("maf_scores", JSON.stringify(all)); return true;
  },
  top(limit=20){
    const all = JSON.parse(localStorage.getItem("maf_scores")||"{}");
    const rows = []; Object.entries(all).forEach(([uid, arr])=>{
      const last = arr[arr.length-1]; if(last) rows.push({uid, accuracy:last.accuracy, avgTimeMs:last.avgTimeMs, grade:last.grade||1, total:last.total});
    });
    rows.sort((a,b)=> (b.accuracy - a.accuracy) || (a.avgTimeMs - b.avgTimeMs)); return rows.slice(0, limit);
  },
  redeem(code, uid){
    const used = JSON.parse(localStorage.getItem("maf_codes_used")||"{}");
    if(used[code]) return {ok:false, reason:"Code already used."};
    if(!code.startsWith("FREE")) return {ok:false, reason:"Invalid code (mock mode expects codes beginning with 'FREE')."};
    used[code] = {uid, at: Date.now()}; localStorage.setItem("maf_codes_used", JSON.stringify(used));
    return {ok:true, reward:"200 Robux (mock)"};
  }
};
