/* Live 3D hull lines in the background (plain WebGL, no libraries).
   The camera glides between views as sections change. */
(function(){
  var bg=document.querySelector('.bg'); if(!bg||!window.HULL) return;
  if(!matchMedia('(min-width:1061px)').matches) return;               // phones keep the still image
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;  // so does reduced motion
  var cv=document.createElement('canvas'); cv.className='hull3d';
  var gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); if(!gl) return;
  bg.appendChild(cv); bg.classList.add('live');

  var VS='attribute vec3 p;uniform mat4 m;void main(){gl_Position=m*vec4(p,1.0);}';
  var FS='precision mediump float;uniform vec4 c;void main(){gl_FragColor=c;}';
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'),uM=gl.getUniformLocation(pr,'m'),uC=gl.getUniformLocation(pr,'c');

  /* pack each family of polylines into one GL_LINES buffer */
  function pack(list){var out=[];list.forEach(function(a){for(var i=0;i+5<a.length;i+=3){out.push(a[i],a[i+1],a[i+2],a[i+3],a[i+4],a[i+5])}});
    var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(out),gl.STATIC_DRAW);return{b:b,n:out.length/3}}
  var H=window.HULL;
  var sets=[
    {g:pack(H.wl),c:[0.435,0.639,0.780,0.55]},   // waterlines: lighter blue
    {g:pack(H.st),c:[0.122,0.373,0.545,0.60]},   // stations: darker blue
    {g:pack(H.cl),c:[0.620,0.231,0.173,0.75]}    // centreline profile: oxide
  ];
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

  /* camera views in metres about the hull centre: x = length (bow +), y = height, z = breadth */
  var V={
    full:    {p:[30,-20,330],  t:[0,-2,0],    f:32,s:1},
    bowq:    {p:[230,-55,175], t:[70,-4,0],   f:30,s:.5},
    sternq:  {p:[-215,-50,165],t:[-75,-4,0],  f:30,s:.5},
    bow:     {p:[250,-6,70],   t:[120,-4,0],  f:38,s:.3},
    bowhead: {p:[330,2,0.01],  t:[100,-2,0],  f:30,s:.3},
    bulb:    {p:[190,-60,30],  t:[135,-8,0],  f:40,s:.3},
    stern:   {p:[-215,-25,70], t:[-125,-5,0], f:38,s:.3},
    sternaft:{p:[-280,-18,0.01],t:[-120,-6,0],f:34,s:.3},
    plan:    {p:[0.01,360,0],  t:[0,0,0],     f:34,s:0,up:[1,0,0]},
    above:   {p:[60,150,260],  t:[0,0,0],     f:32,s:.6}
  };
  var map=window.HULL_VIEWS||{};
  var to=V[map._default]||V.full, from=null, t0=0, dur=1800;
  var P=to.p.slice(),Tg=to.t.slice(),F=to.f,U=(to.up||[0,1,0]).slice();
  function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  function lerp(a,b,e){return a.map(function(v,i){return v+(b[i]-v)*e})}
  addEventListener('sectionchange',function(e){var v=V[map[e.detail.id]];if(v&&v!==to){from={p:P.slice(),t:Tg.slice(),f:F,u:U.slice()};to=v;t0=performance.now()}});

  /* tiny matrix helpers */
  function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  function norm(a){var l=Math.hypot(a[0],a[1],a[2])||1;return[a[0]/l,a[1]/l,a[2]/l]}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]}
  function mvp(eye,tg,up,fov,asp){
    var z=norm(sub(eye,tg)),x=norm(cross(up,z)),y=cross(z,x);
    var v=[x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1];
    var n=1,fr=4000,f=1/Math.tan(fov*Math.PI/360);
    var p=[f/asp,0,0,0, 0,f,0,0, 0,0,(fr+n)/(n-fr),-1, 0,0,2*fr*n/(n-fr),0];
    var o=new Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){var s=0;for(var k=0;k<4;k++)s+=p[k*4+r]*v[c*4+k];o[c*4+r]=s}return o;
  }
  function size(){var d=Math.min(devicePixelRatio||1,2);cv.width=innerWidth*d;cv.height=innerHeight*d;gl.viewport(0,0,cv.width,cv.height)}
  size();addEventListener('resize',size);

  var start=performance.now(),run=true;
  document.addEventListener('visibilitychange',function(){run=!document.hidden;if(run)requestAnimationFrame(loop)});
  function loop(now){
    if(!run)return;
    if(from){var k=Math.min((now-t0)/dur,1),e=ease(k);P=lerp(from.p,to.p,e);Tg=lerp(from.t,to.t,e);F=from.f+(to.f-from.f)*e;U=norm(lerp(from.u,to.up||[0,1,0],e));if(k>=1)from=null}
    var a=Math.sin((now-start)/9000)*0.10*(to.s||0),c=Math.cos(a),s=Math.sin(a),r=sub(P,Tg);
    var eye=[Tg[0]+r[0]*c-r[2]*s,Tg[1]+r[1],Tg[2]+r[0]*s+r[2]*c];
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(uM,false,new Float32Array(mvp(eye,Tg,U,F,cv.width/cv.height)));
    sets.forEach(function(st){gl.bindBuffer(gl.ARRAY_BUFFER,st.g.b);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);gl.uniform4fv(uC,st.c);gl.drawArrays(gl.LINES,0,st.g.n)});
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
