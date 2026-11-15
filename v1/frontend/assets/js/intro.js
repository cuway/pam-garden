import * as THREE from "three";

const VERT=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;

const FRAG=`
precision highp float;
varying vec2 vUv;
uniform float uT,uP,uA,uHave;
uniform sampler2D tA,tB,tC;
uniform vec2 uR;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p){
  float s=0.,a=.5;
  for(int i=0;i<OCT;i++){
    s+=a*noise(p);
    p=p*2.03+vec2(17.1,9.7);
    a*=.5;
  }
  return s;
}
float roads(vec2 q,float f){
  vec2 g=abs(fract(q*f)-.5);
  return smoothstep(.48,.5,max(g.x,g.y));
}
vec3 land(vec2 q,float sc){
  vec2 w=q+.55*vec2(fbm(q*.9+3.),fbm(q*.9+9.));
  float h=fbm(w*1.25);
  float river=1.-smoothstep(.0,.03*max(1.,sc*1.5),abs(fbm(w*.6+7.)-.5));
  float w20=smoothstep(.5,.2,sc),w80=smoothstep(.12,.04,sc);
  vec2 gq=q+.03*vec2(fbm(q*6.+2.),fbm(q*6.+8.));
  float fh=hash(floor(gq*5.));
  fh=mix(fh,hash(floor(gq*20.)),w20*.8);
  fh=mix(fh,hash(floor(gq*80.)),w80*.8);
  float road=max(roads(gq,5.),max(roads(gq,20.)*w20,roads(gq,80.)*w80));
  vec3 field=mix(vec3(.30,.42,.17),vec3(.64,.56,.28),fh);
  field=mix(field,vec3(.16,.34,.14),step(.62,fh));
  float k=max(1.,.3/sc);
  vec3 canopy=mix(vec3(.04,.14,.07),vec3(.16,.34,.13),fbm(q*22.*k));
  float forest=smoothstep(.36,.5,h);
  vec3 c=mix(field*(.68+.64*fbm(q*11.*k)),canopy,forest);
  c=mix(c,vec3(.80,.74,.6),road*(1.-forest)*.4);
  c=mix(c,vec3(.10,.30,.34),river*.9);
  float city=smoothstep(.6,.5,h)*(1.-smoothstep(.0,.14,abs(fbm(w*.45+21.)-.5)));
  c=mix(c,vec3(.6,.55,.5)*(.75+.35*hash(floor(q*120.*max(1.,.12/sc)))),city*.45*(1.-river));
  return c;
}
vec3 sharp(sampler2D t,vec2 u,float px,float amt){
  vec3 c=texture2D(t,u).rgb;
  vec3 b=(texture2D(t,u+vec2(px,0.)).rgb+texture2D(t,u-vec2(px,0.)).rgb+texture2D(t,u+vec2(0.,px)).rgb+texture2D(t,u-vec2(0.,px)).rgb)*.25;
  return clamp(c+(c-b)*amt,0.,1.);
}
float cloudLayer(vec2 uv,float zoom,float seed,float th,out float lit){
  vec2 p=uv/zoom*2.4+seed+vec2(uT*.025,uT*.012);
  float c=fbm(p);
  float d=fbm(p+vec2(.07,.09));
  lit=clamp(.62+(c-d)*3.4,0.,1.);
  return smoothstep(th,th+.28,c);
}
void main(){
  float P=uP;
  vec2 uv=(vUv-.5)*vec2(uR.x/uR.y,1.);
  float shake=.0035*smoothstep(.0,.15,P)*(1.-smoothstep(.8,1.,P));
  uv+=shake*vec2(sin(uT*1.7)+sin(uT*3.1),cos(uT*1.3)+cos(uT*2.7));
  float tilt=.7*(1.-smoothstep(.0,.4,P))+.55*smoothstep(.74,1.,P);
  float dn=max(.3,1.-tilt*uv.y*1.5);
  vec2 pp=uv/dn;
  float roll=.35*smoothstep(.1,.8,P)-.1*smoothstep(.78,1.,P);
  float cr=cos(roll),sr=sin(roll);
  vec2 rp=mat2(cr,-sr,sr,cr)*pp;
  float pm=smoothstep(.03,.74,P);
  float scale=exp(mix(log(.9),log(.035),pm));
  vec2 target=vec2(2.7,1.3);
  vec3 col=land(target+rp*scale,scale);
  float km=exp(mix(log(520.),log(4.),pm));
  vec2 d=rp*km;
  vec3 sat=texture2D(tA,vec2(.5)+d/990.).rgb;
  vec2 ub=vec2(.7687,.1697)+d/109.8;
  vec2 uc=vec2(.5)+d/20.;
  float eb=smoothstep(.0,.07,min(min(ub.x,1.-ub.x),min(ub.y,1.-ub.y)));
  float ec=smoothstep(.0,.07,min(min(uc.x,1.-uc.x),min(uc.y,1.-uc.y)));
  sat=mix(sat,sharp(tB,ub,.0007,.8),smoothstep(260.,110.,km)*eb);
  sat=mix(sat,sharp(tC,uc,.0009,1.3),smoothstep(40.,18.,km)*ec);
  float lum=dot(sat,vec3(.299,.587,.114));
  sat=mix(vec3(lum),sat,1.22);
  sat=clamp((sat-.5)*1.12+.5+.02,0.,1.);
  sat*=1.+(fbm(rp*vec2(90.,90.)+4.)-.5)*.14*smoothstep(30.,3.,km);
  col=mix(col,sat,uHave);
  float haze=1.-smoothstep(.0,.46,P);
  col=mix(col,vec3(.6,.74,.9),haze*.32);
  float th=mix(.4,.86,smoothstep(.06,.4,P));
  float l1,l2,l3;
  float z1=exp(P*2.2),z2=exp(P*3.6),z3=exp(P*5.2);
  float c1=cloudLayer(pp,z1,1.7,th,l1);
  float c2=cloudLayer(pp,z2,6.3,th+.04,l2);
  float c3=cloudLayer(pp,z3,11.9,th+.08,l3);
  vec3 sh=vec3(.34,.46,.68);
  vec3 wh=vec3(.97,.97,1.);
  col=mix(col,mix(sh,wh,l1),c1);
  col=mix(col,mix(sh,wh,l2),c2);
  float ph=smoothstep(.1,.22,P)*(1.-smoothstep(.22,.36,P));
  col=mix(col,mix(sh,wh,l3),c3*smoothstep(.0,.2,P)*(1.-smoothstep(.26,.4,P)));
  float r=length(uv);
  float ang=atan(uv.y,uv.x);
  float rush=noise(vec2(ang*26.,r*3.-uT*9.))*noise(vec2(ang*9.+4.,r*1.4-uT*5.));
  col+=vec3(.9,.95,1.)*pow(rush,2.2)*ph*.8*smoothstep(.1,.9,r+.2);
  col=mix(col,vec3(.95,.97,1.),ph*.4*smoothstep(.0,.9,1.-r));
  float sun=smoothstep(1.2,.0,length(uv-vec2(-.5,.55)));
  col+=vec3(1.,.82,.55)*sun*.16*(1.-smoothstep(.3,.7,P));
  float leaf=fbm(uv*vec2(7.,7.)+vec2(uT*.05,3.));
  vec3 leafCol=mix(vec3(.03,.10,.05),vec3(.2,.38,.16),leaf)*(.75+.5*fbm(uv*26.));
  col=mix(col,leafCol,smoothstep(.8,.97,P));
  float endMix=smoothstep(.8,.98,P);
  col=mix(col,col*vec3(.75,.95,.75)+vec3(.02,.05,.03),endMix*.35);
  col*=1.-.55*smoothstep(.55,1.25,length(uv*vec2(.9,1.))+.0)*(1.-.7*P);
  col+=(hash(vUv*uR+uT)-.5)*.035;
  gl_FragColor=vec4(col,uA);
}
`;

