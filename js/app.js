(function(){
  var MODELS={plus:1,bambino:1};
  var NAME={plus:'Bambino Plus',bambino:'Bambino'};
  var KEYS={plus:['1','2','s'],bambino:['1','2','w','s']};
  var ICON={'1':'i-1','2':'i-2','s':'i-s','w':'i-w'};
  var LABEL={'1':'1 CUP','2':'2 CUP','s':'STEAM','w':'WATER'};
  var body=document.body, mmBtn=document.querySelector('.mm-btn'), mmMenu=document.getElementById('mm-menu');

  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

  /* --- Control panel drawings --- */
  function parse(str){var o={};(str||'').split(',').forEach(function(p){if(!p)return;var i=p.indexOf(':');o[p.slice(0,i).trim()]=p.slice(i+1).trim();});return o;}
  document.querySelectorAll('.bp').forEach(function(el){
    var m=el.dataset.m||'plus', st=parse(el.dataset.state), pr=parse(el.dataset.press), html='';
    KEYS[m].forEach(function(k){
      var cls=st[k]?(' '+st[k]):'', hold=pr[k];
      html+='<span class="k'+(hold?' press':'')+'"'+(hold?' data-hold="'+hold+'"':'')+'><span class="b'+cls+'"></span><svg><use href="#'+ICON[k]+'"/></svg><span class="lb">'+LABEL[k]+'</span></span>';
    });
    if(m==='plus') html+='<span class="side"><span class="srow"><span class="slot red"></span><span class="b sm'+(st.t?' '+st.t:'')+'"></span><svg><use href="#i-t"/></svg></span><span class="srow"><span class="slot"></span><span class="b sm'+(st.f?' '+st.f:'')+'"></span><svg><use href="#i-j"/></svg></span></span>';
    el.innerHTML=html;
    if(Object.keys(pr).length) el.classList.add('has-press');
  });

  /* --- Urgency band at the top of each light card --- */
  /* worded so no card reads as "broken": most lights are routine or a ten-second fix */
  var URG={now:'Quick fix',soon:'Routine',fine:'Normal'};
  document.querySelectorAll('.lc[data-urg]').forEach(function(c){
    var h=c.querySelector('h3'), row=document.createElement('div'), u=document.createElement('span');
    row.className='lc-head';u.className='urg';u.textContent=URG[c.dataset.urg];
    h.before(row);row.append(h,u);
  });

  /* --- Caveat tooltips: nudge left when the bubble would run off the right edge --- */
  document.querySelectorAll('.tq').forEach(function(q){
    function fit(){
      var w=Math.min(250,innerWidth*.7), over=q.getBoundingClientRect().left-6+w-(document.documentElement.clientWidth-12);
      q.style.setProperty('--tx',(over>0?-over:0)+'px');
    }
    q.addEventListener('mouseenter',fit);q.addEventListener('focus',fit);
  });

  /* --- Sage packaging for UK / Europe visitors --- */
  var langs=(navigator.languages||[navigator.language||'']).join(' ');
  if(/-(GB|IE|DE|AT|CH|FR|NL|BE|LU|IT|ES|PT|PL|CZ|SE|DK|FI|NO|AU|NZ)/i.test(langs)) document.querySelectorAll('img[data-sage]').forEach(function(i){i.src=i.dataset.sage;});

  /* --- Product pictures: a big popup on hover, tap or focus (after the Sage swap so it copies the right image) --- */
  var zooms=[].slice.call(document.querySelectorAll('.zoom'));
  zooms.forEach(function(z){
    var pop=document.createElement('span');pop.className='pop';pop.setAttribute('aria-hidden','true');
    z.querySelectorAll('img').forEach(function(i){
      var c=document.createElement('img');c.src=i.src;c.alt='';pop.appendChild(c);
      if(i.dataset.cap){var t=document.createElement('span');t.textContent=i.dataset.cap;pop.appendChild(t);}
    });
    z.appendChild(pop);
    if(z.tagName!=='BUTTON'){z.tabIndex=0;z.setAttribute('role','button');z.setAttribute('aria-label','Show a bigger picture');}
    z.addEventListener('click',function(){var on=!z.classList.contains('open');zooms.forEach(function(o){o.classList.remove('open');});z.classList.toggle('open',on);});
  });
  document.addEventListener('click',function(e){if(!e.target.closest('.zoom'))zooms.forEach(function(o){o.classList.remove('open');});});

  /* --- Model: ?m= link > saved choice > Plus --- */
  var params=new URLSearchParams(location.search);
  var fromUrl=params.get('m'), model=MODELS[fromUrl]?fromUrl:store('bp-model');
  if(!MODELS[model]) model='plus';
  /* task pages (clean/, descale/ ...) open on their own view; landing on a Plus-only one means it's a Plus */
  var page=document.getElementById(body.dataset.page||'home'), ownTitle=document.title;
  /* views with their own page (same list as tools/pages.py); the address bar always shows the open view's page */
  var OWN={clean:1,descale:1,steam:1,supplies:1}, base=new URL(body.dataset.page?'../':'./',location.href).pathname;
  if(!MODELS[fromUrl]&&page.dataset.only) model=page.dataset.only;
  var picked=MODELS[fromUrl]||store('bp-picked')==='1';

  /* --- "Last done" under a card's button: written only when every step of that job was ticked --- */
  var DAY=864e5;
  function ago(t){
    var d=Math.floor((Date.now()-t)/DAY), m=Math.round(d/30.4);
    if(d<1) return 'today'; if(d<2) return 'yesterday';
    if(d<14) return d+' days ago'; if(d<60) return Math.round(d/7)+' weeks ago';
    return m<12?m+' months ago':'over a year ago';
  }
  function renderLast(){
    document.querySelectorAll('[data-last]').forEach(function(el){
      var t=+store('bp-last-'+el.dataset.last);
      el.hidden=!t; if(!t) return;
      var dt=new Date(t), r=ago(t);
      el.textContent='Last done '+(r==='today'||r==='yesterday'?r:dt.toLocaleDateString(undefined,{day:'numeric',month:'short',year:dt.getFullYear()===new Date().getFullYear()?undefined:'numeric'})+' · '+r);
    });
  }

  /* --- Tick-off steps: ticks are forgotten after 12 h, so the next descale starts clean --- */
  var TICK_TTL=12*3600*1000;
  function loadDone(k){try{var o=JSON.parse(store('bp-'+k)||'null');return o&&o.d&&Date.now()-o.t<TICK_TTL?o.d:[]}catch(e){return []}}
  document.querySelectorAll('ol.steps[data-key]').forEach(function(ol){
    var key=ol.dataset.key, items=[].slice.call(ol.children), prog=document.querySelector('.prog[data-for="'+key+'"]'), done=loadDone(key);
    function save(){
      store('bp-'+key,JSON.stringify({t:Date.now(),d:done}));
      var vis=items.filter(function(li){return !li.dataset.only||li.dataset.only===model;});
      if(vis.every(function(li){return done.indexOf(items.indexOf(li))>-1;})){store('bp-last-'+key,Date.now());renderLast();}
      render();
    }
    function render(){
      var vis=items.filter(function(li){return !li.dataset.only||li.dataset.only===model;}), n=0;
      items.forEach(function(li,i){var d=done.indexOf(i)>-1;li.classList.toggle('done',d);li.setAttribute('aria-checked',d);});
      var next=null;
      vis.forEach(function(li){if(li.classList.contains('done'))n++;else if(!next)next=li;});
      items.forEach(function(li){li.classList.toggle('next',n>0&&li===next);});
      var fin=document.querySelector('.fin[data-for="'+key+'"]'); if(fin) fin.hidden=!(n&&n===vis.length);
      if(!prog) return;
      prog.innerHTML=n?(n===vis.length?'All done · ':n+' of '+vis.length+' · ')+'<button type="button">Reset</button>':'tap each step when it’s done<span class="aw"> · screen stays on</span>';
      var b=prog.querySelector('button'); if(b) b.onclick=function(){done=[];save();};
    }
    items.forEach(function(li,i){
      li.setAttribute('role','checkbox');li.tabIndex=0;
      function t(e){if(e&&e.target.closest('a,img,figure'))return;var p=done.indexOf(i);if(p>-1)done.splice(p,1);else done.push(i);save();}
      li.addEventListener('click',t);
      li.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();t();}});
    });
    ol._render=render;
  });

  /* --- Views: one topic per screen, picked by the URL hash --- */
  /* trail = views opened since home, so Back returns to where you came from (and its scroll spot) */
  var views=[].slice.call(document.querySelectorAll('.view')), home=document.getElementById('home'), cur=null, trail=[], ypos={}, fwd=0;
  /* a new view can land a picture under a resting pointer; hover popups wait until it really moves */
  var px=0, py=0, ax=0, ay=0;
  document.addEventListener('mousemove',function(e){
    px=e.clientX;py=e.clientY;
    if(body.classList.contains('still')&&Math.abs(px-ax)+Math.abs(py-ay)>6) body.classList.remove('still');
  });
  function route(){
    ax=px;ay=py;body.classList.add('still');
    var id=decodeURIComponent(location.hash.slice(1)), seg=location.pathname.slice(base.length).split('/')[0], t=id&&document.getElementById(id);
    var v=id?t&&t.closest('.view'):OWN[seg]?document.getElementById(seg):home;
    if(!v||(v.dataset.only&&v.dataset.only!==model)) v=home;
    /* #descale becomes descale/, a target inside a view keeps its hash (clean/#baskets) */
    history.replaceState(null,'',(v===home?base:base+v.id+'/')+location.search+(t&&t!==v?'#'+id:''));
    /* a link inside a page always goes forward, even to a page already in the trail (Cleaning cycle -> Tablet or descaler? -> Cleaning cycle);
       the Back link and the browser's back button walk the trail */
    var at=trail.lastIndexOf(v.id), prev=cur, back=v===home||(Date.now()-fwd>800&&at>-1); cur=v;
    if(v===home) trail=[];
    else if(v!==prev){if(back) trail.length=at+1; else trail.push(v.id);}
    fwd=0;
    var bl=v.querySelector('.back');
    if(bl){var up=trail.length>1?document.getElementById(trail[trail.length-2]):home;bl.href='#'+up.id;bl.textContent=up===home?'All lights':up.querySelector('h1').innerText.trim();}
    views.forEach(function(x){x.hidden=x!==v;});
    var h=v.querySelector('h1');
    /* the page's own view keeps the title search engines see */
    document.title=v===page?ownTitle:v===home?'What does my '+NAME[model]+' want?':h.innerText.trim()+' · '+NAME[model];
    /* GoatCounter counts the page load itself; views opened after it are counted here */
    if(prev&&prev!==v&&window.goatcounter&&goatcounter.count) goatcounter.count({path:location.pathname,title:document.title});
    if(t&&t!==v){
      if(t.tagName==='DETAILS')t.open=true;
      /* a target near the page end can't reach the top, so flash it to show where to look */
      t.scrollIntoView({block:'center'});t.classList.remove('hit');void t.offsetWidth;t.classList.add('hit');
    }
    else if(prev!==v) window.scrollTo(0,back?ypos[v.id]||0:0);
    keepAwake(!!v.querySelector('ol.steps'));
  }

  /* --- Keep the phone screen on while following steps (a descale takes ~25 min) --- */
  var lock=null, wantAwake=false;
  function keepAwake(on){
    wantAwake=on;
    if(!('wakeLock' in navigator)) return;
    if(on&&!lock) navigator.wakeLock.request('screen').then(function(l){lock=l;body.classList.add('awake');l.addEventListener('release',function(){lock=null;body.classList.remove('awake');});}).catch(function(){});
    else if(!on&&lock) lock.release();
  }
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&wantAwake)keepAwake(true);});
  /* popstate, not hashchange: Back between descale/ and clean/ changes the path, not the hash */
  window.addEventListener('popstate',route);
  /* save the scroll spot on click: the browser's own anchor jump runs before popstate */
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href^="#"]'); if(!a||!cur) return;
    ypos[cur.id]=window.scrollY; fwd=a.classList.contains('back')?0:Date.now();
    /* same hash again fires no popstate: run route so the target still opens and flashes */
    if(a.getAttribute('href')===location.hash) setTimeout(route,0);
  },true);

  function setModel(m,chosen){
    model=m; body.dataset.model=m; store('bp-model',m);
    if(chosen){picked=true;store('bp-picked','1');params.set('m',m);history.replaceState(null,'','?'+params.toString()+location.hash);}
    body.classList.toggle('unpicked',!picked);
    document.querySelectorAll('[data-set-model]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.setModel===m);});
    document.querySelectorAll('.cur-model').forEach(function(e){e.textContent=NAME[m];});
    mmBtn.setAttribute('aria-label','Change machine, currently '+NAME[m]);
    openMenu(false);
    document.querySelectorAll('ol.steps[data-key]').forEach(function(ol){ol._render();});
    route();
  }
  document.querySelectorAll('[data-set-model]').forEach(function(b){b.addEventListener('click',function(){setModel(b.dataset.setModel,true);});});
  document.querySelector('.mm-ok').addEventListener('click',function(){setModel(model,true);});

  /* --- Colours: device / light / dark, remembered; the head script applies it before first paint --- */
  var root=document.documentElement;
  function setTheme(t){
    if(t==='light'||t==='dark') root.dataset.theme=t; else delete root.dataset.theme;
    store('bp-theme',t);
    document.querySelectorAll('[data-theme-set]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.themeSet===t);});
  }
  document.querySelectorAll('[data-theme-set]').forEach(function(b){b.addEventListener('click',function(){setTheme(b.dataset.themeSet);});});
  setTheme(root.dataset.theme||'system');

  /* --- Machine menu under the heading --- */
  function openMenu(on){mmMenu.hidden=!on;mmBtn.setAttribute('aria-expanded',on);}
  mmBtn.addEventListener('click',function(){openMenu(mmMenu.hidden);});
  document.addEventListener('click',function(e){if(!mmMenu.hidden&&!e.target.closest('.mm'))openMenu(false);});
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;zooms.forEach(function(o){o.classList.remove('open');});if(!mmMenu.hidden){openMenu(false);mmBtn.focus();}});

  renderLast();
  setModel(model);
})();
