import * as THREE from "three";

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=t=>t*t*(3-2*t);

const STOPS=[
  {p:0,tint:[.94,1,.96],b:0.94,sun:0.5,fly:0.06,zoom:0,sx:0.18,sy:1.1,col:[.95,1,.88]},
  {p:0.063,tint:[.94,1,.96],b:0.94,sun:0.5,fly:0.06,zoom:0.06,sx:0.2,sy:1.1,col:[.95,1,.88]},
  {p:0.09,tint:[1.05,1.09,1],b:1.04,sun:0.6,fly:0.05,zoom:0.1,sx:0.3,sy:1.12,col:[1,.9,.93]},
  {p:0.218,tint:[1.05,1.09,1],b:1.04,sun:0.6,fly:0.05,zoom:0.14,sx:0.34,sy:1.12,col:[1,.9,.93]},
  {p:0.254,tint:[1.22,1.1,.84],b:1.3,sun:1.05,fly:0.03,zoom:0.16,sx:0.52,sy:1.2,col:[1,.95,.6]},
  {p:0.381,tint:[1.22,1.1,.84],b:1.3,sun:1.05,fly:0.03,zoom:0.2,sx:0.54,sy:1.2,col:[1,.95,.6]},
  {p:0.417,tint:[.64,.78,.86],b:0.58,sun:0.1,fly:0,zoom:0.22,sx:0.5,sy:1,col:[.6,.72,.82]},
  {p:0.526,tint:[.64,.78,.86],b:0.58,sun:0.1,fly:0,zoom:0.24,sx:0.5,sy:1,col:[.6,.72,.82]},
  {p:0.562,tint:[1.22,.95,.68],b:0.96,sun:0.62,fly:0.06,zoom:0.24,sx:0.8,sy:0.8,col:[1,.65,.3]},
  {p:0.653,tint:[1.22,.95,.68],b:0.96,sun:0.62,fly:0.06,zoom:0.26,sx:0.82,sy:0.8,col:[1,.65,.3]},
  {p:0.689,tint:[.82,.92,1.1],b:1.06,sun:0.3,fly:0.1,zoom:0.28,sx:0.5,sy:1.1,col:[.8,.9,1]},
  {p:0.78,tint:[.82,.92,1.1],b:1.06,sun:0.3,fly:0.1,zoom:0.28,sx:0.52,sy:1.1,col:[.8,.9,1]},
  {p:0.8,tint:[1.1,1,.86],b:1,sun:0.78,fly:0.5,zoom:0.26,sx:0.7,sy:0.9,col:[1,.8,.5]},
  {p:0.93,tint:[1.1,1,.86],b:1,sun:0.78,fly:0.5,zoom:0.26,sx:0.72,sy:0.9,col:[1,.8,.5]},
  {p:0.975,tint:[.62,.78,.88],b:0.66,sun:0.28,fly:1.1,zoom:0.3,sx:0.7,sy:0.5,col:[.5,.62,.95]},
  {p:1,tint:[.58,.74,.86],b:0.62,sun:0.25,fly:1.2,zoom:0.32,sx:0.7,sy:0.5,col:[.5,.62,.95]}
];
const KEYS=["b","sun","fly","zoom","sx","sy"];

