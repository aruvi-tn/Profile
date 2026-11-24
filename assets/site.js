/* hiaruvi.com */
(function(){
  var html=document.documentElement;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  var burger=document.querySelector('.burger'),drawer=document.querySelector('.drawer');
  if(burger&&drawer)burger.addEventListener('click',function(){var o=drawer.classList.toggle('open');burger.setAttribute('aria-expanded',o)});

  var top=document.querySelector('.totop');
  if(top){addEventListener('scroll',function(){top.classList.toggle('show',scrollY>500)},{passive:true});
    top.addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})})}

  /* one section at a time on wide screens */
  var deck=document.querySelector('.deck');if(!deck)return;
  var secs=[].slice.call(deck.querySelectorAll('.sec'));
  var wide=matchMedia('(min-width:1061px)');
  var dots=document.querySelector('.dots'),btns=[],prev,next;
  if(dots){
    var ol=dots.querySelector('ol');
    secs.forEach(function(s,i){
      var li=document.createElement('li'),b=document.createElement('button');
      b.type='button';b.setAttribute('aria-label',s.getAttribute('data-label')||('Section '+(i+1)));
      var sp=document.createElement('span');sp.textContent=s.getAttribute('data-label')||'';b.appendChild(sp);
      b.addEventListener('click',function(){go(i)});li.appendChild(b);ol.appendChild(li);btns.push(b);
    });
    prev=dots.querySelector('.prev');next=dots.querySelector('.next');
    prev.addEventListener('click',function(){go(idx-1)});next.addEventListener('click',function(){go(idx+1)});
  }
  var idx=0,lock=false,acc=0;
  var h=location.hash.slice(1);secs.forEach(function(s,i){if(s.id===h)idx=i});

  function paint(dir){
    secs.forEach(function(s,i){
      s.classList.toggle('on',i===idx);
      // sections above the current one wait above, below wait below: same motion both ways
      s.classList.toggle('up',i<idx);
      if(wide.matches){s.inert=i!==idx}else{s.inert=false}
    });
    btns.forEach(function(b,i){b.setAttribute('aria-current',i===idx)});
    if(prev){prev.disabled=idx===0;next.disabled=idx===secs.length-1}
  }
  function go(i,fromHash){
    if(i<0||i>=secs.length||i===idx)return;
    idx=i;lock=true;paint();
    if(secs[i].id&&!fromHash)history.replaceState(null,'','#'+secs[i].id);
    secs[i].scrollTop=0;
    setTimeout(function(){lock=false},reduce?60:900);
  }
  function mode(){html.classList.toggle('paged',wide.matches);paint()}
  mode();wide.addEventListener('change',mode);
  requestAnimationFrame(function(){requestAnimationFrame(function(){html.classList.add('ready')})});

  function edges(){var s=secs[idx];return{top:s.scrollTop<=0,bot:s.scrollTop+s.clientHeight>=s.scrollHeight-2}}
  deck.addEventListener('wheel',function(e){
    if(!wide.matches)return;
    var ed=edges();
    if((e.deltaY>0&&!ed.bot)||(e.deltaY<0&&!ed.top))return;
    e.preventDefault();if(lock)return;
    acc+=e.deltaY;if(Math.abs(acc)<30)return;
    go(idx+(acc>0?1:-1));acc=0;
  },{passive:false});
  var ty=null;
  deck.addEventListener('touchstart',function(e){ty=e.touches[0].clientY},{passive:true});
  deck.addEventListener('touchend',function(e){
    if(!wide.matches||ty===null)return;var dy=ty-e.changedTouches[0].clientY;ty=null;var ed=edges();
    if(dy>50&&ed.bot)go(idx+1);else if(dy<-50&&ed.top)go(idx-1);
  },{passive:true});
  addEventListener('keydown',function(e){
    if(!wide.matches||e.target.type==='range'||/input|textarea|select/i.test(e.target.tagName))return;
    if(e.key==='ArrowDown'||e.key==='PageDown'){e.preventDefault();go(idx+1)}
    else if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();go(idx-1)}
  });
  addEventListener('hashchange',function(){var t=location.hash.slice(1);secs.forEach(function(s,i){if(s.id===t)go(i,true)})});
  document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){
    var t=a.getAttribute('href').slice(1);secs.forEach(function(s,i){if(s.id===t&&wide.matches){e.preventDefault();go(i)}});
  })});
})();
