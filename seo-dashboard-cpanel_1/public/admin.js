/* Basic deterrence only — client-side JS/HTML is always inspectable over the network,
   so this discourages casual copying but cannot stop a determined developer. */
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'f12') { e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i','j','c'].includes(k)) { e.preventDefault(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'u') { e.preventDefault(); return; }
});

const api={
  async get(u){const r=await fetch(u,{credentials:'include'});if(!r.ok)throw await r.json().catch(()=>({error:'Failed'}));return r.json();},
  async post(u,b){const r=await fetch(u,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});if(!r.ok)throw await r.json().catch(()=>({error:'Failed'}));return r.json();},
  async put(u,b){const r=await fetch(u,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(b||{})});if(!r.ok)throw await r.json().catch(()=>({error:'Failed'}));return r.json();},
  async del(u){const r=await fetch(u,{method:'DELETE',credentials:'include'});if(!r.ok)throw await r.json().catch(()=>({error:'Failed'}));return r.json();}
};

let PC=[],AK=[],AB=[],AA=[],AT=[],AN=[];
const CAMP_COLORS=['#e8304a','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#f97316'];
const BUDGET_COLORS=['#e8304a','#3b82f6','#22c55e','#f59e0b','#8b5cf6'];

function toast(msg,type='ok'){
  const t=document.getElementById('toast'),m=document.getElementById('toastMsg');
  t.className='toast show '+(type==='err'?'err':'ok');
  m.textContent=msg; clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),2600);
}
const fN=n=>Number(n||0).toLocaleString('en-US');
const fM=n=>{const v=Number(n||0);return v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':String(v);};
const f$=n=>(SS.billing_currency_symbol||'$')+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:0});
const fD=s=>{if(!s)return '—';const d=new Date(s);return isNaN(d)?s:d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});};
const pN=id=>{const p=PC.find(p=>p.id==id);return p?p.name:'—';};
const pO=sel=>'<option value="">— None —</option>'+PC.map(p=>`<option value="${p.id}" ${p.id==sel?'selected':''}>${e(p.name)}</option>`).join('');
function e(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const v=id=>(document.getElementById(id)||{}).value?.trim()||'';
const n=id=>{const x=(document.getElementById(id)||{}).value;return x===''?null:Number(x);};
const ck=id=>!!(document.getElementById(id)||{}).checked;

function drB(dr){const c=dr>=70?'dr-top':dr>=40?'dr-high':dr>=20?'dr-mid':'dr-low';return `<span class="dr ${c}">${dr}</span>`;}
function diffB(d){const c=d>=70?'diff-hard':d>=40?'diff-med':'diff-easy';return `<div class="diff-wrap ${c}"><div class="diff-track"><div class="diff-fill" style="width:${d}%"></div></div><span class="diff-val">${d}</span></div>`;}
function posC(cur,prev){if(!cur)return '<span class="pos-same">—</span>';const ch=(prev||cur)-cur;return ch>0?`<span class="pos-up">▲${ch}</span>`:ch<0?`<span class="pos-down">▼${Math.abs(ch)}</span>`:'<span class="pos-same">—</span>';}
function priB(p){return {high:'<span style="color:#ef4444;font-weight:700;font-size:12.5px">● High</span>',medium:'<span style="color:#f59e0b;font-weight:700;font-size:12.5px">● Medium</span>',low:'<span style="color:#22c55e;font-weight:700;font-size:12.5px">● Low</span>'}[p]||p;}
const PLAT_SVG={
  google:`<svg width="14" height="14" viewBox="0 0 48 48" style="vertical-align:-3px;margin-right:5px"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.8l6-6C33.6 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c2.8 0 5.3 1 7.3 2.8l6-6C33.6 6.5 29.1 4.5 24 4.5c-7.7 0-14.4 4.4-17.7 10.2z"/><path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.2-7.2 2.2-5.3 0-9.9-3.6-11.5-8.4l-6.5 5C9.4 39 16.1 43.5 24 43.5z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.7 5l6.2 5.2C40.8 35.6 43.5 30.2 43.5 24c0-1.2-.1-2.4-.4-3.5z"/></svg>`,
  meta:`<svg width="14" height="14" viewBox="0 0 48 48" style="vertical-align:-3px;margin-right:5px"><path fill="#0081FB" d="M9 24.6c0-6.4 3-11.8 7.3-11.8 2.6 0 4.7 1.7 7.4 5.8.3.5 1 .5 1.3 0 2.7-4.1 4.8-5.8 7.4-5.8 4.3 0 7.3 5.4 7.3 11.8 0 6.6-3 12-7 12-2.6 0-4.5-1.6-7.6-6.4-.3-.4-1-.4-1.3 0-3.1 4.8-5 6.4-7.6 6.4-4 0-7.2-5.4-7.2-12z"/></svg>`,
  bing:'🔷',linkedin:'💼',tiktok:'🎵'
};
function platB(p){const svg=PLAT_SVG[p];const label=(p||'').charAt(0).toUpperCase()+(p||'').slice(1);return svg?`${svg}${label}`:label;}
function typeI(t){return `<span class="notif-dot notif-dot-${t||'info'}"></span>`;}
function pubY(v){return v?'<span class="pub-yes">✓ Live</span>':'<span class="pub-no">—</span>';}
function badge(cls,txt){return `<span class="badge badge-${cls}">${txt}</span>`;}
function emptyR(cols,msg){return `<tr><td colspan="${cols}"><div class="empty-state">🔍 ${msg}</div></td></tr>`;}
function kebabMenu(key,itemsHtml){
  if(!canWrite())return '';
  return `<div class="kebab-wrap">
    <button class="kebab-btn" data-kebab="${key}">⋮</button>
    <div class="kebab-menu" data-kebab-menu="${key}">${itemsHtml}</div>
  </div>`;
}
function kebab(table,id,published){
  return kebabMenu(`${table}-${id}`,`
    <button class="kebab-item" data-edit="${table}" data-id="${id}">✏️ Edit</button>
    <button class="kebab-item" data-toggle-pub="${table}" data-id="${id}">${published?'👁️‍🗨️ Unpublish':'👁️ Publish'}</button>
    <button class="kebab-item danger" data-del="${table}" data-id="${id}">🗑️ Delete</button>
  `);
}

/* AUTH */
let currentRole='owner', currentSource='admin';
const ROLE_LABEL={owner:'Owner — full access',admin:'Admin — SEO data',client:'Client — view only'};
function canWrite(){return currentRole==='owner'||currentRole==='admin';}
async function preloadBranding(){
  try{const d=await fetch('/api/public/site').then(r=>r.json());applyBranding(d.settings||{});}catch(err){}
}
async function checkAuth(){
  await preloadBranding();
  const d=await api.get('/api/auth/me');
  if(d.authenticated){
    currentRole=d.role||'client';
    currentSource=d.source||'portal';
    document.getElementById('loginScreen').style.display='none';
    document.getElementById('dashboard').style.display='flex';
    const init=(d.admin.email[0]||'A').toUpperCase();
    ['sidebarAvatar','topbarAvatar'].forEach(id=>document.getElementById(id).textContent=init);
    document.getElementById('sidebarEmail').textContent=d.admin.email;
    const roleEl=document.getElementById('sidebarRole');
    if(roleEl)roleEl.textContent=ROLE_LABEL[currentRole]||currentRole;
    document.getElementById('topbarMenuEmail').textContent=d.admin.email;
    document.getElementById('topbarMenuRole').textContent=ROLE_LABEL[currentRole]||currentRole;
    document.querySelectorAll('[data-owner-only]').forEach(el=>el.style.display=currentRole==='owner'?'':'none');
    document.querySelectorAll('[data-write-only]').forEach(el=>el.style.display=canWrite()?'':'none');
    document.querySelectorAll('[data-admin-source-only]').forEach(el=>el.style.display=currentSource==='admin'?'':'none');
    initDash();
  } else {
    document.getElementById('loginScreen').style.display='flex';
    document.getElementById('dashboard').style.display='none';
  }
}
document.getElementById('loginBtn').addEventListener('click',async()=>{
  const errEl=document.getElementById('loginErr');
  errEl.classList.remove('show');
  const email=document.getElementById('loginEmail').value.trim(),password=document.getElementById('loginPassword').value;
  try{await api.post('/api/auth/login',{email,password});await checkAuth();return;}
  catch(adminErr){
    try{await api.post('/api/portal/login',{email,password});await checkAuth();return;}
    catch(portalErr){
      errEl.textContent=portalErr.error||adminErr.error||'Login failed';
      errEl.classList.add('show');
    }
  }
});
document.getElementById('loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('loginBtn').click();});
document.getElementById('logoutBtn').addEventListener('click',async()=>{await api.post('/api/auth/logout',{});location.reload();});
document.getElementById('topbarLogoutBtn').addEventListener('click',async()=>{await api.post('/api/auth/logout',{});location.reload();});

/* NAV */
let chartDays=90, perfSeries=null;
function initDash(){
  document.querySelectorAll('.nav-item[data-page]').forEach(item=>item.addEventListener('click',e=>{e.preventDefault();goTo(item.dataset.page);}));
  document.querySelectorAll('[data-goto]').forEach(el=>el.addEventListener('click',()=>goTo(el.dataset.goto)));
  document.getElementById('bellBtn').addEventListener('click',()=>goTo('notifications'));
  document.getElementById('insightsToggle').addEventListener('click',e=>{
    e.preventDefault();
    document.querySelector('.nav-folder').classList.toggle('open');
  });
  document.querySelectorAll('.chart-range-opt').forEach(opt=>opt.addEventListener('click',()=>{
    document.querySelectorAll('.chart-range-opt').forEach(t=>t.classList.remove('active'));
    opt.classList.add('active'); chartDays=Number(opt.dataset.days);
    renderPerfChart();
  }));
  document.addEventListener('click',e=>{
    if(!e.target.closest('.kebab-wrap')) document.querySelectorAll('.kebab-menu.open').forEach(m=>m.classList.remove('open'));
  });
  setupFilters();
  loadAll();
}
function goTo(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===name));
  const T={overview:'Overview',projects:'Projects',keywords:'Keywords',backlinks:'Backlinks',audit:'Site Audit','insights-impressions':'Impression Insights','insights-clicks':'Clicks Insights','insights-conversions':'Conversion Insights',ads:'Ads & Campaigns',billing:'Billing',tasks:'Tasks',notifications:'Notifications',users:'Users',settings:'Settings'};
  document.getElementById('topbarTitle').textContent=T[name]||name;
  if(name.startsWith('insights-')){
    document.querySelector('.nav-folder').classList.add('open');
    renderInsights(name.replace('insights-',''));
  }
  if(name.startsWith('insights-')){
    document.querySelector('.nav-folder').classList.add('open');
    renderInsightPage(name.replace('insights-',''));
  }
  if(name==='billing')renderBillingActivity();
  if(name==='audit')renderSiteAudit();
}