const VERT="varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}";
const FRAG=`
varying vec2 vUv;
uniform sampler2D uTex,uDepth;
uniform float uTime,uZoom,uAspect,uScreen,uBright,uSun,uFly;
uniform vec2 uMouse,uPan;
uniform vec3 uTint,uSunCol;
uniform vec2 uSunPos;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p){return noise(p)*.55+noise(p*2.03)*.3+noise(p*4.1)*.15;}
vec2 cover(vec2 uv){
  float r=uScreen/uAspect;
  return r>1.?vec2(uv.x,(uv.y-.5)/r+.5):vec2((uv.x-.5)*r+.5,uv.y);
}
void main(){
  vec2 uv=cover(vUv);
  float d=texture2D(uDepth,uv).r;
  vec2 f=vec2(.5,.5);
  float k=uZoom*(.45+d*.55);
  vec2 p=f+(uv-f)/(1.+k);
  p+=(uMouse*.02+vec2(sin(uTime*.15)*.004,cos(uTime*.11)*.002))*(d-.35);
  p+=uPan*(d-.4)*.06;
  p=clamp(p,.001,.999);
  vec3 c=texture2D(uTex,p).rgb;
  float fg=fbm(vUv*vec2(3.,2.)+vec2(uTime*.02,-uTime*.01))*fbm(vUv*vec2(2.,3.)-vec2(uTime*.015,0.));
  c=mix(c,vec3(.5,.7,.55)*uBright,fg*.3*(1.-d));
  vec2 s=vUv-uSunPos;
  float a=atan(s.y,s.x);
  float r=length(s*vec2(uScreen,1.));
  float ray=pow(.5+.5*sin(a*20.+fbm(vec2(a*3.,uTime*.05))*6.+uTime*.12),4.)*exp(-r*1.3)*smoothstep(.04,.45,r);
  c+=uSunCol*(ray*.7*(1.-d*.6)+exp(-r*2.4)*.35)*uSun;
  for(int i=0;i<26;i++){
    float fi=float(i);
    vec2 q=vec2(hash(vec2(fi,1.)),.1+hash(vec2(fi,2.))*.8);
    q.x+=sin(uTime*.2+fi*3.)*.03;
    q.y=fract(q.y+uTime*.006*(.5+hash(vec2(fi,3.))));
    vec2 dd=(vUv-q)*vec2(uScreen,1.);
    float g=.00005/(dot(dd,dd)+.00002)*(.5+.5*sin(uTime*(.6+hash(vec2(fi,4.))*.8)+fi));
    c+=vec3(.9,1.,.55)*g*uFly;
  }
  c*=uTint*uBright;
  vec2 v=vUv-.5;
  c*=1.-dot(v,v)*1.15;
  c+=(hash(vUv*vec2(1920.,1080.)+fract(uTime))-.5)*.025;
  gl_FragColor=vec4(c,1.);
  #include <colorspace_fragment>
}`;

function sample(p){
  let i=0;
  while(i<STOPS.length-2&&p>STOPS[i+1].p)i++;
  const a=STOPS[i],b=STOPS[i+1],t=smooth(clamp((p-a.p)/(b.p-a.p)));
  const out={tint:a.tint.map((v,k)=>v+(b.tint[k]-v)*t),col:a.col.map((v,k)=>v+(b.col[k]-v)*t)};
  KEYS.forEach(k=>out[k]=a[k]+(b[k]-a[k])*t);
  return out;
}

export function createBackdrop(renderer){
  const loader=new THREE.TextureLoader();
  const tex=loader.load("assets/img/forest/forest.jpg",t=>{uniforms.uAspect.value=t.image.width/t.image.height});
  tex.colorSpace=THREE.SRGBColorSpace;
  const depth=loader.load("assets/img/forest/depth.png");
  const uniforms={
    uTex:{value:tex},uDepth:{value:depth},uTime:{value:0},uZoom:{value:0},uAspect:{value:16/9},uScreen:{value:1},
    uBright:{value:1},uSun:{value:.2},uSunPos:{value:new THREE.Vector2(.4,1.1)},uSunCol:{value:new THREE.Vector3(1,.9,.6)},uFly:{value:.2},uMouse:{value:new THREE.Vector2()},uPan:{value:new THREE.Vector2()},uTint:{value:new THREE.Vector3(1,1,1)}
  };
  const scene=new THREE.Scene();
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({uniforms,vertexShader:VERT,fragmentShader:FRAG,depthTest:false,depthWrite:false}));
  mesh.frustumCulled=false;
  scene.add(mesh);
  const camera=new THREE.Camera();

  function render(t,progress,pointer,pan){
    const m=sample(progress);
    uniforms.uTime.value=t;
    uniforms.uZoom.value=m.zoom;
    uniforms.uBright.value=m.b;
    uniforms.uSun.value=m.sun;
    uniforms.uFly.value=m.fly;
    uniforms.uSunPos.value.set(m.sx,m.sy);
    uniforms.uSunCol.value.set(...m.col);
    uniforms.uTint.value.set(...m.tint);
    uniforms.uMouse.value.set(pointer.x,-pointer.y);
    uniforms.uPan.value.set(pan.x,pan.y);
    const size=renderer.getSize(new THREE.Vector2());
    uniforms.uScreen.value=size.x/size.y;
    renderer.clear();
    renderer.render(scene,camera);
    return m;
  }
  return {render};
}
