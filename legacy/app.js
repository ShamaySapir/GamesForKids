const R=n=>Math.floor(Math.random()*n),pick=a=>a[R(a.length)],$=s=>document.querySelector(s);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const N=10,app=$('#app');
let total=0;try{total=+localStorage.getItem('lomda-stars')||0}catch(e){}
const save=()=>{try{localStorage.setItem('lomda-stars',total)}catch(e){}};
let audio;
function tone(f,d=.15,t=0){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;g.gain.value=.12;o.connect(g);g.connect(audio.destination);const s=audio.currentTime+t;o.start(s);o.stop(s+d)}catch(e){}}
const good=()=>{tone(660);tone(880,.2,.12)},oops=()=>tone(220,.25);
function speak(t){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='he-IL';u.rate=.85;speechSynthesis.speak(u)}catch(e){}}

/* ---------- שעון ---------- */
const hhmm=(h,m)=>h+':'+String(m).padStart(2,'0');
function clock(h,m){
  let s='<svg viewBox="0 0 200 200" role="img" aria-label="שעון"><circle cx="100" cy="100" r="94" fill="var(--card)" stroke="var(--clock)" stroke-width="8"/>';
  for(let i=0;i<60;i++){const a=i*6*Math.PI/180,l=i%5?4:10;s+=`<line x1="${100+Math.sin(a)*86}" y1="${100-Math.cos(a)*86}" x2="${100+Math.sin(a)*(86-l)}" y2="${100-Math.cos(a)*(86-l)}" stroke="var(--ink)" stroke-width="${i%5?1:3}"/>`}
  for(let i=1;i<=12;i++){const a=i*30*Math.PI/180;s+=`<text x="${100+Math.sin(a)*62}" y="${100-Math.cos(a)*62+7}" text-anchor="middle" font-size="20" font-weight="800" fill="var(--ink)">${i}</text>`}
  const hand=(d,len,w,c)=>{const a=d*Math.PI/180;return `<line x1="100" y1="100" x2="${100+Math.sin(a)*len}" y2="${100-Math.cos(a)*len}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`};
  return s+hand((h%12)*30+m*.5,40,9,'var(--clock)')+hand(m*6,66,5,'var(--abc)')+'<circle cx="100" cy="100" r="7" fill="var(--ink)"/></svg>';
}

/* ---------- אותיות ---------- */
const LET=[['א','אריה','🦁'],['ב','בלון','🎈'],['ג','גמל','🐪'],['ד','דג','🐟'],['ה','הר','⛰️'],['ו','ורד','🌹'],['ז','זברה','🦓'],['ח','חתול','🐱'],['ט','טלפון','☎️'],['י','יד','✋'],['כ','כדור','⚽'],['ל','לב','❤️'],['מ','מטוס','✈️'],['נ','נחש','🐍'],['ס','סוס','🐴'],['ע','עכבר','🐭'],['פ','פיל','🐘'],['צ','צפרדע','🐸'],['ק','קוף','🐒'],['ר','רכבת','🚆'],['ש','שמש','☀️'],['ת','תפוח','🍎']];

/* ---------- מספרים ---------- */
const FRU=['🍎','🐥','⭐','🎈','🐟','🚗','🍓','🐞'];
function numOpts(a,k,max){const s=new Set([a]);for(let g=0;s.size<k&&g<60;g++){const v=a+pick([-3,-2,-1,1,2,3]);if(v>=0&&v<=max)s.add(v)}return shuffle([...s]).map(v=>({html:v,ok:v===a}))}

const games={
 clock:{name:'שעון',icon:'⏰',c:'--clock',desc:'לומדים לקרוא מה השעה',levels:['שעות עגולות','חצאים ורבעים','כל חמש דקות'],
  make(L,i){
   const mins=[[0],[0,15,30,45],[0,5,10,15,20,25,30,35,40,45,50,55]][L],rt=()=>[1+R(12),pick(mins)];
   const [h,m]=rt(),key=hhmm(h,m),seen=new Set([key]),wrong=[];
   for(let g=0;wrong.length<3&&g<60;g++){const r=R(3),c=r==0?[h,pick(mins)]:r==1?[1+R(12),m]:rt(),k=hhmm(...c);if(!seen.has(k)){seen.add(k);wrong.push(c)}}
   const opts=shuffle([[h,m],...wrong]),isA=c=>c[0]==h&&c[1]==m;
   if(i%2==0)return{key,q:'מה השעה?',prompt:`<div class="cw">${clock(h,m)}</div>`,hint:'המחוג הקצר (אדום) מראה שעות, והארוך (סגול) מראה דקות.',opts:opts.map(c=>({html:`<span class="digi">${hhmm(...c)}</span>`,ok:isA(c)})),say:'מה השעה?'};
   return{key,q:'איזה שעון מראה את השעה?',prompt:`<div class="big digi">${key}</div>`,opts:opts.map(c=>({html:clock(...c),ok:isA(c)})),say:'איזה שעון מראה את השעה '+key};
  }},
 abc:{name:'אותיות',icon:'🔤',c:'--abc',desc:'לומדים את האלף־בית',levels:['בואו נתחיל','כל האלף־בית','מוצאים תמונה לפי האות'],
  make(L){
   const t=pick(L==0?LET.slice(0,9):LET),all=shuffle([t,...shuffle(LET.filter(x=>x[0]!=t[0])).slice(0,L==0?2:3)]);
   if(L<2)return{key:t[0],q:'באיזו אות מתחילה המילה?',prompt:`<div class="big">${t[2]}</div><div class="word">${t[1]}</div>`,opts:all.map(x=>({html:x[0],ok:x===t})),say:t[1]};
   return{key:t[0],q:'איזו מילה מתחילה באות הזו?',prompt:`<div class="big">${t[0]}</div>`,opts:all.map(x=>({html:`<span style="font-size:44px">${x[2]}</span><small>${x[1]}</small>`,ok:x===t})),say:'איזו מילה מתחילה באות '+t[0]};
  }},
 num:{name:'מספרים וחשבון',icon:'🔢',c:'--num',desc:'סופרים, מחברים ומחסרים',levels:['לספור','חיבור וחיסור עד 10','חיבור וחיסור עד 20'],
  make(L,i){
   const e=pick(FRU);
   if(L==0){const n=1+R(10);return{key:'c'+n,q:'כמה יש כאן?',prompt:`<div class="emo">${e.repeat(n)}</div>`,opts:numOpts(n,3,10),say:'כמה יש כאן?'}}
   const lim=L==1?10:20,sub=i%2==1;let a,b,ans;
   if(sub){a=2+R(lim-1);b=1+R(a-1);ans=a-b}else{a=1+R(lim-1);b=1+R(lim-a);ans=a+b}
   const eq=`<div class="eq">${a} ${sub?'−':'+'} ${b} = ?</div>`;
   let pic='';
   if(L==1)pic=sub?`<div class="emo">${e.repeat(a-b)}<span class="gone">${e.repeat(b)}</span></div>`:`<div class="emo">${e.repeat(a)} ➕ ${e.repeat(b)}</div>`;
   return{key:a+(sub?'-':'+')+b,q:'כמה יוצא?',prompt:eq+pic,opts:numOpts(ans,4,lim),say:sub?`${a} פחות ${b}, כמה יוצא?`:`${a} ועוד ${b}, כמה יוצא?`};
  }}
};