/* FILTERS */
function setupFilters(){
  document.getElementById('f-projects-q').addEventListener('input',renderProjects);
  document.getElementById('f-projects-st').addEventListener('change',renderProjects);
  document.getElementById('f-kw-q').addEventListener('input',renderKeywords);
  document.getElementById('f-kw-proj').addEventListener('change',renderKeywords);
  document.getElementById('f-bl-q').addEventListener('input',renderBacklinks);
  document.getElementById('f-bl-type').addEventListener('change',renderBacklinks);
  document.getElementById('f-bl-st').addEventListener('change',renderBacklinks);
  document.getElementById('f-ads-q').addEventListener('input',renderAds);
  document.getElementById('f-ads-plat').addEventListener('change',renderAds);
  document.getElementById('f-ads-st').addEventListener('change',renderAds);
  document.getElementById('f-tasks-q').addEventListener('input',renderTasks);
  document.getElementById('f-tasks-st').addEventListener('change',renderTasks);
  document.getElementById('f-tasks-pri').addEventListener('change',renderTasks);
}

async function loadAll(){
  try{PC=await api.get('/api/projects');}catch(err){}
  const sel=document.getElementById('f-kw-proj');
  const cur=sel.value;
  sel.innerHTML='<option value="">All projects</option>'+PC.map(p=>`<option value="${p.id}" ${p.id==cur?'selected':''}>${e(p.name)}</option>`).join('');
  // populate campaign filter
  const cf=document.getElementById('campaignFilter');
  cf.innerHTML='<option>All Campaigns</option>'+PC.map(p=>`<option>${e(p.name)}</option>`).join('');
  const tasks=[loadProjects(),loadKeywords(),loadBacklinks(),loadAds(),loadTasks(),loadNotifications()];
  if(currentRole==='owner') tasks.push(loadSettings(),loadUsers(),loadSignupRequests());
  await Promise.all(tasks);
  await loadOverview();
}

/* OVERVIEW */
let lastOverview=null;
async function loadOverview(){
  const o=await api.get('/api/overview');
  lastOverview=o;
  document.getElementById('ov-impr').textContent=fM(o.totalImpressions);
  document.getElementById('ov-clicks').textContent=fN(o.totalClicks);
  document.getElementById('ov-spend').textContent=f$(o.totalSpend);
  document.getElementById('ov-conv').textContent=fN(o.totalConversions);
  document.getElementById('ov-kw').textContent=fN(o.keywordCount);
  document.getElementById('ov-bl').textContent=fN(o.backlinkCount);
  document.getElementById('ov-proj').textContent=fN(o.projectCount);
  document.getElementById('ov-tasks').textContent=fN(o.openTasks);
  document.getElementById('ov-notifs').textContent=fN(o.unreadNotifications);
  const nb=document.getElementById('navBadge'),bd=document.getElementById('bellDot');
  if(o.unreadNotifications>0){nb.style.display='inline-block';nb.textContent=o.unreadNotifications;bd.style.display='block';bd.textContent=o.unreadNotifications;}
  else{nb.style.display='none';bd.style.display='none';}

  perfSeries=buildPerfSeries(o.totalClicks,o.totalImpressions);
  renderPerfChart();

  // Top campaigns table
  document.getElementById('ov-campaigns').innerHTML=AA.slice(0,4).map((a,i)=>{
    const roas=a.spend>0?((a.conversions*50)/a.spend).toFixed(1)+'x':'—';
    return `<tr>
      <td><span class="camp-dot" style="background:${CAMP_COLORS[i%CAMP_COLORS.length]}"></span><strong>${e(a.campaign_name)}</strong></td>
      <td>${badge(a.status,a.status)}</td>
      <td>${f$(a.spend)}</td>
      <td class="roas">${roas}</td>
    </tr>`;
  }).join('')||emptyR(4,'No campaigns yet');

  // Budget utilization
  const max=Math.max(1,...AA.map(a=>a.spend));
  document.getElementById('ov-budget').innerHTML=AA.slice(0,4).map((a,i)=>{
    const pct=Math.min(100,Math.round((a.spend/max)*100));
    return `<div class="budget-item">
      <div class="budget-row"><span class="budget-name">${e(a.campaign_name.length>22?a.campaign_name.slice(0,22)+'…':a.campaign_name)}</span><span class="budget-pct">${pct}%</span></div>
      <div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${BUDGET_COLORS[i%BUDGET_COLORS.length]}"></div></div>
    </div>`;
  }).join('')||'<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No data</p>';

  renderTrafficSources();
  renderKeywordDistribution();
}