export function createIntro(mobile){
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const material=new THREE.ShaderMaterial({
    vertexShader:VERT,
    fragmentShader:FRAG,
    defines:{OCT:mobile?4:5},
    uniforms:{uT:{value:0},uP:{value:0},uA:{value:1},uHave:{value:0},uR:{value:new THREE.Vector2(1,1)},tA:{value:null},tB:{value:null},tC:{value:null}},
    transparent:true,
    depthTest:false,
    depthWrite:false
  });
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
  mesh.frustumCulled=false;
  scene.add(mesh);
  const loader=new THREE.TextureLoader();
  const names=["region","tile","near"];
  const textures=names.map(n=>new Promise(res=>{
    loader.load(`assets/img/sat/${n}.webp`,t=>{
      t.anisotropy=4;
      res(t);
    },undefined,()=>res(null));
  }));
  const ready=Promise.race([
    Promise.all(textures).then(ts=>{
      if(ts.every(Boolean)){
        ["tA","tB","tC"].forEach((k,i)=>{material.uniforms[k].value=ts[i]});
        material.uniforms.uHave.value=1;
      }
    }),
    new Promise(res=>setTimeout(res,5000))
  ]);
  return {
    scene,
    ready,
    camera,
    update(t,p,a){
      material.uniforms.uT.value=t;
      material.uniforms.uP.value=p;
      material.uniforms.uA.value=a;
      return a>.002;
    },
    resize(w,h){
      material.uniforms.uR.value.set(w,h);
    }
  };
}
