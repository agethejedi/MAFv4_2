
export const VERSION = "MAFWeb4.2";

export function el(sel){ return document.querySelector(sel); }
export function els(sel){ return Array.from(document.querySelectorAll(sel)); }

export function toast(msg){
  const t = el("#toast"); if(!t) return;
  t.textContent = msg; t.style.display = "block";
  setTimeout(()=> t.style.display="none", 2200);
}

export const SFX = {
  ok: new Audio("assets/sfx/correct.wav"),
  bad: new Audio("assets/sfx/wrong.wav")
};

export function randInt(min, max){ return Math.floor(Math.random()*(max-min+1)) + min; }

export function normalizeTimeString(s){
  if(!s) return "";
  s = s.replace(/\s+/g, "");
  const m = s.match(/^(\d{1,2})[:hH]?(\d{1,2})$/);
  if(!m) return s;
  const h = String(parseInt(m[1],10));
  const mn = String(parseInt(m[2],10)).padStart(2,"0");
  return `${h}:${mn}`;
}

export function clockSVG(timeStr, size=180){
  const [h,m] = timeStr.split(":").map(n=>parseInt(n,10));
  const cx=size/2, cy=size/2, r=size*0.42;
  const mh = (m/60)*2*Math.PI;
  const hh = ((h%12)/12 + (m/60)/12)*2*Math.PI;
  function line(angle, length, width){
    const x = cx + Math.sin(angle)*length;
    const y = cy - Math.cos(angle)*length;
    return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#cde7ff" stroke-width="${width}" stroke-linecap="round"/>`;
  }
  let ticks = "";
  for(let i=0;i<12;i++){
    const a = (i/12)*2*Math.PI;
    const x1 = cx + Math.sin(a)*(r-8);
    const y1 = cy - Math.cos(a)*(r-8);
    const x2 = cx + Math.sin(a)*(r);
    const y2 = cy - Math.cos(a)*(r);
    ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#2da7ff" stroke-width="2"/>`;
  }
  return `<svg class="clock" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0c1a2a" stroke="#24405f" stroke-width="3"/>
    ${ticks}
    ${line(hh, r*0.55, 4)}
    ${line(mh, r*0.8, 3)}
    <circle cx="${cx}" cy="${cy}" r="4" fill="#6ae3ff"/>
  </svg>`;
}

// Problem generator (add, sub, mul, div, clock_analog, clock_digital, time_diff, word)
export function makeProblem({grade=1, types=["add","sub"], difficulty="easy"}){
  const bounds = {
    easy:  {min:0, max:20},
    medium:{min:5, max:50},
    hard:  {min:10,max:99},
  }[difficulty] || {min:0, max:20};

  const pick = types[Math.floor(Math.random()*types.length)];
  const a = randInt(bounds.min, bounds.max);
  const b = randInt(bounds.min, bounds.max);

  if(pick==="add") return { type:pick, question:`${a} + ${b}`, answer:a+b, mode:"numeric" };
  if(pick==="sub"){ const A=Math.max(a,b), B=Math.min(a,b); return { type:pick, question:`${A} - ${B}`, answer:A-B, mode:"numeric" }; }
  if(pick==="mul"){
    const x = randInt(0, grade>=3?12:6), y = randInt(0, grade>=3?12:6);
    return { type:pick, question:`${x} × ${y}`, answer:x*y, mode:"numeric" };
  }
  if(pick==="div"){
    const y = randInt(1, grade>=3?12:6), x = y * randInt(1, grade>=3?12:6);
    return { type:pick, question:`${x} ÷ ${y}`, answer:Math.floor(x/y), mode:"numeric" };
  }
  if(pick==="clock_digital"){
    const h = randInt(1,12), m = randInt(0,11)*5;
    const shown = `${h}:${String(m).padStart(2,"0")}`;
    return { type:pick, question:`What time is this?`, shown, answer:shown, mode:"time-digital" };
  }
  if(pick==="clock_analog"){
    const h = randInt(1,12), m = randInt(0,11)*5;
    const shown = `${h}:${String(m).padStart(2,"0")}`;
    return { type:pick, question:`Read the clock:`, shown, answer:shown, mode:"time-analog" };
  }
  if(pick==="time_diff"){
    const startH = randInt(1,11); const startM = randInt(0,11)*5;
    const addMin = [10,15,20,25,30,35,40,45,50,55,60,75,90][randInt(0,12)];
    const endMins = startH*60 + startM + addMin;
    const endH = ((endMins//60 -1) % 12)+1;
    const endM = endMins % 60;
    const start = `${startH}:${String(startM).padStart(2,"0")}`;
    const end = `${endH}:${String(endM).padStart(2,"0")}`;
    return { type:pick, question:`From ${start} to ${end}, how many minutes passed?`, answer:addMin, mode:"numeric" };
  }
  if(pick==="word"){
    const templates = [
      (x,y)=>({q:`A fox finds ${x} berries and eats ${y}. How many are left?`, a:x-y}),
      (x,y)=>({q:`There are ${x} students. ${y} more join. How many now?`, a:x+y}),
      (x,y)=>({q:`A book has ${x} pages. You read ${y} pages. How many still to read?`, a:x-y}),
      (x,y)=>({q:`There are ${x} stickers. You split them into ${y} equal groups. How many in each group?`, a:Math.floor(x/y)}),
      (x,y)=>({q:`Boxes of ${x} crayons each. You have ${y} boxes. How many crayons total?`, a:x*y}),
    ];
    const pickT = templates[Math.floor(Math.random()*templates.length)];
    const x = randInt(6, bounds.max); const y = randInt(2, Math.min(12,x-1));
    const {q,a} = pickT(x,y);
    return { type:pick, question:q, answer:a, mode:"numeric" };
  }
  return { type:"add", question:`${a} + ${b}`, answer:a+b, mode:"numeric" };
}
