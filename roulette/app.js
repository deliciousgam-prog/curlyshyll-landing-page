const prizes=[
  {name:'샴푸 샘플 랜덤 2종 증정',weight:35,emoji:'🧴',fx:['🫧','✨','🫧'],anim:'pop',tier:'LUCKY',tint:'#e3f8f4',accent:'#0b9d8f',sub:'어떤 향이 올지는 열어볼 때까지 비밀 🤫',code:'SAMPLE',burst:70},
  {name:'무료배송',weight:25,emoji:'🚚',fx:['💨','💨',''],anim:'drive',tier:'LUCKY',tint:'#e6f1ff',accent:'#3d7be0',sub:'택배비 0원! 부릉부릉 문 앞까지 달려갈게요',code:'FREESHIP',burst:80},
  {name:'자사몰 재구매시 5% 할인',weight:18,emoji:'🛍️',fx:['✨','💖','✨'],anim:'bag',tier:'NICE',tint:'#fff3d6',accent:'#d99a1c',sub:'다음 장바구니가 조금 더 가벼워져요',code:'AGAIN5',burst:90},
  {name:'헤어오일 10% 할인',weight:12,emoji:'💧',fx:['✨','🌿','✨'],anim:'drop',tier:'RARE',tint:'#dcf7ef',accent:'#119c86',sub:'커리쉴 오일 한 방울로 찰랑찰랑 💆‍♀️',code:'OIL10',burst:110},
  {name:'헤어오일 15% 할인',weight:7,emoji:'💎',fx:['✨','💠','✨'],anim:'gem',tier:'EPIC',tint:'#ece8ff',accent:'#6a5ad8',sub:'7% 확률을 뚫었어요. 오늘 운 좋은 날!',code:'OIL15',burst:150},
  {name:'헤어오일 20% 할인',weight:3,emoji:'👑',fx:['🌟','✨','🎉'],anim:'crown',tier:'LEGENDARY',tint:'#fff1c9',accent:'#e0a100',sub:'단 3%의 주인공! 최고 혜택을 차지했어요',code:'OIL20',burst:240}
];
const wheel=document.getElementById('wheel');
const spin=document.getElementById('spin');
const out=document.getElementById('result');
const hist=document.getElementById('history');
const userIdInput=document.getElementById('userId');
const idMessage=document.getElementById('idMessage');
const STORAGE_KEY='curlyshyll_roulette_used_ids_v1';
let current=0,count=0,log=[];
const reduceMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const overlay=document.getElementById('winOverlay');
const winCard=document.getElementById('winCard');
let lastFocus=null;

/* ---- 컨페티 ---- */
const cv=document.getElementById('confetti'),cx=cv.getContext('2d');
let parts=[],raf=0;
function sizeCanvas(){const d=window.devicePixelRatio||1;cv.width=innerWidth*d;cv.height=innerHeight*d;cx.setTransform(d,0,0,d,0,0);}
addEventListener('resize',sizeCanvas);sizeCanvas();
function confetti(n,accent){
  if(reduceMotion)return;
  const cols=['#83d8c8','#fff0ab','#ff9b91','#ffffff',accent];
  for(let k=0;k<n;k++){
    const fromLeft=k%2===0;
    parts.push({x:fromLeft?-10:innerWidth+10,y:innerHeight*(.55+Math.random()*.3),
      vx:(fromLeft?1:-1)*(4+Math.random()*7),vy:-(9+Math.random()*9),
      w:6+Math.random()*6,h:8+Math.random()*10,r:Math.random()*6,vr:(Math.random()-.5)*.35,
      c:cols[k%cols.length],life:0,round:Math.random()<.25});
  }
  if(!raf)raf=requestAnimationFrame(tick);
}
function tick(){
  cx.clearRect(0,0,innerWidth,innerHeight);
  parts=parts.filter(p=>p.life<260&&p.y<innerHeight+40);
  for(const p of parts){
    p.life++;p.vy+=.32;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;
    cx.globalAlpha=Math.max(0,1-p.life/260);
    if(p.round){cx.beginPath();cx.arc(0,0,p.w/2,0,7);cx.fill();}
    else cx.fillRect(-p.w/2,-p.h/2*Math.abs(Math.cos(p.life/8)),p.w,p.h*Math.abs(Math.cos(p.life/8))+1);
    cx.restore();
  }
  raf=parts.length?requestAnimationFrame(tick):0;
  if(!raf)cx.clearRect(0,0,innerWidth,innerHeight);
}

