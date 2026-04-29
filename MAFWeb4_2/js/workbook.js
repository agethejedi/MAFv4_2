
import { el, toast, makeProblem, normalizeTimeString, clockSVG, SFX } from "./utils.js";
import { isFirebaseConfigured } from "./firebase-init.js";
import { initFirebase, saveScore as fbSaveScore, getLeaderboard } from "./firebase-live.js";
import { MockDB } from "./mockFirebase.js";

const state = { grade:1, difficulty:"easy", types:["add","sub"], avatar:"assets/avatars/a1.svg", total:10,
  idx:0, correct:0, streak:0, times:[], current:null, startedAt:0, useFirebase:false };

function fmtMs(ms){ return (ms/1000).toFixed(2) + "s"; }

function loadSetup(){
  try{
    const cfg = JSON.parse(localStorage.getItem("maf_setup")||"null");
    if(cfg){
      Object.assign(state, cfg);
      el("#avatarImg").src = cfg.avatar || state.avatar;
      el("#grade").textContent = "Grade " + cfg.grade;
      el("#difficulty").textContent = cfg.difficulty;
      el("#ptype").textContent = cfg.types.join(", ");
      el("#total").textContent = cfg.total;
    }
  }catch{}
}

function renderProblem(p){
  const area = el("#problemArea"); area.innerHTML = "";
  if(p.mode==="time-analog"){
    const block = document.createElement("div"); block.className="clock-wrap";
    block.innerHTML = clockSVG(p.shown, 180) + `<div class="problem">${p.question}</div>`; area.appendChild(block);
  }else if(p.mode==="time-digital"){
    area.innerHTML = `<div class="problem">${p.question}</div><div class="kpi" style="margin-top:10px">🕒 ${p.shown}</div>`;
  }else{
    area.innerHTML = `<div class="problem">${p.question}</div>`;
  }
}

function nextProblem(){
  if(state.idx >= state.total){ finish(); return; }
  const p = makeProblem({grade: state.grade, types: state.types, difficulty: state.difficulty});
  state.current = p; state.idx++; el("#qno").textContent = `${state.idx}/${state.total}`;
  renderProblem(p); el("#answer").value = ""; el("#answer").focus(); state.startedAt = performance.now();
}

function parseAnswer(p, raw){
  if(p.mode==="numeric"){ const n = parseInt(raw,10); return Number.isNaN(n)? null : n; }
  if(p.mode==="time-digital" || p.mode==="time-analog"){ return normalizeTimeString(raw); }
  return raw;
}

function isCorrect(p, userVal){
  if(p.mode==="numeric") return userVal === p.answer;
  if(p.mode==="time-digital" || p.mode==="time-analog") return normalizeTimeString(userVal) === normalizeTimeString(p.answer);
  return userVal === p.answer;
}

async function finish(){
  const accuracy = Math.round((state.correct / state.total) * 100);
  const avgTimeMs = Math.round(state.times.reduce((a,b)=>a+b,0)/state.times.length);
  el("#session").style.display="none"; el("#summary").style.display="block";
  el("#sumAccuracy").textContent = accuracy + "%"; el("#sumAvg").textContent = fmtMs(avgTimeMs);

  const uid = (JSON.parse(localStorage.getItem("maf_current_user")||"null")||{uid:"guest"}).uid;
  if(state.useFirebase){
    try{
      await fbSaveScore(uid, {accuracy, avgTimeMs, grade:state.grade, total:state.total});
      toast("Saved to cloud"); const lb = await getLeaderboard(20);
      const better = lb.filter(x=> (x.accuracy > accuracy) || (x.accuracy===accuracy && x.avgTimeMs<avgTimeMs)).length;
      const rankPct = Math.max(1, Math.round(((lb.length - better)/Math.max(1,lb.length))*100));
      el("#sumRank").textContent = `${rankPct}th percentile (cloud sample)`;
    }catch(e){ console.error(e); toast("Cloud save failed; kept locally."); el("#sumRank").textContent = `—`; }
  }else{
    MockDB.saveScore(uid, {accuracy, avgTimeMs, grade:state.grade, total:state.total});
    el("#sumRank").textContent = `Local demo rank available via previous sessions`;
  }
}

function wire(){
  el("#submit").addEventListener("click", check);
  el("#answer").addEventListener("keydown", (e)=>{ if(e.key==="Enter") check(); });
  el("#restart").addEventListener("click", ()=> location.href="workbook_setup.html");
  el("#backHome").addEventListener("click", ()=> location.href="index.html");
}

function check(){
  const raw = el("#answer").value; const ans = parseAnswer(state.current, raw);
  const elapsed = performance.now() - state.startedAt; state.times.push(elapsed);
  if(ans===null){ toast("Enter an answer"); return; }
  if(isCorrect(state.current, ans)){ state.correct++; state.streak++; SFX.ok.currentTime=0; SFX.ok.play(); toast("Correct! 🎉"); }
  else{ state.streak=0; SFX.bad.currentTime=0; SFX.bad.play(); toast(`Oops! Answer: ${state.current.answer}`); }
  el("#correct").textContent = state.correct; el("#streak").textContent = state.streak;
  el("#avgTime").textContent = fmtMs(state.times.reduce((a,b)=>a+b,0)/state.times.length);
  nextProblem();
}

window.addEventListener("DOMContentLoaded", async ()=>{
  loadSetup(); wire();
  if(isFirebaseConfigured()){ const r = await initFirebase(); state.useFirebase = !!r.ok; if(r.ok) toast("Firebase connected"); }
  nextProblem();
});