/* ---------- מסכים ---------- */
let S={};
const bar=()=>`<header class="top"><button class="btn-home" id="home">🏠 הביתה</button><div class="stars">⭐ ${total}</div></header>`;
const wire=()=>{const h=$('#home');if(h)h.onclick=home};

function home(){
  app.innerHTML=`<header class="top"><h1>לומדים ומשחקים</h1><div class="stars">⭐ ${total}</div></header><p class="sub">בחרו משחק</p><div class="menu">${Object.entries(games).map(([k,g])=>`<button class="tile" style="--c:var(${g.c})" data-g="${k}"><span class="ic">${g.icon}</span><div><b>${g.name}</b><small>${g.desc}</small></div></button>`).join('')}</div>`;
  app.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>levels(b.dataset.g));
}
function levels(k){
  const g=games[k];
  app.innerHTML=bar()+`<h1>${g.icon} ${g.name}</h1><p class="sub">איזו רמה?</p><div class="menu">${g.levels.map((n,i)=>`<button class="tile" style="--c:var(${g.c})" data-l="${i}"><span class="ic" style="font-size:24px">${'⭐'.repeat(i+1)}</span><div><b>${n}</b></div></button>`).join('')}</div>`;
  wire();app.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>start(k,+b.dataset.l));
}
function start(k,L){S={k,L,i:0,score:0,used:new Set()};ask()}
function ask(){
  const g=games[S.k];let q,t=0;
  do{q=g.make(S.L,S.i)}while(S.used.has(q.key)&&t++<30);
  S.used.add(q.key);S.q=q;S.tried=false;S.done=false;
  const dots=Array.from({length:N},(_,j)=>`<i class="dot ${j<S.i?'done':j==S.i?'now':''}"></i>`).join('');
  app.innerHTML=bar()+`<div class="dots" style="--c:var(${g.c})">${dots}</div><div class="stage" style="border-color:var(${g.c})"><p class="q">${q.q} <button class="say" id="say" aria-label="הקראה">🔊</button></p>${q.prompt}${q.hint?`<p class="hint">${q.hint}</p>`:''}<div class="opts">${q.opts.map((o,j)=>`<button class="opt" data-j="${j}">${o.html}</button>`).join('')}</div><div class="fb" id="fb" aria-live="polite"></div></div>`;
  wire();$('#say').onclick=()=>speak(q.say);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>choose(b,+b.dataset.j));
}
function choose(b,j){
  if(S.done)return;
  if(S.q.opts[j].ok){
    S.done=true;b.classList.add('ok');good();if(!S.tried)S.score++;
    $('#fb').textContent=pick(['כל הכבוד!','יפה מאוד!','מצוין!','בול!']);
    setTimeout(()=>{S.i++;S.i>=N?end():ask()},1000);
  }else{S.tried=true;b.classList.add('bad');b.disabled=true;oops();$('#fb').textContent='כמעט! נסו שוב.'}
}
function end(){
  const st=S.score>=9?3:S.score>=6?2:1,g=games[S.k];
  total+=st;save();
  app.innerHTML=bar()+`<div class="stage" style="border-color:var(${g.c})"><div class="trophy">${'⭐'.repeat(st)}</div><h1>${st==3?'אלופים!':st==2?'כל הכבוד!':'התחלה יפה!'}</h1><p class="q">${S.score} מתוך ${N} בניסיון הראשון</p><div class="row"><button class="cta" id="again">שחקו שוב</button><button class="btn-home" id="lv">רמה אחרת</button></div></div>`;
  wire();$('#again').onclick=()=>start(S.k,S.L);$('#lv').onclick=()=>levels(S.k);
  good();tone(1040,.25,.3);
}
home();
