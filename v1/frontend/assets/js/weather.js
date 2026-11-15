import * as THREE from "three";

const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const HALF=Math.tan(Math.PI/6);

function canvasTex(w,h,draw){
  const c=document.createElement("canvas");
  c.width=w;
  c.height=h;
  draw(c.getContext("2d"),w,h);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  return t;
}

const softTex=()=>canvasTex(64,64,g=>{
  const r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,"rgba(255,255,255,1)");
  r.addColorStop(.35,"rgba(255,255,255,.85)");
  r.addColorStop(.62,"rgba(255,255,255,.3)");
  r.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=r;
  g.fillRect(0,0,64,64);
});

const petalTex=()=>canvasTex(128,128,g=>{
  g.beginPath();
  g.moveTo(64,122);
  g.bezierCurveTo(18,102,12,42,44,16);
  g.quadraticCurveTo(54,8,64,28);
  g.quadraticCurveTo(74,8,84,16);
  g.bezierCurveTo(116,42,110,102,64,122);
  const gr=g.createLinearGradient(0,122,0,10);
  gr.addColorStop(0,"#fff8fa");
  gr.addColorStop(.5,"#ffd6e2");
  gr.addColorStop(1,"#f6a6bd");
  g.fillStyle=gr;
  g.fill();
  g.strokeStyle="rgba(255,255,255,.55)";
  g.lineWidth=3;
  g.stroke();
  g.strokeStyle="rgba(200,105,140,.28)";
  g.lineWidth=2;
  g.beginPath();
  g.moveTo(64,114);
  g.lineTo(64,36);
  g.stroke();
});

const leafTex=()=>canvasTex(128,128,g=>{
  g.beginPath();
  g.moveTo(64,124);
  g.bezierCurveTo(8,96,4,40,64,4);
  g.bezierCurveTo(124,40,120,96,64,124);
  const gr=g.createLinearGradient(0,124,0,4);
  gr.addColorStop(0,"#b9b9b9");
  gr.addColorStop(1,"#f6f6f6");
  g.fillStyle=gr;
  g.fill();
  g.strokeStyle="#8a8a8a";
  g.lineWidth=3;
  g.stroke();
  g.strokeStyle="#6e6e6e";
  g.lineWidth=3;
  g.beginPath();
  g.moveTo(64,126);
  g.lineTo(64,12);
  g.stroke();
  g.lineWidth=2;
  for(let i=0;i<6;i++){
    const y=106-i*16;
    g.beginPath();
    g.moveTo(64,y);
    g.lineTo(64-34+i*3,y-20);
    g.moveTo(64,y);
    g.lineTo(64+34-i*3,y-20);
    g.stroke();
  }
});

const flakeTex=()=>canvasTex(64,64,g=>{
  const r=g.createRadialGradient(32,32,0,32,32,30);
  r.addColorStop(0,"rgba(255,255,255,1)");
  r.addColorStop(.4,"rgba(255,255,255,.8)");
  r.addColorStop(.7,"rgba(255,255,255,.2)");
  r.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=r;
  g.fillRect(0,0,64,64);
});

const crystalTex=()=>canvasTex(128,128,g=>{
  g.translate(64,64);
  g.strokeStyle="rgba(255,255,255,.95)";
  g.lineCap="round";
  for(let i=0;i<6;i++){
    g.save();
    g.rotate(i*Math.PI/3);
    g.lineWidth=4;
    g.beginPath();
    g.moveTo(0,0);
    g.lineTo(0,-52);
    g.stroke();
    g.lineWidth=2.5;
    [-24,-38].forEach((y,j)=>{
      const l=16-j*5;
      g.beginPath();
      g.moveTo(0,y);
      g.lineTo(-l,y-l);
      g.moveTo(0,y);
      g.lineTo(l,y-l);
      g.stroke();
    });
    g.restore();
  }
  const r=g.createRadialGradient(0,0,0,0,0,16);
  r.addColorStop(0,"rgba(255,255,255,.9)");
  r.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle=r;
  g.fillRect(-16,-16,32,32);
});

const streakTex=()=>{
  const w=16,h=128;
  const c=document.createElement("canvas");
  c.width=w;
  c.height=h;
  const g=c.getContext("2d");
  const img=g.createImageData(w,h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const gx=Math.exp(-(((x-7.5)/2.4)**2));
      const a=gx*Math.pow(y/(h-1),1.7);
      const i=(y*w+x)*4;
      img.data[i]=img.data[i+1]=img.data[i+2]=255;
      img.data[i+3]=Math.round(a*255);
    }
  }
  g.putImageData(img,0,0);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  return t;
};

