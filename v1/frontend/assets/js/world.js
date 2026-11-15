import * as THREE from "three";

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=t=>t*t*(3-2*t);
const rnd=(a,b)=>a+Math.random()*(b-a);

export const CHAPTERS=[
  {a:0,b:.1},
  {a:.1,b:.3},
  {a:.3,b:.5},
  {a:.5,b:.68},
  {a:.68,b:.84},
  {a:.84,b:1}
];

const KEYS=[
  {t:0,p:[0,2.2,0],g:[0,2.4,-20]},
  {t:.1,p:[0,2.2,-22],g:[0,2.4,-44]},
  {t:.3,p:[0,2.2,-92],g:[0,2.4,-114]},
  {t:.32,p:[-14,3,-100],g:[-14,3,-122]},
  {t:.48,p:[14,3,-100],g:[14,3,-122]},
  {t:.52,p:[0,3,-118],g:[0,5,-140]},
  {t:.66,p:[0,36,-118],g:[0,36,-140]},
  {t:.7,p:[14,37,-148],g:[14,36,-170]},
  {t:.82,p:[-14,37,-148],g:[-14,36,-170]},
  {t:.88,p:[-16,37,-190],g:[-16,37,-215]},
  {t:1,p:[16,37,-190],g:[16,37,-215]}
];

const G=1.15;
const sized=(id,hs,fn,m)=>hs.map((h0,i)=>{
  const h=h0*G;
  return {id:`${id}-${i+1}`,...fn(i,h),h,roll:0,ratio:.75,...m};
});
const trail=(id,hs,z0,step,xf,y,m)=>sized(id,hs,(i,h)=>({x:xf(i),y:y+(i%2?-1.5:1.5),z:z0-i*step}),m);
const rowOf=(id,hs,z,base,gap,m)=>{
  const total=hs.reduce((n,h)=>n+h*G*.75,0)+gap*(hs.length-1);
  let left=-total/2;
  return sized(id,hs,(i,h)=>{
    const x=left+h*.375;
    left+=h*.75+gap;
    return {x,y:base+h/2,z};
  },m);
};
const colOf=(id,hs,z,y0,gap,xf,m)=>{
  let y=y0;
  return sized(id,hs,(i,h)=>{
    const c=y+h/2;
    y+=h+gap;
    return {x:xf(i),y:c,z};
  },m);
};
const title=(id,vi,en,outline,x,y,z,h,at,until)=>({id,title:{vi,en,outline},x,y,z,h,roll:0,ratio:1,at,until,ms:.6});
const wide=(id,x,y,z,h,at)=>({id,x,y,z,h,roll:0,ratio:4/3,at,ms:.8});
const card=(id,x,y,z,h)=>({id,x,y,z,h,roll:0,ratio:.75});

const heroItems=mobile=>mobile?[
  card("hero-1",1.9,5,-12,4.4),
  card("hero-2",-2.5,6,-14,3.2),
  card("hero-3",-2.4,2.4,-13,3.4),
  card("hero-4",2,.4,-12.5,2.8)
]:[
  card("hero-1",3.2,2.2,-12,6.4),
  card("hero-2",7.6,4.4,-14,4.4),
  card("hero-3",7.7,-.4,-13,4),
  card("hero-4",4,-3.1,-14,3.4)
];

const buildItems=mobile=>[
  ...heroItems(mobile),
  title("title-1","Monstera","Monstera",false,0,3.4,-78,8,.07,.3),
  wide("extra-1",-2,10.5,-58,5.5,.08),
  ...trail("monstera",[6.5,8,6.5,8.5,7],-38,10,mobile?(i=>i%2?-7:7):(i=>i%2?-9:-6.6),2.8,{mx:.5,ms:.8}),
  {id:"monstera-core",x:-7.5,y:2.4,z:-88,h:5,roll:0,ratio:1,mx:.5,ms:.8},
  title("title-2","Anthurium","Anthurium",true,0,10.5,-142,8,.27,.5),
  wide("extra-2",-11,15,-134,6.5,.28),
  ...rowOf("anthurium",[6,9.5,6.5,8,5.5],-122,-.5,3),
  title("title-3","Begonia","Begonia",false,0,22,-160,9,.47,.68),
  wide("extra-3",0,16,-152,6,.5),
  ...colOf("begonia",[6,8,5.5,7.5,6],-140,2,2.2,mobile?(i=>i%2?-6:6):(i=>i%2?-8.5:-5),{mx:.55,ms:.9}),
  {id:"begonia-core",x:mobile?-6:-6.5,y:39,z:-140,h:5,roll:0,ratio:1,mx:.55,ms:.9},
  title("title-4","Lan & súng","Orchid & lily",true,0,47,-186,8,.65,.84),
  wide("extra-4",16,47,-176,6.5,.66),
  ...rowOf("orchid",[7,5.5,9.5,6,8],-170,33,3),
  title("title-5","Từ vườn","The garden",false,6,37.5,-238,12,.81,9),
  wide("extra-5",-27,37,-228,7,.82),
  ...rowOf("garden",[5,7,5.5,6.5,5],-215,31,2.5),
  ...rowOf("garden",[6,4.5,7,5],-215,40,2.5).map((o,i)=>({...o,id:`garden-${i+6}`}))
];

