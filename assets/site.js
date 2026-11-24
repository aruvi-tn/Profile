/* hiaruvi.com — native scrolling with gentle snap, section dots, reveal on arrival */
(function(){
  var html=document.documentElement; html.classList.add('js');
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* mobile menu */
  var burger=document.querySelector('.burger'),drawer=document.querySelector('.drawer');
  if(burger&&drawer){
    burger.addEventListener('click',function(){var o=drawer.classList.toggle('open');burger.setAttribute('aria-expanded',o)});
    drawer.addEventListener('click',function(e){if(e.target.tagName==='A'){drawer.classList.remove('open');burger.setAttribute('aria-expanded','false')}});
  }

  /* back to top */
  var top=document.querySelector('.totop');
  if(top){addEventListener('scroll',function(){top.classList.toggle('show',scrollY>500)},{passive:true});
    top.addEventListener('click',function(){scrollTo({top:0,behavior:reduce?'auto':'smooth'})})}

  var secs=[].slice.call(document.querySelectorAll('.sec'));
  if(!secs.length) return;

  /* reveal each section once as it arrives */
  if('IntersectionObserver' in window&&!reduce){
    var rv=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');rv.unobserve(e.target)}})},{threshold:.12});
    secs.forEach(function(s){rv.observe(s)});
  }else secs.forEach(function(s){s.classList.add('in')});
  // anything already on screen at load shows straight away
  secs.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)s.classList.add('in')});

  /* section dots and arrows */
  var dots=document.querySelector('.dots'),btns=[],idx=0,prev,next;
  function goTo(i){if(i<0||i>=secs.length)return;secs[i].scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}
  if(dots){
    var ol=dots.querySelector('ol');
    secs.forEach(function(s,i){
      var li=document.createElement('li'),b=document.createElement('button'),sp=document.createElement('span');
      b.type='button';b.setAttribute('aria-label',s.getAttribute('data-label')||('Section '+(i+1)));
      sp.textContent=s.getAttribute('data-label')||'';b.appendChild(sp);
      b.addEventListener('click',function(){goTo(i)});li.appendChild(b);ol.appendChild(li);btns.push(b);
    });
    prev=dots.querySelector('.prev');next=dots.querySelector('.next');
    prev.addEventListener('click',function(){goTo(idx-1)});next.addEventListener('click',function(){goTo(idx+1)});
  }
  function current(){
    var mid=innerHeight*0.4,best=0;
    secs.forEach(function(s,i){if(s.getBoundingClientRect().top<=mid)best=i});
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)best=secs.length-1;
    return best;
  }
  function paint(){
    idx=current();
    btns.forEach(function(b,i){b.setAttribute('aria-current',i===idx)});
    if(prev){prev.disabled=idx===0;next.disabled=idx===secs.length-1}
  }
  var ticking=false;
  addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(function(){paint();ticking=false})}},{passive:true});
  addEventListener('resize',paint);
  paint();
})();