/* ---- 당첨 카드 ---- */
function showWin(p){
  winCard.style.setProperty('--tint',p.tint);
  winCard.style.setProperty('--accent',p.accent);
  const tier=document.getElementById('winTier');
  tier.textContent=(p.tier==='LEGENDARY'?'👑 ':'')+p.tier;
  tier.className='tier'+(p.tier==='LEGENDARY'?' legend':'');
  const stage=document.getElementById('winStage');
  stage.className='stage anim-'+p.anim;
  document.getElementById('winEmoji').textContent=p.emoji;
  ['winX1','winX2','winX3'].forEach((id,k)=>document.getElementById(id).textContent=p.fx[k]||'');
  document.getElementById('winName').textContent=p.name+' 당첨!';
  document.getElementById('winSub').textContent=p.sub;
  document.getElementById('winCode').textContent='CURLY-'+p.code+'-'+Math.random().toString(36).slice(2,6).toUpperCase();
  document.getElementById('winCopy').textContent='코드 복사';
  // 애니메이션 재시작
  overlay.classList.remove('show');void overlay.offsetWidth;
  stage.querySelectorAll('.emo,.extra').forEach(el=>{el.style.animation='none';void el.offsetWidth;el.style.animation='';});
  lastFocus=document.activeElement;
  overlay.classList.add('show');
  document.getElementById('winClose').focus();
  confetti(p.burst,p.accent);
  if(p.tier==='LEGENDARY'||p.tier==='EPIC')setTimeout(()=>confetti(Math.round(p.burst*.6),p.accent),650);
  if(navigator.vibrate)try{navigator.vibrate(p.tier==='LEGENDARY'?[60,40,60,40,120]:[40]);}catch(e){}
}
function hideWin(){overlay.classList.remove('show');if(lastFocus&&!lastFocus.disabled)lastFocus.focus();else userIdInput.focus();}
document.getElementById('winClose').addEventListener('click',hideWin);
overlay.addEventListener('click',e=>{if(e.target===overlay)hideWin();});
addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('show'))hideWin();});
document.getElementById('winCopy').addEventListener('click',async e=>{
  const code=document.getElementById('winCode').textContent;
  try{await navigator.clipboard.writeText(code);e.target.textContent='복사 완료 ✓';}
  catch(err){e.target.textContent='복사 실패';}
});
function getUsedIds(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}
  catch(e){return [];}
}
function normalizedId(value){return value.trim().toLocaleLowerCase();}
function updateIdStatus(){
  const id=normalizedId(userIdInput.value);
  const used=getUsedIds();
  const alreadyUsed=!!id && used.includes(id);
  if(alreadyUsed){
    idMessage.textContent='이미 참여한 아이디입니다. 동일 아이디는 다시 참여할 수 없습니다.';
    idMessage.style.color='#c45b55';
  }else{
    idMessage.textContent='동일 아이디는 한 번만 참여할 수 있습니다.';
    idMessage.style.color='#6c7d82';
  }
  spin.disabled=!id || alreadyUsed;
}
document.getElementById('weights').innerHTML=prizes.map(p=>`<div class="row"><span>${p.name}</span><strong>${p.weight}%</strong></div>`).join('');
function choosePrize(){
  let n=Math.random()*prizes.reduce((s,p)=>s+p.weight,0);
  for(let i=0;i<prizes.length;i++){n-=prizes[i].weight;if(n<0)return i;}
  return prizes.length-1;
}
userIdInput.addEventListener('input',updateIdStatus);
spin.addEventListener('click',()=>{
  const id=normalizedId(userIdInput.value);
  const used=getUsedIds();
  if(!id){out.textContent='먼저 참여 아이디를 입력해 주세요.';updateIdStatus();return;}
  if(used.includes(id)){out.textContent='이미 참여한 아이디입니다.';updateIdStatus();return;}
  // 참여 즉시 아이디를 저장해 중복 클릭으로 재추첨하지 못하게 합니다.
  used.push(id);
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(used));}
  catch(e){
    out.textContent='브라우저 저장을 사용할 수 없어 참여를 진행할 수 없습니다.';
    return;
  }
  spin.disabled=true;
  userIdInput.disabled=true;
  idMessage.textContent='참여가 접수되었습니다. 룰렛 결과를 확인해 주세요.';
  out.classList.remove('win');
  out.textContent='✨ 회전 중...';
  const i=choosePrize();
  const aim=360-(i*60+30);
  const delta=(aim-(current%360)+360)%360;
  current+=1800+delta;
  wheel.classList.add('spinning');
  wheel.style.transform=`rotate(${current}deg)`;
  setTimeout(()=>{
    const p=prizes[i];
    count++;
    log.unshift({id:id,name:p.name,emoji:p.emoji});
    wheel.classList.remove('spinning');
    out.innerHTML=`<span class="resEmoji">${p.emoji}</span>${esc(p.name)} 당첨!`;
    void out.offsetWidth;out.classList.add('win');
    document.getElementById('count').textContent=count+'회';
    hist.innerHTML=log.slice(0,8).map(x=>`<li>${x.emoji} ${esc(x.name)} <span class="muted">(${esc(x.id)})</span></li>`).join('');
    showWin(p);
    userIdInput.disabled=false;
    userIdInput.value='';
    updateIdStatus();
  },4200);
});
document.getElementById('reset').addEventListener('click',()=>{
  // 화면 기록만 초기화합니다. 중복 참여 방지용 아이디 기록은 보존됩니다.
  count=0;log=[];out.textContent='화면 기록을 초기화했습니다.';
  hist.innerHTML='<li>아직 기록이 없습니다.</li>';
  document.getElementById('count').textContent='0회';
  userIdInput.disabled=false;
  updateIdStatus();
});
updateIdStatus();