function appearTimes(ITEMS){
  const at={};
  const rules=[["hero",-.06,.008],["monstera",.08,.02],["anthurium",.28,.015],["begonia",.5,.025],["orchid",.66,.015],["garden",.82,.012]];
  rules.forEach(([key,start,step])=>{
    let n=0;
    ITEMS.forEach(it=>{
      if(it.id.startsWith(key+"-")){
        at[it.id]=start+n*step;
        n++;
      }
    });
  });
  return at;
}

export function createWorld(mobile){
  let baseFov=50;
  const kx=1;
  const xs=it=>mobile?(it.mx??1):1;
  const cs=it=>mobile?(it.ms??1):1;
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x5a8a66,14,78);
  const camera=new THREE.PerspectiveCamera(50,1,.1,400);
  const posCurve=new THREE.CatmullRomCurve3(KEYS.map(k=>new THREE.Vector3(k.p[0]*kx,k.p[1],k.p[2])),false,"centripetal");
  const tgtCurve=new THREE.CatmullRomCurve3(KEYS.map(k=>new THREE.Vector3(k.g[0]*kx,k.g[1],k.g[2])),false,"centripetal");
  const pos=new THREE.Vector3(),tgt=new THREE.Vector3();

  function uOf(T){
    let i=0;
    while(i<KEYS.length-2&&T>KEYS[i+1].t)i++;
    const a=KEYS[i],b=KEYS[i+1];
    return (i+clamp((T-a.t)/(b.t-a.t)))/(KEYS.length-1);
  }
  function sample(T){
    const u=uOf(clamp(T));
    posCurve.getPoint(u,pos);
    tgtCurve.getPoint(u,tgt);
  }

  const loader=new THREE.TextureLoader();
  const textures={};
  const tex=id=>{
    if(!textures[id]){
      const t=loader.load(`assets/img/bloom/${id}.webp`);
      t.colorSpace=THREE.SRGBColorSpace;
      t.anisotropy=4;
      textures[id]=t;
    }
    return textures[id];
  };

  const ITEMS=buildItems(mobile);
  const at=appearTimes(ITEMS);
  const geo=new THREE.PlaneGeometry(1,1);
  const FONT="300 300px Fraunces,'Times New Roman',serif";
  const lang=()=>document.documentElement.lang==="en"?"en":"vi";
  function drawTitle(spec){
    const c=document.createElement("canvas");
    const g=c.getContext("2d");
    const text=spec[lang()];
    g.font=FONT;
    c.width=Math.ceil(g.measureText(text).width)+120;
    c.height=440;
    g.font=FONT;
    g.textBaseline="alphabetic";
    g.shadowColor="rgba(4,14,8,.65)";
    g.shadowBlur=40;
    if(spec.outline){
      g.strokeStyle="rgba(255,255,255,.9)";
      g.lineWidth=4;
      g.strokeText(text,60,320);
    }else{
      const gr=g.createLinearGradient(0,60,0,340);
      gr.addColorStop(0,"rgba(255,255,255,.96)");
      gr.addColorStop(1,"rgba(255,255,255,.5)");
      g.fillStyle=gr;
      g.fillText(text,60,320);
    }
    const t=new THREE.CanvasTexture(c);
    t.colorSpace=THREE.SRGBColorSpace;
    t.anisotropy=4;
    return {t,ratio:c.width/c.height};
  }
  const shadowTex=(()=>{
    const c=document.createElement("canvas");
    c.width=c.height=128;
    const g=c.getContext("2d");
    g.shadowColor="#000";
    g.shadowBlur=22;
    g.fillStyle="#000";
    g.fillRect(28,28,72,72);
    return new THREE.CanvasTexture(c);
  })();
  function softFar(m){
    m.onBeforeCompile=sh=>{
      sh.uniforms.uBias={value:0};
      m.userData.bias=sh.uniforms.uBias;
      sh.fragmentShader=`uniform float uBias;
${sh.fragmentShader.replace("#include <map_fragment>",`#ifdef USE_MAP
diffuseColor*=texture2D(map,vMapUv,uBias);
#endif`)}`;
    };
  }
  const ray=new THREE.Raycaster();
  const hoverOn=!mobile&&matchMedia("(hover:hover)").matches;
  const billboards=ITEMS.map((it,i)=>{
    const made=it.title?drawTitle(it.title):null;
    const mat=new THREE.MeshBasicMaterial({map:made?made.t:tex(it.id),transparent:true,depthWrite:false,depthTest:!it.title,side:THREE.DoubleSide,opacity:0,fog:!it.title});
    if(!it.title)softFar(mat);
    const mesh=new THREE.Mesh(geo,mat);
    mesh.renderOrder=it.title?5:1;
    let shadow=null;
    if(!it.title){
      shadow=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:shadowTex,color:0x000000,transparent:true,depthWrite:false,opacity:0}));
      shadow.position.set(.05,-.06,-.02);
      shadow.scale.set(1.3,1.24,1);
      shadow.renderOrder=0;
      mesh.add(shadow);
    }
    const ratio=made?made.ratio:it.ratio||.75;
    mesh.scale.set(it.h*ratio*cs(it),it.h*cs(it),1);
    mesh.position.set(it.x*xs(it),it.y,it.z);
    mesh.visible=false;
    scene.add(mesh);
    const bb={mesh,mat,shadow,hv:0,it,at:it.at??at[it.id]??0,ph:rnd(0,6.28),base:new THREE.Vector3(it.x*xs(it),it.y,it.z),sc:new THREE.Vector3(it.h*ratio*cs(it),it.h*cs(it),1),dim:it.title?(it.title.outline?.85:.62):1};
    mesh.userData.bb=bb;
    return bb;
  });
  const cards=billboards.filter(b=>!b.it.title).map(b=>b.mesh);
  function redrawTitles(){
    billboards.forEach(bb=>{
      if(!bb.it.title)return;
      const made=drawTitle(bb.it.title);
      bb.mat.map.dispose();
      bb.mat.map=made.t;
      bb.mat.needsUpdate=true;
      bb.sc.set(bb.it.h*made.ratio*cs(bb.it),bb.it.h*cs(bb.it),1);
    });
  }
  if(document.fonts)document.fonts.load(FONT).then(redrawTitles);
  new MutationObserver(redrawTitles).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});

  const count=mobile?260:520;
  const seeds=Array.from({length:count},()=>{
    const T=rnd(0,1);
    sample(T);
    return {x:pos.x+rnd(-14,14),y:pos.y+rnd(-5,7),z:pos.z+rnd(-18,12),ph:rnd(0,6.28),sp:rnd(.2,.7)};
  });
  const ppos=new Float32Array(count*3);
  const pgeo=new THREE.BufferGeometry();
  pgeo.setAttribute("position",new THREE.BufferAttribute(ppos,3));
  const glow=document.createElement("canvas");
  glow.width=glow.height=64;
  const g=glow.getContext("2d"),rg=g.createRadialGradient(32,32,0,32,32,32);
  rg.addColorStop(0,"rgba(255,255,255,1)");
  rg.addColorStop(.25,"rgba(255,255,255,.6)");
  rg.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=rg;
  g.fillRect(0,0,64,64);
  const pmat=new THREE.PointsMaterial({map:new THREE.CanvasTexture(glow),color:0xe8ffb8,size:.28,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
  const points=new THREE.Points(pgeo,pmat);
  points.frustumCulled=false;
  scene.add(points);

  const bcount=mobile?8:18;
  const bseeds=Array.from({length:bcount},()=>{
    sample(rnd(0,1));
    return {x:pos.x+rnd(-7,7),y:pos.y+rnd(-3,5),z:pos.z+rnd(-14,4),ph:rnd(0,6.28),sp:rnd(.1,.3)};
  });
  const bpos=new Float32Array(bcount*3);
  const bgeo=new THREE.BufferGeometry();
  bgeo.setAttribute("position",new THREE.BufferAttribute(bpos,3));
  const bmat=new THREE.PointsMaterial({map:pmat.map,color:0xfff2c0,size:2.6,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false,opacity:.14});
  const bokeh=new THREE.Points(bgeo,bmat);
  bokeh.frustumCulled=false;
  scene.add(bokeh);

  const color=new THREE.Color(),fogBase=new THREE.Color();
  const e=new THREE.Vector3();

  function update(t,T,pointer,mood,fade=1){
    const f=baseFov*(1-.55*api.zoom);
    if(Math.abs(f-camera.fov)>.01){
      camera.fov=f;
      camera.updateProjectionMatrix();
    }
    sample(T);
    const sway=Math.sin(t*.4)*.12;
    camera.position.copy(pos);
    camera.position.x+=pointer.x*.8+sway;
    camera.position.y+=-pointer.y*.5+Math.sin(t*.55)*.08;
    camera.up.set(Math.sin(pointer.x*.05+sway*.1),1,0).normalize();
    camera.lookAt(tgt.x+pointer.x*2,tgt.y-pointer.y*1.4,tgt.z);

    const b=mood.b;
    fogBase.setRGB(.34*mood.tint[0]*b,.55*mood.tint[1]*b,.43*mood.tint[2]*b);
    scene.fog.color.copy(fogBase);
    color.setRGB(Math.min(1,mood.tint[0]*(.85+.15*b)),Math.min(1,mood.tint[1]*(.85+.15*b)),Math.min(1,mood.tint[2]*(.85+.15*b)));

    let hit=null;
    if(hoverOn){
      camera.updateMatrixWorld();
      ray.setFromCamera({x:pointer.tx*2,y:-pointer.ty*2},camera);
      const h=ray.intersectObjects(cards.filter(m=>m.visible&&m.material.opacity>.4),false)[0];
      hit=h?h.object:null;
    }
    api.hovered=hit?hit.userData.bb.it.id:null;
    for(const bb of billboards){
      const k=smooth(clamp((T-bb.at)/.03));
      const mesh=bb.mesh;
      if(k<=0){mesh.visible=false;continue}
      mesh.visible=true;
      const dist=mesh.position.distanceTo(camera.position);
      const near=bb.it.title?smooth(clamp((dist-7)/10)):smooth(clamp((dist-2)/3));
      bb.mat.opacity=k*near*bb.dim*fade*(bb.it.until?1-smooth(clamp((T-bb.it.until)/.04)):1);
      bb.hv+=((bb.mesh===hit?1:0)-bb.hv)*.14;
      bb.mat.color.copy(color).multiplyScalar(1+.3*bb.hv);
      if(bb.shadow)bb.shadow.material.opacity=bb.mat.opacity*.55;
      if(bb.mat.userData.bias)bb.mat.userData.bias.value=bb.it.title?0:clamp((dist-30)/40)*3.4;
      mesh.position.copy(bb.base);
      mesh.position.y+=(1-k)*-.6+Math.sin(t*.6+bb.ph)*.1;
      mesh.position.x+=Math.cos(t*.45+bb.ph)*.12;
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ(bb.it.title?0:bb.it.roll+Math.sin(t*.5+bb.ph)*.015);
      e.copy(bb.sc).multiplyScalar((.92+.08*k)*(1+.06*bb.hv));
      mesh.scale.copy(e);
    }
    for(let i=0;i<count;i++){
      const s=seeds[i];
      ppos[i*3]=s.x+Math.sin(t*s.sp+s.ph)*.8;
      ppos[i*3+1]=s.y+Math.sin(t*s.sp*1.3+s.ph)*.6;
      ppos[i*3+2]=s.z+Math.cos(t*s.sp+s.ph)*.8;
    }
    pgeo.attributes.position.needsUpdate=true;
    for(let i=0;i<bcount;i++){
      const s=bseeds[i];
      bpos[i*3]=s.x+Math.sin(t*s.sp+s.ph)*1.6;
      bpos[i*3+1]=s.y+Math.sin(t*s.sp*1.2+s.ph)*1.1;
      bpos[i*3+2]=s.z;
    }
    bgeo.attributes.position.needsUpdate=true;
    bmat.color.setRGB(mood.col[0],mood.col[1],mood.col[2]);
    bmat.opacity=.14*fade;
    pmat.opacity=(.5+.4*mood.fly*.6+.15*Math.sin(t*1.3))*fade;
  }

  function resize(w,h){
    camera.aspect=w/h;
    const sx=mobile?1:clamp(w/h/1.6,.55,1.1);
    billboards.forEach(bb=>{
      if(bb.it.id.startsWith("hero-"))bb.base.x=bb.it.x*sx;
    });
    baseFov=w<h?66:50;
    camera.fov=baseFov*(1-.55*api.zoom);
    camera.setViewOffset(w,h,0,h*(w<h?.2:.1),w,h);
    camera.updateProjectionMatrix();
  }

  const api={scene,camera,update,resize,pan:()=>camera.position.x,hovered:null,zoom:0};
  return api;
}