const ringTex=()=>canvasTex(128,128,g=>{
  g.strokeStyle="rgba(255,255,255,.95)";
  g.shadowColor="rgba(255,255,255,.8)";
  g.shadowBlur=6;
  g.lineWidth=4;
  g.beginPath();
  g.arc(64,64,46,0,Math.PI*2);
  g.stroke();
  g.lineWidth=2;
  g.globalAlpha=.5;
  g.beginPath();
  g.arc(64,64,30,0,Math.PI*2);
  g.stroke();
});

const hexTex=()=>canvasTex(128,128,g=>{
  g.beginPath();
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3+Math.PI/6;
    g.lineTo(64+Math.cos(a)*54,64+Math.sin(a)*54);
  }
  g.closePath();
  g.fillStyle="rgba(255,255,255,.14)";
  g.fill();
  g.strokeStyle="rgba(255,255,255,.55)";
  g.lineWidth=4;
  g.stroke();
});

const dummy=new THREE.Object3D();
const tint=new THREE.Color();

function swarm(count,o){
  const seeds=Array.from({length:count},()=>({
    x:rnd(-1,1),o:rnd(0,2.5),z:rnd(o.z[0],o.z[1]),sp:rnd(o.speed[0],o.speed[1]),ph:rnd(0,6.28),sw:rnd(.4,1.1),
    size:rnd(o.size[0],o.size[1]),rx:rnd(.6,2.4)*(Math.random()<.5?-1:1),ry:rnd(.6,2.2)*(Math.random()<.5?-1:1),rz:rnd(-1,1)*o.spin
  }));
  const mat=new THREE.MeshBasicMaterial({map:o.tex,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:0,blending:o.additive?THREE.AdditiveBlending:THREE.NormalBlending});
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),mat,count);
  seeds.forEach((s,i)=>{
    tint.set(o.colors[Math.floor(Math.random()*o.colors.length)]);
    mesh.setColorAt(i,tint);
  });
  mesh.frustumCulled=false;
  mesh.visible=false;
  return {mesh,mat,seeds,o};
}

