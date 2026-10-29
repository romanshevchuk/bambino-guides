(function(){
  var MODELS={plus:1,bambino:1};
  var NAME={plus:'Bambino Plus',bambino:'Bambino'};
  var KEYS={plus:['1','2','s'],bambino:['1','2','w','s']};
  var ICON={'1':'i-1','2':'i-2','s':'i-s','w':'i-w'};
  var LABEL={'1':'1 CUP','2':'2 CUP','s':'STEAM','w':'WATER'};
  var body=document.body;

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

  /* --- Sage packaging for UK / Europe visitors --- */
  var langs=(navigator.languages||[navigator.language||'']).join(' ');
  if(/-(GB|IE|DE|AT|CH|FR|NL|BE|LU|IT|ES|PT|PL|CZ|SE|DK|FI|NO|AU|NZ)/i.test(langs)) document.querySelectorAll('img[data-sage]').forEach(function(i){i.src=i.dataset.sage;});

  /* --- Model: ?m= link > saved choice > Plus --- */
  var params=new URLSearchParams(location.search);
  var fromUrl=params.get('m'), model=MODELS[fromUrl]?fromUrl:store('bp-model');
  if(!MODELS[model]) model='plus';
  var picked=MODELS[fromUrl]||store('bp-picked')==='1';

  /* --- Tick-off steps --- */
  function loadDone(k){try{return JSON.parse(store('bp-'+k)||'[]')}catch(e){return []}}
  document.querySelectorAll('ol.steps[data-key]').forEach(function(ol){
    var key=ol.dataset.key, items=[].slice.call(ol.children), prog=document.querySelector('.prog[data-for="'+key+'"]'), done=loadDone(key);
    function save(){store('bp-'+key,JSON.stringify(done));render();}
    function render(){
      var vis=items.filter(function(li){return !li.dataset.only||li.dataset.only===model;}), n=0;
      items.forEach(function(li,i){var d=done.indexOf(i)>-1;li.classList.toggle('done',d);li.setAttribute('aria-checked',d);});
      vis.forEach(function(li){if(li.classList.contains('done'))n++;});
      if(!prog) return;
      prog.innerHTML=n?(n===vis.length?'All done · ':n+' of '+vis.length+' · ')+'<button type="button">Reset</button>':'tap a step to tick it off';
      var b=prog.querySelector('button'); if(b) b.onclick=function(){done=[];save();};
    }
    items.forEach(function(li,i){
      li.setAttribute('role','checkbox');li.tabIndex=0;
      function t(e){if(e&&e.target.closest('a'))return;var p=done.indexOf(i);if(p>-1)done.splice(p,1);else done.push(i);save();}
      li.addEventListener('click',t);
      li.addEventListener('keydown',function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();t();}});
    });
    ol._render=render;
  });

  /* --- Views: one topic per screen, picked by the URL hash --- */
  var views=[].slice.call(document.querySelectorAll('.view')), home=document.getElementById('home'), cur=null, homeY=0;
  function route(){
    var id=decodeURIComponent(location.hash.slice(1)), t=id&&document.getElementById(id), v=t&&t.closest('.view');
    if(!v||(v.dataset.only&&v.dataset.only!==model)) v=home;
    if(cur===home&&v!==home) homeY=window.scrollY;
    var prev=cur; cur=v;
    views.forEach(function(x){x.hidden=x!==v;});
    var h=v.querySelector('h1');
    document.title=(v===home?'':h.innerText.trim()+' · ')+NAME[model]+' help';
    if(t&&t!==v){if(t.tagName==='DETAILS')t.open=true;t.scrollIntoView();}
    else if(prev!==v) window.scrollTo(0,v===home?homeY:0);
  }
  window.addEventListener('hashchange',route);

  function setModel(m,chosen){
    model=m; body.dataset.model=m; store('bp-model',m);
    if(chosen){picked=true;store('bp-picked','1');params.set('m',m);history.replaceState(null,'','?'+params.toString()+location.hash);}
    body.classList.toggle('unpicked',!picked);
    document.querySelectorAll('[data-set-model]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.setModel===m);});
    document.querySelectorAll('.cur-model').forEach(function(e){e.textContent=NAME[m];});
    document.querySelectorAll('ol.steps[data-key]').forEach(function(ol){ol._render();});
    route();
  }
  document.querySelectorAll('[data-set-model]').forEach(function(b){b.addEventListener('click',function(){setModel(b.dataset.setModel,true);});});

  /* --- Problem search --- */
  var search=document.querySelector('.search input'), faqs=[].slice.call(document.querySelectorAll('.faq details')), none=document.querySelector('.no-match');
  search.addEventListener('input',function(){
    var q=search.value.trim().toLowerCase(), shown=0;
    faqs.forEach(function(d){var hit=!q||(d.dataset.k+' '+d.textContent).toLowerCase().indexOf(q)>-1;d.hidden=!hit;if(hit)shown++;if(q&&hit&&shown===1)d.open=true;});
    none.hidden=shown>0;
  });

  setModel(model);
})();
