import * as THREE from "three";

const VERT=`
uniform float uVel;
varying vec2 vUv;
void main(){
  vUv=uv;
  vec3 p=position;
  float c=uv.y-.5;
  p.z+=(1.-4.*c*c)*uVel*70.+sin(uv.x*3.14159)*uVel*14.;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;

const FRAG=`
uniform sampler2D uTex;
uniform float uReveal,uHover,uVel,uDir;
uniform vec2 uPtr;
varying vec2 vUv;
void main(){
  float zoom=mix(1.22,1.,smoothstep(0.,1.,uReveal));
  vec2 uv=(vUv-.5)/zoom+.5;
  vec3 c=texture2D(uTex,uv).rgb;
  float edge=uDir>0.?1.-vUv.y:vUv.y;
  float m=smoothstep(uReveal*1.15-.15,uReveal*1.15,edge);
  c+=vec3(1.,.96,.88)*uHover*smoothstep(.6,0.,distance(vUv,uPtr))*.17;
  c*=1.-.1*smoothstep(.4,.9,distance(vUv,vec2(.5)));
  gl_FragColor=vec4(c,1.-m);
}`;

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));

export function startGL(){
  const canvas=document.createElement("canvas");
  canvas.className="gl";
  canvas.setAttribute("aria-hidden","true");
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"high-performance"});
  renderer.setClearColor(0,0);
  document.body.prepend(canvas);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(30,1,10,8000);
  const geo=new THREE.PlaneGeometry(1,1,20,20);
  let W=0,H=0;
  function resize(){
    W=document.documentElement.clientWidth;
    H=document.documentElement.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setSize(W,H,false);
    camera.aspect=W/H;
    camera.position.z=H/(2*Math.tan(THREE.MathUtils.degToRad(15)));
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(document.documentElement);
  resize();

  let pins=0;
  const planes=[...document.querySelectorAll(".shot,.pin")].map(el=>{
    const pin=el.classList.contains("pin");
    const mat=new THREE.ShaderMaterial({
      vertexShader:VERT,
      fragmentShader:FRAG,
      transparent:true,
      depthTest:false,
      uniforms:{uTex:{value:null},uVel:{value:0},uDir:{value:1},uReveal:{value:0},uHover:{value:0},uPtr:{value:new THREE.Vector2(.5,.5)}}
    });
    const mesh=new THREE.Mesh(geo,mat);
    mesh.visible=false;
    mesh.frustumCulled=false;
    scene.add(mesh);
    return {
      el,pin,mat,mesh,tex:null,t0:0,k:0,dir:1,hover:0,tx:0,ty:0,
      img:el.querySelector("img"),
      delay:pin?pins++*180:0,
      rot:pin?-(parseFloat(getComputedStyle(el).getPropertyValue("--r"))||0)*Math.PI/180:0
    };
  });

  const ptr={x:-9999,y:-9999,nx:0,ny:0};
  addEventListener("pointermove",e=>{
    ptr.x=e.clientX;
    ptr.y=e.clientY;
    ptr.nx=e.clientX/W-.5;
    ptr.ny=e.clientY/H-.5;
  });

  function ensureTexture(p){
    if(p.tex)return;
    if(!p.raw){
      if(!p.img.currentSrc)return;
      p.raw=new Image();
      p.raw.src=p.img.currentSrc;
    }
    if(!p.raw.complete||!p.raw.naturalWidth)return;
    const t=new THREE.Texture(p.raw);
    t.generateMipmaps=true;
    t.minFilter=THREE.LinearMipmapLinearFilter;
    t.anisotropy=4;
    t.needsUpdate=true;
    p.tex=t;
    p.mat.uniforms.uTex.value=t;
  }

  let last=scrollY,vel=0,prev=0;
  function frame(now){
    const dt=Math.min(.1,(now-(prev||now))/1000);
    prev=now;
    vel+=(clamp((scrollY-last)/48,-1.2,1.2)-vel)*.12;
    last=scrollY;
    let any=false;
    planes.forEach(p=>{
      const r=p.img.getBoundingClientRect();
      if(r.bottom<-H*1.5||r.top>H*2.5){
        if(p.tex){
          p.tex.dispose();
          p.tex=null;
          p.mat.uniforms.uTex.value=null;
        }
        p.mesh.visible=false;
        return;
      }
      ensureTexture(p);
      const show=p.tex&&r.bottom>-120&&r.top<H+120;
      p.mesh.visible=!!show;
      if(!show)return;
      any=true;
      const w=p.img.offsetWidth,h=p.img.offsetHeight;
      const cx=r.left+r.width/2,cy=r.top+r.height/2;
      const inside=ptr.x>r.left&&ptr.x<r.right&&ptr.y>r.top&&ptr.y<r.bottom;
      p.hover+=((inside?1:0)-p.hover)*.1;
      const tx=p.pin?ptr.nx*.55:inside?(ptr.x-cx)/w:0;
      const ty=p.pin?ptr.ny*.55:inside?(ptr.y-cy)/h:0;
      p.tx+=(tx-p.tx)*.1;
      p.ty+=(ty-p.ty)*.1;
      const want=p.el.classList.contains("in");
      if(want&&!p.t0)p.t0=now+p.delay;
      else if(!want)p.dir=p.el.classList.contains("above")?-1:1;
      p.k+=((want&&now>=p.t0?1:0)-p.k)*Math.min(1,dt*3);
      const u=p.mat.uniforms;
      u.uReveal.value=1-Math.pow(1-p.k,3);
      u.uDir.value=p.dir;
      u.uHover.value=p.hover;
      u.uVel.value=vel;
      if(inside)u.uPtr.value.set((ptr.x-r.left)/r.width,1-(ptr.y-r.top)/r.height);
      const s=1+p.hover*.03;
      p.mesh.position.set(cx-W/2,H/2-cy,p.hover*36);
      p.mesh.scale.set(w*s,h*s,1);
      p.mesh.rotation.set(p.ty*.45,p.tx*.45,p.rot);
    });
    if(any)renderer.render(scene,camera);
    else renderer.clear();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