/* ===== TRAFFIC SOURCES (donut) ===== */
const TRAFFIC_COLORS=['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'];
function renderTrafficSources(){
  const host=document.getElementById('ov-traffic-sources');
  if(!host)return;
  if(!AA.length){host.innerHTML='<p style="color:var(--text-muted);font-size:13px;padding:16px 20px">No campaign data yet</p>';return;}
  const byPlat={};
  AA.forEach(a=>{byPlat[a.platform]=(byPlat[a.platform]||0)+Number(a.impressions||0);});
  let entries=Object.entries(byPlat).sort((a,b)=>b[1]-a[1]);
  if(entries.length>4){
    const rest=entries.slice(3).reduce((a,[,v])=>a+v,0);
    entries=[...entries.slice(0,3),['other',rest]];
  }
  const total=entries.reduce((a,[,v])=>a+v,0)||1;
  const platLbl={google:'Google Ads',meta:'Meta',bing:'Bing',linkedin:'LinkedIn',tiktok:'TikTok',other:'Other'};
  const R=70,CX=100,CY=100,STROKE=26;
  const circumference=2*Math.PI*R;
  let offset=0;
  const segs=entries.map(([plat,val],i)=>{
    const pct=val/total;
    const dash=pct*circumference;
    const seg=`<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${TRAFFIC_COLORS[i%TRAFFIC_COLORS.length]}" stroke-width="${STROKE}"
      stroke-dasharray="${dash.toFixed(2)} ${(circumference-dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" stroke-linecap="round" transform="rotate(-90 ${CX} ${CY})"/>`;
    offset+=dash;
    return seg;
  }).join('');
  host.innerHTML=`
    <div style="padding:8px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:20px">
      <svg width="200" height="200" viewBox="0 0 200 200" style="filter:drop-shadow(0 6px 14px rgba(0,0,0,.06))">${segs}</svg>
      <div style="width:100%">
        ${entries.map(([plat,val],i)=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;${i>0?'border-top:1px solid var(--border)':''}">
          <div style="display:flex;align-items:center;gap:9px"><span style="width:10px;height:10px;border-radius:50%;background:${TRAFFIC_COLORS[i%TRAFFIC_COLORS.length]};flex-shrink:0"></span><span style="font-size:13.5px;color:var(--text-2);font-weight:500">${platLbl[plat]||plat}</span></div>
          <span style="font-weight:700;font-size:14px">${Math.round(val/total*100)}%</span>
        </div>`).join('')}
      </div>
    </div>`;
}

/* ===== KEYWORD POSITION DISTRIBUTION (bar chart) ===== */
function renderKeywordDistribution(){
  const host=document.getElementById('ov-keyword-dist');
  if(!host)return;
  const buckets=[{label:'1-3',min:1,max:3},{label:'4-10',min:4,max:10},{label:'11-20',min:11,max:20},{label:'21-50',min:21,max:50},{label:'51-100',min:51,max:100},{label:'101-150',min:101,max:150}];
  const counts=buckets.map(b=>AK.filter(k=>k.position>=b.min&&k.position<=b.max).length);
  if(!AK.length){host.innerHTML='<p style="color:var(--text-muted);font-size:13px;padding:16px 20px">No tracked keywords yet</p>';return;}
  const W=460,H=230,padL=36,padR=10,padT=10,padB=26;
  const plotW=W-padL-padR,plotH=H-padT-padB;
  const maxV=niceMax(Math.max(1,...counts)*1.15);
  const bw=plotW/buckets.length;
  const ticks=4;
  const gridY=[...Array(ticks+1)].map((_,i)=>padT+plotH-(i/ticks)*plotH);
  const tickLbls=[...Array(ticks+1)].map((_,i)=>Math.round((i/ticks)*maxV));
  const bars=counts.map((c,i)=>{
    const h=(c/maxV)*plotH;
    const x=padL+i*bw+bw*0.22;
    const barW=bw*0.56;
    const y=padT+plotH-h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(2,h).toFixed(1)}" rx="5" fill="#3b82f6"/>`;
  }).join('');
  const xLabels=buckets.map((b,i)=>`<text class="perf-axis-label" x="${(padL+i*bw+bw/2).toFixed(1)}" y="${H-6}" text-anchor="middle">${b.label}</text>`).join('');
  host.innerHTML=`
    <div style="padding:8px 20px 18px">
      <svg viewBox="0 0 ${W} ${H}" class="perf-chart-svg" preserveAspectRatio="xMidYMid meet">
        ${gridY.map(y=>`<line class="perf-grid-line" x1="${padL}" x2="${W-padR}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>`).join('')}
        ${gridY.map((y,i)=>`<text class="perf-axis-label" x="${padL-8}" y="${(y+4).toFixed(1)}" text-anchor="end">${tickLbls[i]}</text>`).join('')}
        ${bars}
        ${xLabels}
      </svg>
    </div>`;
}
function seededRand(seed){let x=Math.sin(seed)*10000;return x-Math.floor(x);}
function buildPerfSeries(totalClicks,totalImpressions,days=180){
  totalClicks=Number(totalClicks||0); totalImpressions=Number(totalImpressions||0);
  const today=new Date(); today.setHours(0,0,0,0);
  const pts=[];
  const cWeights=[],iWeights=[];
  for(let i=0;i<days;i++){
    // gentle wave + noise so it reads like real traffic, not a flat line
    const wave=Math.sin(i/6)*0.5+Math.sin(i/17)*0.3+1;
    cWeights.push(Math.max(0,wave*0.6+seededRand(i*13.37)*1.4));
    iWeights.push(Math.max(0,wave*0.7+seededRand(i*7.91+3)*1.6));
  }
  const cSum=cWeights.reduce((a,b)=>a+b,0)||1, iSum=iWeights.reduce((a,b)=>a+b,0)||1;
  for(let i=0;i<days;i++){
    const d=new Date(today); d.setDate(d.getDate()-(days-1-i));
    pts.push({
      date:d,
      clicks:Math.round((cWeights[i]/cSum)*totalClicks),
      impressions:Math.round((iWeights[i]/iSum)*totalImpressions)
    });
  }
  return pts;
}
function niceMax(v){
  if(v<=0)return 4;
  const mag=Math.pow(10,Math.floor(Math.log10(v)));
  const norm=v/mag;
  const step=norm<=1?1:norm<=2?2:norm<=5?5:10;
  return step*mag;
}
function renderPerfChart(){
  const host=document.getElementById('perfChart');
  if(!perfSeries||!perfSeries.length){host.innerHTML='<p style="color:var(--text-muted);font-size:13px;padding:10px">No data</p>';return;}
  const data=perfSeries.slice(-chartDays);
  const W=1000,H=280,padL=42,padR=48,padT=18,padB=30;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const clickMax=niceMax(Math.max(...data.map(d=>d.clicks))*1.15);
  const imprMax=niceMax(Math.max(...data.map(d=>d.impressions))*1.15);
  const xAt=i=>padL+(data.length<=1?0:(i/(data.length-1))*plotW);
  const yClick=v=>padT+plotH-(v/clickMax)*plotH;
  const yImpr=v=>padT+plotH-(v/imprMax)*plotH;
  const pathOf=(getY,key)=>data.map((d,i)=>`${i===0?'M':'L'}${xAt(i).toFixed(2)},${getY(d[key]).toFixed(2)}`).join(' ');
  const clickPath=pathOf(yClick,'clicks');
  const imprPath=pathOf(yImpr,'impressions');
  const areaPath=`${clickPath} L${xAt(data.length-1).toFixed(2)},${padT+plotH} L${padL},${padT+plotH} Z`;
  const ticks=4;
  const gridY=[...Array(ticks+1)].map((_,i)=>padT+plotH-(i/ticks)*plotH);
  const clickTickLbls=[...Array(ticks+1)].map((_,i)=>Math.round((i/ticks)*clickMax));
  const imprTickLbls=[...Array(ticks+1)].map((_,i)=>Math.round((i/ticks)*imprMax));
  const xLabelCount=Math.min(7,data.length);
  const xLabels=[...Array(xLabelCount)].map((_,i)=>{
    const idx=Math.round((i/(xLabelCount-1||1))*(data.length-1));
    return {idx,txt:data[idx].date.toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'2-digit'})};
  });
  const dots=data.map((d,i)=>`
    <circle class="perf-dot" data-i="${i}" cx="${xAt(i).toFixed(2)}" cy="${yClick(d.clicks).toFixed(2)}" r="4" fill="#5aa9f8" stroke="#fff" stroke-width="2"></circle>
    <circle class="perf-dot" data-i="${i}" cx="${xAt(i).toFixed(2)}" cy="${yImpr(d.impressions).toFixed(2)}" r="4" fill="#5b3ec8" stroke="#fff" stroke-width="2"></circle>`).join('');

  host.innerHTML=`
    <svg class="perf-chart-svg" viewBox="0 0 ${W} ${H+26}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="perfGradClicks" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5aa9f8" stop-opacity=".18"/>
          <stop offset="100%" stop-color="#5aa9f8" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <text x="${padL}" y="12" class="perf-axis-title">Clicks</text>
      <text x="${W-padR}" y="12" class="perf-axis-title" text-anchor="end">Impressions</text>
      ${gridY.map(y=>`<line class="perf-grid-line" x1="${padL}" x2="${W-padR}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}"/>`).join('')}
      ${gridY.map((y,i)=>`<text class="perf-axis-label" x="${padL-10}" y="${(y+4).toFixed(2)}" text-anchor="end">${fM(clickTickLbls[i])}</text>`).join('')}
      ${gridY.map((y,i)=>`<text class="perf-axis-label" x="${W-padR+10}" y="${(y+4).toFixed(2)}" text-anchor="start">${fM(imprTickLbls[i])}</text>`).join('')}
      ${xLabels.map(l=>`<text class="perf-axis-label" x="${xAt(l.idx).toFixed(2)}" y="${H+18}" text-anchor="middle">${l.txt}</text>`).join('')}
      <path class="perf-area-clicks" d="${areaPath}"></path>
      <path class="perf-line-clicks" d="${clickPath}"></path>
      <path class="perf-line-impr" d="${imprPath}"></path>
      <g id="perfDots">${dots}</g>
      <line id="perfHoverLine" class="perf-hover-line" x1="0" x2="0" y1="${padT}" y2="${padT+plotH}"></line>
      <rect class="perf-hit" x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" id="perfHitArea"></rect>
    </svg>
    <div class="perf-legend">
      <div class="perf-legend-item"><span class="perf-legend-swatch" style="background:#5aa9f8"></span>Clicks</div>
      <div class="perf-legend-item"><span class="perf-legend-swatch" style="background:#5b3ec8"></span>Impressions</div>
    </div>
    <div class="perf-tooltip" id="perfTooltip"></div>`;

  const hit=document.getElementById('perfHitArea'),svg=host.querySelector('svg'),tip=document.getElementById('perfTooltip'),hoverLine=document.getElementById('perfHoverLine');
  hit.addEventListener('mousemove',ev=>{
    const rect=svg.getBoundingClientRect();
    const svgX=((ev.clientX-rect.left)/rect.width)*W;
    let i=Math.round(((svgX-padL)/plotW)*(data.length-1));
    i=Math.max(0,Math.min(data.length-1,i));
    const d=data[i];
    document.querySelectorAll('.perf-dot').forEach(dot=>dot.style.opacity=Number(dot.dataset.i)===i?'1':'0');
    hoverLine.setAttribute('x1',xAt(i));hoverLine.setAttribute('x2',xAt(i));hoverLine.style.opacity='1';
    tip.innerHTML=`<div class="tt-date">${d.date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
      <div class="tt-row"><span class="tt-dot" style="background:#5aa9f8"></span>Clicks: <strong>${fN(d.clicks)}</strong></div>
      <div class="tt-row"><span class="tt-dot" style="background:#5b3ec8"></span>Impressions: <strong>${fN(d.impressions)}</strong></div>`;
    const hostRect=host.getBoundingClientRect();
    let left=((xAt(i)/W)*hostRect.width)+14, top=10;
    if(left>hostRect.width-150) left-=170;
    tip.style.left=left+'px'; tip.style.top=top+'px'; tip.style.opacity='1';
  });
  hit.addEventListener('mouseleave',()=>{
    document.querySelectorAll('.perf-dot').forEach(dot=>dot.style.opacity='0');
    hoverLine.style.opacity='0'; tip.style.opacity='0';
  });
}

/* INSIGHTS & REPORTS (impressions / clicks / conversions) */
const METRIC_META={
  impressions:{color:'#5b3ec8',label:'Impressions',seedOffset:0,format:fM,hasBonus:true},
  clicks:{color:'#5aa9f8',label:'Clicks',seedOffset:100,format:fN,hasBonus:true},
  conversions:{color:'#22c55e',label:'Conversions',seedOffset:200,format:fN,hasBonus:false}
};
function buildSingleSeries(total,seedOffset,days=90){
  total=Number(total||0);
  const today=new Date(); today.setHours(0,0,0,0);
  const weights=[];
  for(let i=0;i<days;i++){
    const wave=Math.sin((i+seedOffset)/6)*0.5+Math.sin((i+seedOffset)/17)*0.3+1;
    weights.push(Math.max(0,wave*0.6+seededRand((i+seedOffset)*13.37)*1.4));
  }
  const sum=weights.reduce((a,b)=>a+b,0)||1;
  return weights.map((w,i)=>{
    const d=new Date(today); d.setDate(d.getDate()-(days-1-i));
    return {date:d,value:Math.round((w/sum)*total)};
  });
}
function renderMiniLineChart(data,color){
  const W=1000,H=220,padL=10,padR=10,padT=14,padB=26;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const max=niceMax(Math.max(...data.map(d=>d.value))*1.15);
  const xAt=i=>padL+(data.length<=1?0:(i/(data.length-1))*plotW);
  const yAt=v=>padT+plotH-(v/max)*plotH;
  const path=data.map((d,i)=>`${i===0?'M':'L'}${xAt(i).toFixed(2)},${yAt(d.value).toFixed(2)}`).join(' ');
  const area=`${path} L${xAt(data.length-1).toFixed(2)},${padT+plotH} L${padL},${padT+plotH} Z`;
  const xLabelCount=Math.min(6,data.length);
  const xLabels=[...Array(xLabelCount)].map((_,i)=>{
    const idx=Math.round((i/(xLabelCount-1||1))*(data.length-1));
    return {idx,txt:data[idx].date.toLocaleDateString('en-US',{month:'numeric',day:'numeric'})};
  });
  return `<svg class="perf-chart-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity=".22"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${xLabels.map(l=>`<text class="perf-axis-label" x="${xAt(l.idx).toFixed(2)}" y="${H-6}" text-anchor="middle">${l.txt}</text>`).join('')}
    <path fill="url(#miniGrad)" d="${area}"></path>
    <path fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" d="${path}"></path>
  </svg>`;
}
function renderInsights(metric){
  const meta=METRIC_META[metric]; if(!meta)return;
  const host=document.getElementById('insights-'+metric+'-body');
  if(!host)return;
  const rawTotal=AA.reduce((s,a)=>s+Number(a[metric]||0),0);
  const bonus=meta.hasBonus&&lastOverview?(metric==='impressions'?lastOverview.totalImpressions-AA.reduce((s,a)=>s+Number(a.impressions||0),0):lastOverview.totalClicks-AA.reduce((s,a)=>s+Number(a.clicks||0),0)):0;
  const total=rawTotal+Math.max(0,bonus);
  const series=buildSingleSeries(total,meta.seedOffset);
  const last7=series.slice(-7).reduce((s,d)=>s+d.value,0);
  const prev7=series.slice(-14,-7).reduce((s,d)=>s+d.value,0);
  const change=prev7>0?Math.round(((last7-prev7)/prev7)*100):0;
  const dailyAvg=Math.round(total/series.length);
  const ranked=[...AA].sort((a,b)=>Number(b[metric]||0)-Number(a[metric]||0)).slice(0,6);
  const maxRanked=Math.max(1,...ranked.map(a=>Number(a[metric]||0)));

  host.innerHTML=`
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi-card"><div class="kpi-label">Total ${meta.label.toLowerCase()}</div><div class="kpi-value">${meta.format(total)}</div><div class="kpi-sub" style="color:${change>=0?'#059669':'var(--red)'}">${change>=0?'▲':'▼'} ${Math.abs(change)}% vs previous 7 days</div></div>
      <div class="kpi-card"><div class="kpi-label">Daily average</div><div class="kpi-value">${meta.format(dailyAvg)}</div><div class="kpi-sub">Across the last ${series.length} days</div></div>
      <div class="kpi-card"><div class="kpi-label">Last 7 days</div><div class="kpi-value">${meta.format(last7)}</div><div class="kpi-sub">${meta.format(prev7)} in the 7 days before</div></div>
      <div class="kpi-card"><div class="kpi-label">Campaigns tracked</div><div class="kpi-value">${AA.length}</div><div class="kpi-sub">Live &amp; paused combined</div></div>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><h3>${meta.label} trend — last 90 days</h3></div>
      <div class="perf-chart-area">${renderMiniLineChart(series,meta.color)}</div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>By campaign</h3></div>
      <div style="padding:6px 20px 20px">
        ${ranked.map((a,i)=>{
          const val=Number(a[metric]||0), pct=Math.round((val/maxRanked)*100);
          return `<div class="budget-item">
            <div class="budget-row"><span class="budget-name">${e(a.campaign_name)}</span><span class="budget-pct">${meta.format(val)}</span></div>
            <div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${BUDGET_COLORS[i%BUDGET_COLORS.length]}"></div></div>
          </div>`;
        }).join('')||'<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No campaigns yet</p>'}
      </div>
    </div>`;
}

/* ===== INSIGHTS & REPORTS ===== */
const INSIGHT_META={
  impressions:{label:'Impressions',color:'#5b3ec8',fmt:fM,icon:'👁️'},
  clicks:{label:'Clicks',color:'#5aa9f8',fmt:fN,icon:'🖱️'},
  conversions:{label:'Conversions',color:'#22c55e',fmt:fN,icon:'🎯'}
};
function buildSingleSeries(total,days=180){
  total=Number(total||0);
  const today=new Date(); today.setHours(0,0,0,0);
  const weights=[];
  for(let i=0;i<days;i++){
    const wave=Math.sin(i/6)*0.5+Math.sin(i/17)*0.3+1;
    weights.push(Math.max(0,wave*0.65+seededRand(i*11.3+9)*1.5));
  }
  const sum=weights.reduce((a,b)=>a+b,0)||1;
  return [...Array(days)].map((_,i)=>{
    const d=new Date(today); d.setDate(d.getDate()-(days-1-i));
    return {date:d,value:Math.round((weights[i]/sum)*total)};
  });
}
const insightRange={impressions:'all',clicks:'all',conversions:'all'};
const RANGE_DAYS={'7d':7,'28d':28,'90d':90,'all':180};
function renderInsightPage(metric){
  const meta=INSIGHT_META[metric];
  const host=document.getElementById(`insights-${metric}-body`);
  if(!host||!lastOverview)return;
  const range=insightRange[metric]||'all';
  const days=RANGE_DAYS[range];
  const totalKey='total'+metric[0].toUpperCase()+metric.slice(1);
  const allTimeTotal=lastOverview[totalKey]||0;
  const fullSeries=metric==='conversions'?buildSingleSeries(allTimeTotal):(perfSeries||buildPerfSeries(lastOverview.totalClicks,lastOverview.totalImpressions)).map(d=>({date:d.date,value:d[metric]}));
  const series=range==='all'?fullSeries:fullSeries.slice(-days);
  const total=range==='all'?allTimeTotal:series.reduce((a,d)=>a+d.value,0);
  const half=Math.max(1,Math.floor(series.length/2));
  const recentHalf=series.slice(-half).reduce((a,d)=>a+d.value,0);
  const priorHalf=series.slice(-half*2,-half).reduce((a,d)=>a+d.value,0);
  const trendPct=priorHalf>0?Math.round(((recentHalf-priorHalf)/priorHalf)*100):0;
  const dailyAvg=Math.round(total/(series.length||1));
  const ranked=[...AA].sort((a,b)=>Number(b[metric]||0)-Number(a[metric]||0)).slice(0,6);
  const maxVal=Math.max(1,...ranked.map(a=>Number(a[metric]||0)));
  const rangeLbl={'7d':'7 days','28d':'28 days','90d':'3 months','all':'all time'};

  host.innerHTML=`
    <div class="chart-range" style="width:fit-content;margin-bottom:16px">
      ${['7d','28d','90d','all'].map(r=>`<div class="chart-range-opt ${r===range?'active':''}" data-insight-range="${r}">${rangeLbl[r][0].toUpperCase()+rangeLbl[r].slice(1)}</div>`).join('')}
    </div>
    <div class="stat-grid" style="margin-bottom:16px">
      <div class="stat-card"><div class="stat-label">${meta.icon} Total ${meta.label} <span style="color:var(--text-muted);font-weight:500">(${rangeLbl[range]})</span></div><div class="stat-value">${meta.fmt(total)}</div></div>
      <div class="stat-card"><div class="stat-label">Daily average <span style="color:var(--text-muted);font-weight:500">(${rangeLbl[range]})</span></div><div class="stat-value">${meta.fmt(dailyAvg)}</div></div>
      <div class="stat-card"><div class="stat-label">Trend <span style="color:var(--text-muted);font-weight:500">(vs prior period)</span></div><div class="stat-value" style="color:${trendPct>=0?'#22c55e':'#ef4444'}">${trendPct>=0?'▲':'▼'} ${Math.abs(trendPct)}%</div></div>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <div class="panel-head"><h3>${meta.label} over time</h3></div>
      <div class="perf-chart-area"><div id="insight-chart-${metric}"></div></div>
    </div>
    <div class="panel">
      <div class="panel-head"><h3>Top campaigns by ${meta.label.toLowerCase()}</h3></div>
      <div style="padding:6px 20px 20px">${ranked.map(a=>{
        const val=Number(a[metric]||0),pct=Math.round((val/maxVal)*100);
        return `<div class="budget-item">
          <div class="budget-row"><span class="budget-name">${e(a.campaign_name)}</span><span class="budget-pct">${meta.fmt(val)}</span></div>
          <div class="budget-track"><div class="budget-fill" style="width:${pct}%;background:${meta.color}"></div></div>
        </div>`;
      }).join('')||'<p style="color:var(--text-muted);font-size:13px;padding:8px 0">No campaigns yet</p>'}</div>
    </div>`;
  renderSingleLineChart(`insight-chart-${metric}`,series,meta);
  host.querySelectorAll('[data-insight-range]').forEach(opt=>opt.addEventListener('click',()=>{
    insightRange[metric]=opt.dataset.insightRange;
    renderInsightPage(metric);
  }));
}
function renderSingleLineChart(hostId,data,meta){
  const host=document.getElementById(hostId);
  if(!host||!data.length)return;
  const W=1000,H=220,padL=48,padR=20,padT=16,padB=28;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const maxV=niceMax(Math.max(...data.map(d=>d.value))*1.15);
  const xAt=i=>padL+(data.length<=1?0:(i/(data.length-1))*plotW);
  const yAt=v=>padT+plotH-(v/maxV)*plotH;
  const path=data.map((d,i)=>`${i===0?'M':'L'}${xAt(i).toFixed(2)},${yAt(d.value).toFixed(2)}`).join(' ');
  const areaPath=`${path} L${xAt(data.length-1).toFixed(2)},${padT+plotH} L${padL},${padT+plotH} Z`;
  const ticks=4;
  const gridY=[...Array(ticks+1)].map((_,i)=>padT+plotH-(i/ticks)*plotH);
  const tickLbls=[...Array(ticks+1)].map((_,i)=>Math.round((i/ticks)*maxV));
  const xLabelCount=Math.min(7,data.length);
  const xLabels=[...Array(xLabelCount)].map((_,i)=>{
    const idx=Math.round((i/(xLabelCount-1||1))*(data.length-1));
    return {idx,txt:data[idx].date.toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'2-digit'})};
  });
  const gid='grad-'+hostId;
  const dots=data.map((d,i)=>`<circle class="perf-dot" data-i="${i}" cx="${xAt(i).toFixed(2)}" cy="${yAt(d.value).toFixed(2)}" r="4" fill="${meta.color}" stroke="#fff" stroke-width="2"></circle>`).join('');
  host.innerHTML=`<svg class="perf-chart-svg" viewBox="0 0 ${W} ${H+22}" preserveAspectRatio="none">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${meta.color}" stop-opacity=".22"/>
      <stop offset="100%" stop-color="${meta.color}" stop-opacity="0"/>
    </linearGradient></defs>
    ${gridY.map(y=>`<line class="perf-grid-line" x1="${padL}" x2="${W-padR}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}"/>`).join('')}
    ${gridY.map((y,i)=>`<text class="perf-axis-label" x="${padL-10}" y="${(y+4).toFixed(2)}" text-anchor="end">${meta.fmt(tickLbls[i])}</text>`).join('')}
    ${xLabels.map(l=>`<text class="perf-axis-label" x="${xAt(l.idx).toFixed(2)}" y="${H+16}" text-anchor="middle">${l.txt}</text>`).join('')}
    <path fill="url(#${gid})" d="${areaPath}"></path>
    <path fill="none" stroke="${meta.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" d="${path}"></path>
    <g>${dots}</g>
    <line class="perf-hover-line" id="hoverline-${hostId}" x1="0" x2="0" y1="${padT}" y2="${padT+plotH}"></line>
    <rect class="perf-hit" x="${padL}" y="${padT}" width="${plotW}" height="${plotH}" id="hit-${hostId}"></rect>
  </svg>
  <div class="perf-tooltip" id="tip-${hostId}"></div>`;

  const hit=document.getElementById(`hit-${hostId}`),svg=host.querySelector('svg'),tip=document.getElementById(`tip-${hostId}`),hoverLine=document.getElementById(`hoverline-${hostId}`);
  hit.addEventListener('mousemove',ev=>{
    const rect=svg.getBoundingClientRect();
    const svgX=((ev.clientX-rect.left)/rect.width)*W;
    let i=Math.round(((svgX-padL)/plotW)*(data.length-1));
    i=Math.max(0,Math.min(data.length-1,i));
    const d=data[i];
    host.querySelectorAll('.perf-dot').forEach(dot=>dot.style.opacity=Number(dot.dataset.i)===i?'1':'0');
    hoverLine.setAttribute('x1',xAt(i));hoverLine.setAttribute('x2',xAt(i));hoverLine.style.opacity='1';
    tip.innerHTML=`<div class="tt-date">${d.date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
      <div class="tt-row"><span class="tt-dot" style="background:${meta.color}"></span>${meta.label}: <strong>${meta.fmt(d.value)}</strong></div>`;
    const hostRect=host.getBoundingClientRect();
    let left=((xAt(i)/W)*hostRect.width)+14, top=10;
    if(left>hostRect.width-150) left-=170;
    tip.style.left=left+'px'; tip.style.top=top+'px'; tip.style.opacity='1';
  });
  hit.addEventListener('mouseleave',()=>{
    host.querySelectorAll('.perf-dot').forEach(dot=>dot.style.opacity='0');
    hoverLine.style.opacity='0'; tip.style.opacity='0';
  });
}
/* ===== BILLING ===== */
document.querySelectorAll('#billingTabs .chart-range-opt').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('#billingTabs .chart-range-opt').forEach(o=>o.classList.remove('active'));
  t.classList.add('active');
  document.querySelectorAll('.billing-tab').forEach(p=>p.classList.remove('active'));
  const tab=t.dataset.btab;
  document.getElementById('billing-'+tab).classList.add('active');
  if(tab==='activity')renderBillingActivity();
  if(tab==='methods')renderPaymentMethods();
}));
let ABI=[];
let pendingBillMonth='';
function openBillModal(monthKey,existing){
  pendingBillMonth=monthKey;
  openM('bill',existing||null);
}
async function renderBillingActivity(){
  const host=document.getElementById('billing-activity');
  if(!host)return;
  try{ABI=await api.get('/api/bills');}catch(err){ABI=[];}
  const today=new Date();
  const months=[...Array(12)].map((_,i)=>{
    const d=new Date(today.getFullYear(),today.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return {key,label:d.toLocaleDateString('en-US',{month:'long',year:'numeric'}),bill:ABI.find(b=>b.month===key)};
  });
  const statusLbl={pending:'⏳ Pending',paid:'✅ Paid',overdue:'⚠️ Overdue'};

  let activityHtml;
  if(!AA.length){
    activityHtml=`<div class="panel" style="margin-bottom:16px"><div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Interactions</th><th>Costs</th><th>Credits</th><th>Running balance</th></tr></thead>
      <tbody><tr><td colspan="7"><div class="empty-state">You don't have any entries yet</div></td></tr></tbody>
    </table></div></div>`;
  } else {
    const sorted=[...AA].sort((a,b)=>a.id-b.id);
    let running=0;
    const rows=sorted.map((a,i)=>{
      const d=new Date(today); d.setDate(d.getDate()-(sorted.length-1-i)*3);
      running+=Number(a.spend||0);
      return {date:d,desc:`${e(a.campaign_name)} <span style="color:var(--text-muted)">·</span> ${platB(a.platform)}`,interactions:a.clicks,cost:a.spend,balance:running};
    }).reverse();
    activityHtml=`<div class="panel" style="margin-bottom:16px"><div class="table-wrap"><table>
      <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Interactions</th><th>Costs</th><th>Credits</th><th>Running balance</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td style="white-space:nowrap;color:var(--text-muted);font-size:12.5px">${r.date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
        <td>Campaign Spend</td>
        <td>${r.desc}</td>
        <td>${fN(r.interactions)}</td>
        <td>${f$(r.cost)}</td>
        <td>${f$(0)}</td>
        <td style="font-weight:700">${f$(r.balance)}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
  }

  host.innerHTML=`${activityHtml}
    <div class="panel">
      <div class="panel-head"><h3>Monthly bills</h3>${canWrite()?'<button class="btn btn-primary btn-sm" id="newBillBtn">+ New Bill</button>':''}</div>
      <div class="table-wrap"><table>
        <thead><tr><th>Month</th><th>Amount</th><th>Status</th><th>Notes</th></tr></thead>
        <tbody>${months.map(m=>`<tr class="${canWrite()?'billing-month-row':''}" ${canWrite()?`data-bill-month="${m.key}"`:''} style="${canWrite()?'cursor:pointer':''}">
          <td><strong>${m.label}</strong></td>
          <td>${m.bill?f$(m.bill.amount):'<span style="color:var(--text-muted)">No bill yet</span>'}</td>
          <td>${m.bill?badge(m.bill.status,statusLbl[m.bill.status]||m.bill.status):''}</td>
          <td style="color:var(--text-muted);font-size:12.5px">${m.bill?e(m.bill.notes||'—'):'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
  if(!canWrite())return;
  document.getElementById('newBillBtn').addEventListener('click',()=>openBillModal(months[0].key,null));
  host.querySelectorAll('[data-bill-month]').forEach(row=>row.addEventListener('click',()=>{
    const key=row.dataset.billMonth;
    const existing=ABI.find(b=>b.month===key);
    openBillModal(key,existing||null);
  }));
}
const PM_ICON={
  netbanking:`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6"/><rect x="4" y="10" width="16" height="9" rx="1"/><line x1="4" y1="19" x2="20" y2="19" stroke-width="2.4"/><line x1="7" y1="13" x2="7" y2="17"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="17" y1="13" x2="17" y2="17"/></svg>`,
  upi:`<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 12L14 4v6h6L10 20v-6H4z" fill="#097939"/><path d="M4 12L14 4v6h2L6 18v-4H4z" fill="#ED6D23" opacity=".85"/></svg>`,
  card:'💳',paypal:'🅿️',other:'💰'
};
const PM_LABEL={netbanking:'NetBanking',upi:'UPI',card:'Card',paypal:'PayPal',other:'Other'};
async function renderPaymentMethods(){
  const host=document.getElementById('billing-methods');
  if(!host)return;
  let methods=[];
  try{methods=await api.get('/api/payment_methods');}catch(err){}
  host.innerHTML=`<div class="pm-grid" id="pmGrid"></div>`;
  const grid=document.getElementById('pmGrid');
  grid.innerHTML=methods.map(m=>`
    <div class="pm-card">
      <div class="pm-card-body">
        <div class="pm-icon">${PM_ICON[m.type]||'💰'}</div>
        <div><div class="pm-name">${e(m.label)}</div><div class="pm-sub">${PM_LABEL[m.type]||'Payment method'}</div></div>
      </div>
      ${canWrite()?`<div class="pm-card-foot"><span class="pm-remove" data-pm-remove="${m.id}">REMOVE</span></div>`:''}
    </div>`).join('');
  if(canWrite()){
    grid.insertAdjacentHTML('beforeend',`
      <div class="pm-add-card" id="pmAddTrigger">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="12" y1="15" x2="12" y2="15" stroke-width="3" stroke-linecap="round"/></svg>
        ADD PAYMENT METHOD
      </div>
      <div class="pm-card" id="pmAddForm" style="display:none">
        <div class="modal-body" style="border:none">
          <div class="form-field"><label class="form-label">Type</label>
            <select class="form-select" id="pmType">
              <option value="netbanking">NetBanking</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-field"><label class="form-label">Label</label><input class="form-input" id="pmLabel" placeholder="e.g. HDFC Bank"></div>
          <button class="btn btn-primary" id="pmSaveBtn" style="width:100%;justify-content:center">Add method</button>
        </div>
      </div>`);
    document.getElementById('pmAddTrigger').addEventListener('click',()=>{
      document.getElementById('pmAddTrigger').style.display='none';
      document.getElementById('pmAddForm').style.display='block';
    });
    document.getElementById('pmSaveBtn').addEventListener('click',async()=>{
      const type=v('pmType'),label=v('pmLabel');
      if(!label){toast('Enter a label','err');return;}
      try{await api.post('/api/payment_methods',{type,label});toast('Payment method added ✓');await renderPaymentMethods();}
      catch(err){toast(err.error||'Failed to add','err');}
    });
    grid.querySelectorAll('[data-pm-remove]').forEach(btn=>btn.addEventListener('click',async()=>{
      if(!confirm('Remove this payment method?'))return;
      await api.del(`/api/payment_methods/${btn.dataset.pmRemove}`);
      toast('Removed','err');
      await renderPaymentMethods();
    }));
  }
}

/* ===== SITE AUDIT ===== */
function scoreFromPosition(pos){
  if(!pos||pos<=0)return 40;
  if(pos<=3)return 96;
  if(pos<=10)return 84;
  if(pos<=20)return 68;
  if(pos<=50)return 50;
  if(pos<=100)return 32;
  return 15;
}
function auditGrade(score){
  if(score>=85)return{label:'Excellent',color:'#22c55e'};
  if(score>=70)return{label:'Good',color:'#3b82f6'};
  if(score>=50)return{label:'Needs work',color:'#f59e0b'};
  return{label:'Critical',color:'#ef4444'};
}
let ASA=[];
async function renderSiteAudit(){
  const host=document.getElementById('audit-body');
  if(!host)return;
  if(!PC.length){host.innerHTML=`<div class="panel"><div class="empty-state">No projects yet — add a project to see its audit.</div></div>`;return;}
  try{ASA=await api.get('/api/site_audits');}catch(err){ASA=[];}
  const cards=PC.map(p=>{
    const kws=AK.filter(k=>k.project_id===p.id);
    const bls=AB.filter(b=>b.project_id===p.id);
    const openTasks=AT.filter(t=>t.project_id===p.id&&t.status!=='done');
    const override=ASA.find(a=>a.project_id===p.id);
    const computedKwScore=kws.length?Math.round(kws.reduce((a,k)=>a+scoreFromPosition(k.position),0)/kws.length):50;
    const blAvgDR=bls.length?bls.reduce((a,b)=>a+Number(b.domain_rating||0),0)/bls.length:0;
    const blDofollowPct=bls.length?Math.round(bls.filter(b=>b.link_type==='dofollow').length/bls.length*100):0;
    const computedBlScore=bls.length?Math.round(Math.min(100,blAvgDR*1.1)*0.7+blDofollowPct*0.3):40;
    const issuePenalty=Math.min(40,openTasks.length*6);
    const computedOverall=Math.round(computedKwScore*0.4+computedBlScore*0.35+(100-issuePenalty)*0.25);
    const kwScore=override?.keyword_score??computedKwScore;
    const blScore=override?.backlink_score??computedBlScore;
    const overall=override?.overall_score??computedOverall;
    const grade=auditGrade(overall);
    const topIssues=[...openTasks].sort((a,b)=>({high:0,medium:1,low:2}[a.priority]??1)-({high:0,medium:1,low:2}[b.priority]??1)).slice(0,3);
    return `<div class="panel" style="margin-bottom:16px">
      <div class="modal-body" style="border:none;display:flex;gap:24px;flex-wrap:wrap;align-items:center">
        <div style="display:flex;align-items:center;gap:16px;min-width:220px">
          <div style="width:64px;height:64px;border-radius:50%;background:conic-gradient(${grade.color} ${overall*3.6}deg,var(--border) 0deg);display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <div style="width:52px;height:52px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px">${overall}</div>
          </div>
          <div>
            <div style="font-weight:700;font-size:15px">${e(p.name)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${e(p.domain||'')}</div>
            <div style="font-size:11.5px;font-weight:700;color:${grade.color};margin-top:2px">${grade.label}${override?' · <span style="color:var(--text-muted);font-weight:500">Manually edited</span>':''}</div>
          </div>
        </div>
        <div style="display:flex;gap:28px;flex-wrap:wrap;flex:1">
          <div><div style="font-size:11px;color:var(--text-muted)">Keyword score</div><div style="font-weight:700;font-size:15px">${kwScore}/100</div><div style="font-size:11px;color:var(--text-muted)">${kws.length} tracked keyword${kws.length===1?'':'s'}</div></div>
          <div><div style="font-size:11px;color:var(--text-muted)">Backlink score</div><div style="font-weight:700;font-size:15px">${blScore}/100</div><div style="font-size:11px;color:var(--text-muted)">${bls.length} backlink${bls.length===1?'':'s'} · avg DR ${Math.round(blAvgDR)}</div></div>
          <div><div style="font-size:11px;color:var(--text-muted)">Open issues</div><div style="font-weight:700;font-size:15px;color:${openTasks.length?'#ef4444':'#22c55e'}">${openTasks.length}</div><div style="font-size:11px;color:var(--text-muted)">from Tasks</div></div>
        </div>
        ${canWrite()?kebabMenu('audit-'+p.id,`
          <button class="kebab-item" data-audit-edit="${p.id}">✏️ Edit score</button>
          ${override?`<button class="kebab-item danger" data-audit-remove="${override.id}">↩️ Remove override</button>`:''}
        `):''}
      </div>
      ${override?.notes?`<div style="border-top:1px solid var(--border);padding:12px 24px;font-size:13px;color:var(--text-2)"><strong>Note:</strong> ${e(override.notes)}</div>`:''}
      ${topIssues.length?`<div style="border-top:1px solid var(--border);padding:14px 24px">
        <div style="font-size:11.5px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.03em;margin-bottom:8px">Top issues to fix</div>
        ${topIssues.map(t=>`<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span>${e(t.title)}</span>${badge(t.priority,t.priority)}</div>`).join('')}
      </div>`:''}
    </div>`;
  }).join('');
  host.innerHTML=cards;
  if(!canWrite())return;
  host.querySelectorAll('[data-audit-edit]').forEach(btn=>btn.addEventListener('click',()=>{
    const pid=Number(btn.dataset.auditEdit);
    const override=ASA.find(a=>a.project_id===pid);
    const project=PC.find(p=>p.id===pid);
    openAuditModal(pid,project,override||null);
  }));
  host.querySelectorAll('[data-audit-remove]').forEach(btn=>btn.addEventListener('click',async()=>{
    if(!confirm('Remove this manual override? The score will revert to auto-calculated.'))return;
    await api.del(`/api/site_audits/${btn.dataset.auditRemove}`);
    toast('Override removed — reverted to auto-calculated score','err');
    await renderSiteAudit();
  }));
}
let pendingAuditProjectId=null,pendingAuditProjectName='';
function openAuditModal(projectId,project,existing){
  pendingAuditProjectId=projectId;
  pendingAuditProjectName=project?.name||'';
  openM('site_audits',existing||null);
}

async function loadProjects(){PC=await api.get('/api/projects');renderProjects();}
function renderProjects(){
  const q=v('f-projects-q').toLowerCase(),st=v('f-projects-st');
  const rows=PC.filter(p=>(!q||p.name.toLowerCase().includes(q)||(p.domain||'').toLowerCase().includes(q))&&(!st||p.status===st));
  document.getElementById('projects-table').innerHTML=rows.map(p=>`<tr>
    <td><strong>${e(p.name)}</strong></td>
    <td style="color:var(--blue);font-size:13px">${e(p.domain||'—')}</td>
    <td>${badge(p.status,p.status)}</td>
    <td>${pubY(p.published)}</td>
    <td style="color:var(--text-muted);font-size:12.5px">${fD(p.created_at)}</td>
    <td class="row-actions">${kebab('projects',p.id,p.published)}</td>
  </tr>`).join('')||emptyR(6,'No projects match your filters.');
}

/* KEYWORDS */
async function loadKeywords(){AK=await api.get('/api/keywords');renderKeywords();}
function renderKeywords(){
  const q=v('f-kw-q').toLowerCase(),proj=v('f-kw-proj');
  const rows=AK.filter(k=>(!q||k.keyword.toLowerCase().includes(q)||(k.url||'').toLowerCase().includes(q))&&(!proj||String(k.project_id)===proj));
  document.getElementById('keywords-table').innerHTML=rows.map(k=>`<tr>
    <td><strong>${e(k.keyword)}</strong></td>
    <td style="font-size:12.5px;color:var(--text-dim)">${e(pN(k.project_id))}</td>
    <td style="font-weight:700">${fN(k.search_volume)}</td>
    <td style="min-width:110px">${diffB(k.difficulty||0)}</td>
    <td><span class="pos-num">#${k.position??'—'}</span></td>
    <td>${posC(k.position,k.prev_position)}</td>
    <td style="color:var(--blue);font-size:12.5px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(k.url||'—')}</td>
    <td>${pubY(k.published)}</td>
    <td class="row-actions">${kebab('keywords',k.id,k.published)}</td>
  </tr>`).join('')||emptyR(9,'No keywords found.');
}

/* BACKLINKS */
async function loadBacklinks(){AB=await api.get('/api/backlinks');renderBacklinks();}
function renderBacklinks(){
  const q=v('f-bl-q').toLowerCase(),tp=v('f-bl-type'),st=v('f-bl-st');
  const rows=AB.filter(b=>(!q||b.source_url.toLowerCase().includes(q)||(b.anchor_text||'').toLowerCase().includes(q))&&(!tp||b.link_type===tp)&&(!st||b.status===st));
  document.getElementById('backlinks-table').innerHTML=rows.map(b=>`<tr>
    <td style="max-width:200px"><a href="${e(b.source_url)}" target="_blank" style="color:var(--blue);font-size:12.5px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(b.source_url.replace(/^https?:\/\//,''))}</a></td>
    <td style="font-size:13px;color:var(--text-2)">${e(b.anchor_text||'—')}</td>
    <td>${drB(b.domain_rating||0)}</td>
    <td>${badge(b.link_type,b.link_type)}</td>
    <td>${badge(b.status,b.status)}</td>
    <td style="font-size:12px;color:var(--text-dim)">${e(pN(b.project_id))}</td>
    <td>${pubY(b.published)}</td>
    <td class="row-actions">${kebab('backlinks',b.id,b.published)}</td>
  </tr>`).join('')||emptyR(8,'No backlinks found.');
}

/* ADS */
async function loadAds(){AA=await api.get('/api/ads');renderAds();}
function renderAds(){
  const q=v('f-ads-q').toLowerCase(),pl=v('f-ads-plat'),st=v('f-ads-st');
  const rows=AA.filter(a=>(!q||a.campaign_name.toLowerCase().includes(q))&&(!pl||a.platform===pl)&&(!st||a.status===st));
  document.getElementById('ads-table').innerHTML=rows.map(a=>{
    const cpc=a.clicks?f$(a.spend/a.clicks):'—';
    const cvr=a.clicks?(((a.conversions||0)/a.clicks)*100).toFixed(1)+'%':'—';
    const roas=a.spend>0?((a.conversions*50)/a.spend).toFixed(1)+'x':'—';
    return `<tr>
      <td><strong>${e(a.campaign_name)}</strong></td>
      <td>${platB(a.platform)}</td>
      <td>${badge(a.status,a.status)}</td>
      <td style="font-weight:700">${f$(a.spend)}</td>
      <td>${fN(a.clicks)}</td>
      <td>${fM(a.impressions)}</td>
      <td style="color:#059669;font-weight:600">${fN(a.conversions)}</td>
      <td style="color:var(--text-dim);font-size:12.5px">${cpc}</td>
      <td style="color:var(--text-dim);font-size:12.5px">${cvr}</td>
      <td class="roas">${roas}</td>
      <td>${pubY(a.published)}</td>
      <td class="row-actions">${kebab('ads',a.id,a.published)}</td>
    </tr>`;
  }).join('')||emptyR(12,'No campaigns found.');
}

/* TASKS */
async function loadTasks(){AT=await api.get('/api/tasks');renderTasks();}
function renderTasks(){
  const q=v('f-tasks-q').toLowerCase(),st=v('f-tasks-st'),pri=v('f-tasks-pri');
  const now=new Date();
  const rows=AT.filter(t=>(!q||t.title.toLowerCase().includes(q)||(t.description||'').toLowerCase().includes(q))&&(!st||t.status===st)&&(!pri||t.priority===pri));
  document.getElementById('tasks-table').innerHTML=rows.map(t=>{
    const due=t.due_date?new Date(t.due_date):null;
    const overdue=due&&due<now&&t.status!=='done';
    return `<tr>
      <td><div style="font-weight:600">${e(t.title)}</div>${t.description?`<div style="color:var(--text-muted);font-size:11.5px;margin-top:2px">${e(t.description.slice(0,65))}…</div>`:''}</td>
      <td style="font-size:12.5px;color:var(--text-dim)">${e(pN(t.project_id))}</td>
      <td>${priB(t.priority)}</td>
      <td>${badge(t.status,t.status.replace('_',' '))}</td>
      <td style="font-size:13px;${overdue?'color:var(--red);font-weight:600':'color:var(--text-dim)'}">${fD(t.due_date)}${overdue?' ⚠️':''}</td>
      <td class="row-actions">${kebabMenu('tasks-'+t.id,`
        <button class="kebab-item" data-edit="tasks" data-id="${t.id}">✏️ Edit</button>
        <button class="kebab-item danger" data-del="tasks" data-id="${t.id}">🗑️ Delete</button>
      `)}</td>
    </tr>`;
  }).join('')||emptyR(6,'No tasks found.');
}

/* NOTIFICATIONS */
async function loadNotifications(){
  AN=await api.get('/api/notifications');
  document.getElementById('notifications-table').innerHTML=AN.map(n=>`<tr style="${n.is_read?'opacity:.5':''}">
    <td>${typeI(n.type)}</td>
    <td><strong style="${!n.is_read?'font-weight:700':''}">
      ${!n.is_read?`<span style="display:inline-block;width:6px;height:6px;background:var(--accent);border-radius:50%;margin-right:6px;vertical-align:middle"></span>`:''}
      ${e(n.title)}</strong></td>
    <td style="color:var(--text-dim);font-size:13px">${e(n.message||'')}</td>
    <td>${badge(n.type,n.type)}</td>
    <td style="color:var(--text-muted);font-size:12.5px">${fD(n.created_at)}</td>
    <td class="row-actions">${kebabMenu('notif-'+n.id,`
      ${!n.is_read?`<button class="kebab-item" data-read="${n.id}">✅ Mark done</button>`:`<span class="kebab-item" style="color:var(--text-muted);cursor:default">✅ Already done</span>`}
      <button class="kebab-item danger" data-del="notifications" data-id="${n.id}">🗑️ Delete</button>
    `)}</td>
  </tr>`).join('')||emptyR(6,"You're all caught up! 🎉");
}
document.getElementById('markAllReadBtn').addEventListener('click',async()=>{
  await api.put('/api/notifications/read-all');
  await loadNotifications();await loadOverview();toast('All marked as read');
});

/* SETTINGS */
let pendingLogo=undefined; // undefined = unchanged, null = removed, string = new data URL
function renderLogoPreview(url){
  const img=document.getElementById('logoPreviewImg'),fb=document.getElementById('logoPreviewFallback');
  if(url){img.src=url;img.style.display='block';fb.style.display='none';}
  else{img.style.display='none';fb.style.display='block';}
}
let SS={};
async function loadSettings(){
  const s=await api.get('/api/settings');
  SS=s;
  document.getElementById('set-title').value=s.site_title||'';
  document.getElementById('set-tagline').value=s.site_tagline||'';
  document.getElementById('set-desc').value=s.site_desc||'';
  document.getElementById('set-currency').value=s.billing_currency_symbol||'$';
  document.getElementById('set-taxrate').value=s.billing_tax_rate||'5';
  document.getElementById('set-company').value=s.billing_company_name||'';
  document.getElementById('set-address').value=s.billing_address||'';
  document.getElementById('set-invoicenote').value=s.billing_invoice_note||'';
  pendingLogo=undefined;
  renderLogoPreview(s.site_logo||'');
  applyBranding(s);
  const o=await api.get('/api/overview');
  document.getElementById('dbStats').innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${
    [['Projects',o.projectCount],['Keywords',o.keywordCount],['Backlinks',o.backlinkCount],['Open tasks',o.openTasks],['Notifications',o.unreadNotifications+' unread'],['Total ad spend',f$(o.totalSpend)]]
    .map(([l,val])=>`<div style="background:var(--bg);border-radius:8px;padding:10px 12px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">${l}</div><div style="font-weight:700;font-size:16px">${val}</div></div>`)
    .join('')}</div>`;
}
function applyBranding(s){
  const title=s.site_title||'RankPilot';
  const logo=s.site_logo;
  document.title=title+' — Admin';
  const nameEls=[document.getElementById('sbBrandName'),document.getElementById('loginLogoName')];
  nameEls.forEach(el=>{if(el)el.textContent=title;});
  const logoEls=[
    {el:document.getElementById('sbBrandLogo'),size:32},
    {el:document.getElementById('loginLogoMark'),size:36}
  ];
  logoEls.forEach(({el,size})=>{
    if(!el)return;
    el.innerHTML=logo?`<img src="${logo}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`:e((title[0]||'R').toUpperCase());
  });
}
document.getElementById('logoUploadBtn').addEventListener('click',()=>document.getElementById('set-logo-file').click());
document.getElementById('set-logo-file').addEventListener('change',e=>{
  const file=e.target.files[0]; if(!file)return;
  if(file.size>4*1024*1024){toast('Image too large — pick something under 4MB','err');return;}
  const reader=new FileReader();
  reader.onload=ev=>{pendingLogo=ev.target.result;renderLogoPreview(pendingLogo);};
  reader.readAsDataURL(file);
});
document.getElementById('logoRemoveBtn').addEventListener('click',()=>{pendingLogo=null;renderLogoPreview('');});
document.getElementById('saveSettingsBtn').addEventListener('click',async()=>{
  const body={site_title:v('set-title'),site_tagline:v('set-tagline'),site_desc:v('set-desc')};
  if(pendingLogo!==undefined) body.site_logo=pendingLogo||'';
  await api.put('/api/settings',body);
  pendingLogo=undefined;
  applyBranding(await api.get('/api/settings'));
  toast('Settings saved ✓');
});
document.getElementById('saveBillingSettingsBtn').addEventListener('click',async()=>{
  const body={
    billing_currency_symbol:v('set-currency')||'$',
    billing_tax_rate:v('set-taxrate')||'5',
    billing_company_name:v('set-company'),
    billing_address:v('set-address'),
    billing_invoice_note:v('set-invoicenote')
  };
  await api.put('/api/settings',body);
  SS={...SS,...body};
  toast('Billing settings saved ✓');
});
/* USERS (client / gmail whitelist) */
let AU=[];
async function loadUsers(){
  try{AU=await api.get('/api/users');}catch(err){AU=[];}
  renderUsers();
}
function renderUsers(){
  const providerLbl={pending:'Not signed in yet',password:'📧 Email & password',google:'🔐 Google'};
  const roleLbl={owner:'Owner',admin:'Admin',client:'Client'};
  document.getElementById('users-table').innerHTML=AU.map(u=>`<tr>
    <td><strong>${e(u.email)}</strong></td>
    <td>${badge(u.status,u.status==='banned'?'🚫 Banned':'✅ Active')}</td>
    <td>${badge(u.role||'client',roleLbl[u.role]||'Client')}</td>
    <td>${badge(u.auth_provider,providerLbl[u.auth_provider]||u.auth_provider)}</td>
    <td style="font-size:12.5px;color:var(--text-dim)">${u.has_account?'Created':'Awaiting first sign-in'}</td>
    <td style="color:var(--text-muted);font-size:12.5px">${u.expires_at?fD(u.expires_at):'No expiry'}</td>
    <td style="color:var(--text-muted);font-size:12.5px">${u.last_login?fD(u.last_login):'—'}</td>
    <td class="row-actions">${kebabMenu('user-'+u.id,`
      <button class="kebab-item" data-ban-toggle="${u.id}" data-status="${u.status}">${u.status==='banned'?'✅ Unban':'🚫 Ban'}</button>
      <button class="kebab-item danger" data-del="users" data-id="${u.id}">🗑️ Remove</button>
    `)}</td>
  </tr>`).join('')||emptyR(8,'No users added yet. Add an email above to invite one.');
}
document.getElementById('addUserBtn').addEventListener('click',async()=>{
  const email=v('newUserEmail');
  const role=v('newUserRole')||'client';
  const duration=v('newUserDuration');
  if(!email){toast('Enter an email first','err');return;}
  try{
    await api.post('/api/users',{email,role,duration:duration||undefined});
    document.getElementById('newUserEmail').value='';
    toast('User added ✓');
    await loadUsers();
  }catch(err){toast(err.error||'Failed to add user','err');}
});