function stepSwarm(f,t,aspect){
  const {seeds,o,mesh}=f;
  for(let i=0;i<seeds.length;i++){
    const s=seeds[i];
    const phase=(t*s.sp+s.o)%2.5;
    const yn=o.rise?-1.25+phase:1.25-phase;
    const k=-s.z*HALF;
    const xn=s.x+Math.sin(t*s.sw+s.ph)*o.sway+yn*o.slant;
    dummy.position.set(xn*aspect*k*1.1,yn*k,s.z);
    if(o.tumble)dummy.rotation.set(t*s.rx*.6+s.ph,t*s.ry*.6+s.ph*.7,t*s.rz+s.ph);
    else dummy.rotation.set(0,0,t*s.rz+s.ph);
    dummy.scale.set(s.size*(o.ratio||1),s.size,1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
}

export function createWeather(mobile){
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(60,1,.1,60);
  const n=mobile?.55:1;
  let aspect=1;

  const swarms={
    petals:swarm(Math.round(90*n),{tex:petalTex(),size:[.34,.62],z:[-18,-5],speed:[.1,.19],sway:.14,slant:.06,spin:1.4,tumble:true,colors:["#ffffff","#fff1f5","#ffe3ec"]}),
    leaves:swarm(Math.round(70*n),{tex:leafTex(),size:[.5,.95],z:[-18,-5],speed:[.09,.17],sway:.26,slant:.14,spin:1.1,tumble:true,colors:["#d9722b","#e0a030","#b8431f","#c98b2c","#9c5a1e","#e8b04a"]}),
    snow:swarm(Math.round(300*n),{tex:flakeTex(),size:[.07,.2],z:[-22,-3],speed:[.06,.13],sway:.07,slant:.03,spin:0,colors:["#ffffff","#eaf3ff"]}),
    crystals:swarm(Math.round(28*n),{tex:crystalTex(),size:[.3,.55],z:[-12,-4],speed:[.05,.09],sway:.1,slant:.03,spin:.5,colors:["#ffffff","#dcebff"]}),
    dust:swarm(Math.round(90*n),{tex:softTex(),size:[.05,.11],z:[-20,-4],speed:[.03,.08],sway:.1,slant:0,spin:0,rise:true,additive:true,colors:["#ffe7a0","#fff3c4"]})
  };
  Object.values(swarms).forEach(f=>scene.add(f.mesh));

  const rainCount=Math.round(380*n);
  const rainSeeds=Array.from({length:rainCount},()=>({x:rnd(-1,1),o:rnd(0,2.5),z:rnd(-20,-3),sp:rnd(1.2,1.8),len:rnd(.12,.24),a:rnd(.4,1)}));
  const rainMat=new THREE.MeshBasicMaterial({map:streakTex(),transparent:true,depthWrite:false,opacity:0,blending:THREE.AdditiveBlending,color:0xd2e4f4});
  const rain=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),rainMat,rainCount);
  rainSeeds.forEach((s,i)=>{
    tint.setScalar(s.a);
    rain.setColorAt(i,tint);
  });
  rain.frustumCulled=false;
  rain.visible=false;
  scene.add(rain);

  const rippleCount=Math.round(36*n);
  const rippleSeeds=Array.from({length:rippleCount},()=>({x:rnd(-1,1),yn:rnd(-.95,-.55),z:rnd(-14,-4),o:rnd(0,1),sp:rnd(.5,.9),size:rnd(.5,1.1)}));
  const rippleMat=new THREE.MeshBasicMaterial({map:ringTex(),transparent:true,depthWrite:false,opacity:0,blending:THREE.AdditiveBlending,color:0xbfd8ee});
  const ripples=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),rippleMat,rippleCount);
  ripples.setColorAt(0,tint.setScalar(0));
  ripples.frustumCulled=false;
  ripples.visible=false;
  scene.add(ripples);

  const sunPos=new THREE.Vector3(10,7,-28);
  const glow=new THREE.SpriteMaterial({map:softTex(),color:0xffe9a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const sun=new THREE.Sprite(glow);
  sun.position.copy(sunPos);
  sun.scale.set(30,30,1);
  sun.visible=false;
  scene.add(sun);
  const ghostSpecs=[[hexTex(),-.3,4,0xffe0a0,.9],[ringTex(),-.62,6.5,0xa8dcff,.6],[hexTex(),.5,2.6,0xffc890,.8],[softTex(),-1.05,8,0xfff0c8,.5],[softTex(),0,1,0xfff6d8,.7]];
  const ghosts=ghostSpecs.map(([map,f,size,color,k],i)=>{
    const m=new THREE.SpriteMaterial({map,color,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    const sp=new THREE.Sprite(m);
    sp.position.set(sunPos.x*(f||1),sunPos.y*(f||1),-28);
    if(i===4)sp.scale.set(70,1.6,1);
    else sp.scale.set(size,size,1);
    sp.visible=false;
    scene.add(sp);
    return {sp,m,k};
  });

  function update(t,w,vis){
    let active=false;
    Object.keys(swarms).forEach(key=>{
      const f=swarms[key];
      const wk=key==="crystals"?w.snow*.6:w[key==="dust"?"dust":key];
      const op=clamp(wk)*vis*(key==="dust"?.55:key==="snow"?.9:.97);
      f.mat.opacity=op;
      f.mesh.visible=op>.01;
      if(f.mesh.visible){
        stepSwarm(f,t,aspect);
        active=true;
      }
    });
    const rop=w.rain*vis*.5;
    rainMat.opacity=rop;
    rain.visible=rop>.01;
    if(rain.visible){
      for(let i=0;i<rainCount;i++){
        const s=rainSeeds[i];
        const yn=1.25-((t*s.sp+s.o)%2.5);
        const k=-s.z*HALF;
        dummy.position.set((s.x+yn*.05)*aspect*k*1.1,yn*k,s.z);
        dummy.rotation.set(0,0,.1);
        dummy.scale.set(.012*k,s.len*k,1);
        dummy.updateMatrix();
        rain.setMatrixAt(i,dummy.matrix);
      }
      rain.instanceMatrix.needsUpdate=true;
      active=true;
    }
    const pop=w.rain*vis*.55;
    rippleMat.opacity=pop;
    ripples.visible=pop>.01;
    if(ripples.visible){
      for(let i=0;i<rippleCount;i++){
        const s=rippleSeeds[i];
        const p=(t*s.sp+s.o)%1;
        const k=-s.z*HALF;
        dummy.position.set(s.x*aspect*k*1.1,s.yn*k,s.z);
        dummy.rotation.set(0,0,0);
        const r=(.2+p*1.2)*s.size;
        dummy.scale.set(r,r*.26,1);
        dummy.updateMatrix();
        ripples.setMatrixAt(i,dummy.matrix);
        ripples.setColorAt(i,tint.setScalar(Math.pow(1-p,1.6)));
      }
      ripples.instanceMatrix.needsUpdate=true;
      ripples.instanceColor.needsUpdate=true;
      active=true;
    }
    const sop=w.sun*vis*.7*(.92+.08*Math.sin(t*1.4));
    glow.opacity=sop;
    sun.visible=sop>.01;
    ghosts.forEach(g=>{
      g.m.opacity=w.sun*vis*.2*g.k;
      g.sp.visible=g.m.opacity>.005;
    });
    if(sun.visible)active=true;
    return active;
  }

  function resize(wd,ht){
    aspect=wd/ht;
    camera.aspect=aspect;
    camera.updateProjectionMatrix();
  }

  return {scene,camera,update,resize};
}