/* SIGN-UP REQUESTS (public "Create account" request-access flow) */
let ASR=[];
async function loadSignupRequests(){
  try{ASR=await api.get('/api/signup-requests');}catch(err){ASR=[];}
  renderSignupRequests();
}
function renderSignupRequests(){
  const host=document.getElementById('signup-requests-table');
  if(!host)return;
  const statusLbl={pending:'⏳ Pending review',approved:'✅ Approved',banned:'🚫 Banned'};
  host.innerHTML=ASR.map(r=>`<tr>
    <td><code style="font-size:12px">${e(r.reference_id)}</code></td>
    <td>${e(r.first_name)} ${e(r.last_name)}</td>
    <td>${e(r.email)}</td>
    <td>${e(r.country||'—')}</td>
    <td>${badge(r.status,statusLbl[r.status]||r.status)}</td>
    <td style="color:var(--text-muted);font-size:12.5px">${fD(r.created_at)}</td>
    <td class="row-actions">${r.status==='pending'?kebabMenu('req-'+r.id,`
      <button class="kebab-item" data-req-approve="${r.id}">✅ Approve</button>
      <button class="kebab-item danger" data-req-ban="${r.id}">🚫 Ban</button>
    `):''}</td>
  </tr>`).join('')||emptyR(7,'No sign-up requests yet.');
}
document.getElementById('newUserEmail').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('addUserBtn').click();});

document.getElementById('changePwBtn').addEventListener('click',async()=>{
  const msgEl=document.getElementById('pwMsg');
  msgEl.style.color='var(--red)';
  try{
    await api.post('/api/auth/change-password',{currentPassword:document.getElementById('pw-current').value,newPassword:document.getElementById('pw-new').value});
    msgEl.style.color='#059669';msgEl.textContent='Password updated ✓';
    document.getElementById('pw-current').value='';document.getElementById('pw-new').value='';
  }catch(err){msgEl.textContent=err.error||'Failed';}
});

/* ROW ACTIONS */
document.getElementById('dashboard').addEventListener('click',async e=>{
  const KB=e.target.closest('[data-kebab]'),TP=e.target.closest('[data-toggle-pub]'),BT=e.target.closest('[data-ban-toggle]');
  const RA=e.target.closest('[data-req-approve]'),RN=e.target.closest('[data-req-ban]');
  const EB=e.target.closest('[data-edit]'),DB=e.target.closest('[data-del]'),RB=e.target.closest('[data-read]'),MB=e.target.closest('[data-modal]'),GB=e.target.closest('[data-goto]');
  if(RA){
    await api.put(`/api/signup-requests/${RA.dataset.reqApprove}/approve`,{});
    toast('Request approved — user can now log in ✓');
    await Promise.all([loadSignupRequests(),loadUsers()]);
    return;
  }
  if(RN){
    if(!confirm('Ban this request? The email will be blocked from signing in.'))return;
    await api.put(`/api/signup-requests/${RN.dataset.reqBan}/ban`,{});
    toast('Request banned','err');
    await Promise.all([loadSignupRequests(),loadUsers()]);
    return;
  }
  if(BT){
    const newStatus=BT.dataset.status==='banned'?'active':'banned';
    await api.put(`/api/users/${BT.dataset.banToggle}`,{status:newStatus});
    toast(newStatus==='banned'?'User banned':'User unbanned ✓');
    await loadUsers();
    return;
  }
  if(KB){
    const menu=document.querySelector(`[data-kebab-menu="${KB.dataset.kebab}"]`);
    const wasOpen=menu.classList.contains('open');
    document.querySelectorAll('.kebab-menu.open').forEach(m=>m.classList.remove('open'));
    document.querySelectorAll('.kebab-btn.open').forEach(b=>b.classList.remove('open'));
    if(!wasOpen){menu.classList.add('open');KB.classList.add('open');}
    return;
  }
  if(TP){
    const table=TP.dataset.togglePub,row=await api.get(`/api/${table}/${TP.dataset.id}`);
    await api.put(`/api/${table}/${TP.dataset.id}`,{published:row.published?0:1});
    toast(row.published?'Unpublished':'Published ✓');
    await refresh(table);
    return;
  }
  if(GB){goTo(GB.dataset.goto);return;}
  if(MB){openM(MB.dataset.modal);return;}
  if(EB){const row=await api.get(`/api/${EB.dataset.edit}/${EB.dataset.id}`);openM(s1(EB.dataset.edit),row);return;}
  if(DB){if(!confirm('Delete this item? This cannot be undone.'))return;await api.del(`/api/${DB.dataset.del}/${DB.dataset.id}`);toast('Deleted','err');await refresh(DB.dataset.del);return;}
  if(RB){await api.put(`/api/notifications/${RB.dataset.read}/read`);await loadNotifications();await loadOverview();return;}
});
function s1(t){return {projects:'project',keywords:'keyword',backlinks:'backlink',ads:'ad',tasks:'task'}[t]||t;}
async function refresh(table){
  if(table==='users')await loadUsers();
  if(table==='bills')await renderBillingActivity();
  if(table==='site_audits')await renderSiteAudit();
  if(table==='projects')await loadProjects();
  if(table==='keywords')await loadKeywords();
  if(table==='backlinks')await loadBacklinks();
  if(table==='ads'){await loadAds();await loadOverview();}
  if(table==='tasks')await loadTasks();
  if(table==='notifications'){await loadNotifications();await loadOverview();}
  if(table==='projects')await loadOverview();
}

/* MODAL FORMS */
const FORMS={
  project:{
    title:r=>r?'Edit Project':'New Project',table:'projects',
    fields:r=>`
      <div class="form-field"><label class="form-label">Project name *</label><input class="form-input" id="f-name" value="${e(r?.name||'')}" placeholder="My Website"></div>
      <div class="form-field"><label class="form-label">Domain</label><input class="form-input" id="f-domain" value="${e(r?.domain||'')}" placeholder="example.com"></div>
      <div class="form-field"><label class="form-label">Status</label><select class="form-select" id="f-status">${['active','paused','ended'].map(s=>`<option value="${s}" ${r?.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
      <label class="form-check"><input type="checkbox" id="f-published" ${r?.published!=0?'checked':''}><span>Show on public site</span></label>`,
    collect:()=>({name:v('f-name'),domain:v('f-domain'),status:v('f-status'),published:ck('f-published')?1:0})
  },
  keyword:{
    title:r=>r?'Edit Keyword':'Add Keyword',table:'keywords',
    fields:r=>`
      <div class="form-field"><label class="form-label">Keyword *</label><input class="form-input" id="f-keyword" value="${e(r?.keyword||'')}" placeholder="best seo tools 2025"></div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Project</label><select class="form-select" id="f-project_id">${pO(r?.project_id)}</select></div>
        <div class="form-field"><label class="form-label">Target URL</label><input class="form-input" id="f-url" value="${e(r?.url||'')}" placeholder="/page"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Search volume/mo</label><input class="form-input" type="number" id="f-search_volume" value="${r?.search_volume??0}"></div>
        <div class="form-field"><label class="form-label">Difficulty (0–100)</label><input class="form-input" type="number" id="f-difficulty" min="0" max="100" value="${r?.difficulty??0}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Current position</label><input class="form-input" type="number" id="f-position" value="${r?.position??''}"></div>
        <div class="form-field"><label class="form-label">Previous position</label><input class="form-input" type="number" id="f-prev_position" value="${r?.prev_position??''}"></div>
      </div>
      <label class="form-check"><input type="checkbox" id="f-published" ${r?.published!=0?'checked':''}><span>Show on public site</span></label>`,
    collect:()=>({keyword:v('f-keyword'),project_id:n('f-project_id'),url:v('f-url'),search_volume:n('f-search_volume')||0,difficulty:n('f-difficulty')||0,position:n('f-position'),prev_position:n('f-prev_position'),published:ck('f-published')?1:0})
  },
  backlink:{
    title:r=>r?'Edit Backlink':'Add Backlink',table:'backlinks',
    fields:r=>`
      <div class="form-field"><label class="form-label">Source URL *</label><input class="form-input" id="f-source_url" value="${e(r?.source_url||'')}" placeholder="https://referring-site.com"></div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Target URL</label><input class="form-input" id="f-target_url" value="${e(r?.target_url||'')}"></div>
        <div class="form-field"><label class="form-label">Anchor text</label><input class="form-input" id="f-anchor_text" value="${e(r?.anchor_text||'')}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Project</label><select class="form-select" id="f-project_id">${pO(r?.project_id)}</select></div>
        <div class="form-field"><label class="form-label">Domain rating (0–100)</label><input class="form-input" type="number" id="f-domain_rating" value="${r?.domain_rating??0}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Link type</label><select class="form-select" id="f-link_type">${['dofollow','nofollow'].map(s=>`<option value="${s}" ${r?.link_type===s?'selected':''}>${s}</option>`).join('')}</select></div>
        <div class="form-field"><label class="form-label">Status</label><select class="form-select" id="f-status">${['live','broken','removed'].map(s=>`<option value="${s}" ${r?.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
      </div>
      <label class="form-check"><input type="checkbox" id="f-published" ${r?.published!=0?'checked':''}><span>Show on public site</span></label>`,
    collect:()=>({source_url:v('f-source_url'),target_url:v('f-target_url'),anchor_text:v('f-anchor_text'),project_id:n('f-project_id'),domain_rating:n('f-domain_rating')||0,link_type:v('f-link_type'),status:v('f-status'),published:ck('f-published')?1:0})
  },
  ad:{
    title:r=>r?'Edit Campaign':'New Campaign',table:'ads',
    fields:r=>`
      <div class="form-field"><label class="form-label">Campaign name *</label><input class="form-input" id="f-campaign_name" value="${e(r?.campaign_name||'')}"></div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Project</label><select class="form-select" id="f-project_id">${pO(r?.project_id)}</select></div>
        <div class="form-field"><label class="form-label">Platform</label><select class="form-select" id="f-platform">${['google','meta','bing','linkedin','tiktok'].map(s=>`<option value="${s}" ${r?.platform===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
      </div>
      <div class="form-field"><label class="form-label">Status</label><select class="form-select" id="f-status">${['active','paused','ended'].map(s=>`<option value="${s}" ${r?.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Spend ($)</label><input class="form-input" type="number" id="f-spend" value="${r?.spend??0}"></div>
        <div class="form-field"><label class="form-label">Clicks</label><input class="form-input" type="number" id="f-clicks" value="${r?.clicks??0}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Impressions</label><input class="form-input" type="number" id="f-impressions" value="${r?.impressions??0}"></div>
        <div class="form-field"><label class="form-label">Conversions</label><input class="form-input" type="number" id="f-conversions" value="${r?.conversions??0}"></div>
      </div>
      <label class="form-check"><input type="checkbox" id="f-published" ${r?.published!=0?'checked':''}><span>Show on public site</span></label>`,
    collect:()=>({campaign_name:v('f-campaign_name'),project_id:n('f-project_id'),platform:v('f-platform'),status:v('f-status'),spend:n('f-spend')||0,clicks:n('f-clicks')||0,impressions:n('f-impressions')||0,conversions:n('f-conversions')||0,published:ck('f-published')?1:0})
  },
  task:{
    title:r=>r?'Edit Task':'New Task',table:'tasks',
    fields:r=>`
      <div class="form-field"><label class="form-label">Title *</label><input class="form-input" id="f-title" value="${e(r?.title||'')}" placeholder="Optimize meta descriptions"></div>
      <div class="form-field"><label class="form-label">Description</label><textarea class="form-textarea" id="f-description">${e(r?.description||'')}</textarea></div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Project</label><select class="form-select" id="f-project_id">${pO(r?.project_id)}</select></div>
        <div class="form-field"><label class="form-label">Due date</label><input class="form-input" type="date" id="f-due_date" value="${r?.due_date||''}"></div>
      </div>
      <div class="form-row">
        <div class="form-field"><label class="form-label">Priority</label><select class="form-select" id="f-priority">${['low','medium','high'].map(s=>`<option value="${s}" ${r?.priority===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
        <div class="form-field"><label class="form-label">Status</label><select class="form-select" id="f-status">${['todo','in_progress','done'].map(s=>`<option value="${s}" ${r?.status===s?'selected':''}>${s.replace('_',' ')}</option>`).join('')}</select></div>
      </div>`,
    collect:()=>({title:v('f-title'),description:v('f-description'),project_id:n('f-project_id'),priority:v('f-priority'),status:v('f-status'),due_date:v('f-due_date')})
  },
  notification:{
    title:r=>r?'Edit Alert':'New Alert',table:'notifications',
    fields:r=>`
      <div class="form-field"><label class="form-label">Title *</label><input class="form-input" id="f-title" value="${e(r?.title||'')}"></div>
      <div class="form-field"><label class="form-label">Message</label><textarea class="form-textarea" id="f-message">${e(r?.message||'')}</textarea></div>
      <div class="form-field"><label class="form-label">Type</label><select class="form-select" id="f-type">${['info','success','warning','error'].map(s=>`<option value="${s}" ${r?.type===s?'selected':''}>${s}</option>`).join('')}</select></div>`,
    collect:()=>({title:v('f-title'),message:v('f-message'),type:v('f-type')})
  },
  bill:{
    title:r=>r?`Edit Bill — ${r.month}`:'New Bill',table:'bills',
    fields:r=>`
      <div class="form-field"><label class="form-label">Month</label><input class="form-input" id="f-month" type="month" value="${r?.month||pendingBillMonth||''}" ${r?'readonly':''}></div>
      <div class="form-field"><label class="form-label">Amount</label><input class="form-input" type="number" step="0.01" id="f-amount" value="${r?.amount??0}"></div>
      <div class="form-field"><label class="form-label">Status</label><select class="form-select" id="f-status">${['pending','paid','overdue'].map(s=>`<option value="${s}" ${r?.status===s?'selected':''}>${s[0].toUpperCase()+s.slice(1)}</option>`).join('')}</select></div>
      <div class="form-field"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-notes" placeholder="Optional invoice notes">${e(r?.notes||'')}</textarea></div>`,
    collect:()=>({month:v('f-month'),amount:parseFloat(v('f-amount'))||0,status:v('f-status'),notes:v('f-notes')})
  },
  site_audits:{
    title:r=>`Edit Audit Score${pendingAuditProjectName?' — '+pendingAuditProjectName:''}`,table:'site_audits',
    fields:r=>`
      <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">Override the auto-calculated score for this project. Leave a field blank to fall back to the calculated value.</p>
      <div class="form-field"><label class="form-label">Overall score (0-100)</label><input class="form-input" type="number" min="0" max="100" id="f-overall" value="${r?.overall_score??''}"></div>
      <div class="form-field"><label class="form-label">Keyword score (0-100)</label><input class="form-input" type="number" min="0" max="100" id="f-kwscore" value="${r?.keyword_score??''}"></div>
      <div class="form-field"><label class="form-label">Backlink score (0-100)</label><input class="form-input" type="number" min="0" max="100" id="f-blscore" value="${r?.backlink_score??''}"></div>
      <div class="form-field"><label class="form-label">Notes</label><textarea class="form-textarea" id="f-auditnotes" placeholder="Why was this overridden?">${e(r?.notes||'')}</textarea></div>`,
    collect:()=>({project_id:pendingAuditProjectId,overall_score:v('f-overall')?parseInt(v('f-overall')):null,keyword_score:v('f-kwscore')?parseInt(v('f-kwscore')):null,backlink_score:v('f-blscore')?parseInt(v('f-blscore')):null,notes:v('f-auditnotes')})
  }
};

let cF=null,cR=null;
function openM(key,row=null){const def=FORMS[key];if(!def)return;cF=key;cR=row;document.getElementById('modalTitle').textContent=def.title(row);document.getElementById('modalBody').innerHTML=def.fields(row);document.getElementById('modalOverlay').classList.add('open');}
function closeM(){document.getElementById('modalOverlay').classList.remove('open');cF=null;cR=null;}
document.getElementById('modalClose').addEventListener('click',closeM);
document.getElementById('modalCancel').addEventListener('click',closeM);
document.getElementById('modalOverlay').addEventListener('click',e=>{if(e.target.id==='modalOverlay')closeM();});
document.getElementById('modalSave').addEventListener('click',async()=>{
  if(!cF)return;
  const def=FORMS[cF];const data=def.collect();
  try{
    if(cR)await api.put(`/api/${def.table}/${cR.id}`,data);
    else await api.post(`/api/${def.table}`,data);
    toast('Saved ✓');closeM();
    if(cF==='project')PC=await api.get('/api/projects');
    await refresh(def.table);
  }catch(err){toast(err.error||'Failed to save','err');}
});

checkAuth();
