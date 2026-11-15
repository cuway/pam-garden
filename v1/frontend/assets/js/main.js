import * as THREE from "three";
import Lenis from "lenis";
import {createBackdrop} from "./backdrop.js";
import {createWorld,CHAPTERS} from "./world.js";
import {createWeather} from "./weather.js";
import {createIntro} from "./intro.js";
import {createAudio} from "./audio.js";

const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ease=t=>t*t*(3-2*t);
const bump=(x,c,r)=>ease(clamp(1-Math.abs(x-c)/r));
const FINALE={petals:.5,dust:.5,leaves:.35,snow:.3,sun:.6,rain:0};

function createRenderer(canvas){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return null;
  try{
    return new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
  }catch{
    return null;
  }
}

const renderer=createRenderer(document.getElementById("gl"));
if(renderer){
  start();
}else{
  document.body.classList.add("static");
}

function start(){
  document.documentElement.classList.add("gl");
  renderer.autoClear=false;
  const story=document.getElementById("story");
  const panels=[...story.querySelectorAll(".panel")];
  const dots=[...story.querySelectorAll(".dots i")];
  const tracks=[...document.querySelectorAll(".track")];
  let w=innerWidth,h=innerHeight;
  const backdrop=createBackdrop(renderer);
  const world=createWorld(w<760);
  const weather=createWeather(w<760);
  const intro=createIntro(w<760);
  const seasons=document.getElementById("seasons");
  const finalePanel=seasons.querySelector(".season");
  const audio=createAudio();
  const snd=document.querySelector(".snd");
  if(snd)snd.addEventListener("click",()=>{
    const on=audio.toggle();
    snd.setAttribute("aria-pressed",String(on));
    snd.classList.add("used");
  });

  const pointer={x:0,y:0,tx:0,ty:0};
  addEventListener("pointermove",e=>{
    pointer.tx=e.clientX/innerWidth-.5;
    pointer.ty=e.clientY/innerHeight-.5;
  });

  function resize(){
    w=innerWidth;
    h=innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio,w<760?1.5:2));
    renderer.setSize(w,h,false);
    world.resize(w,h);
    weather.resize(w,h);
    intro.resize(w*renderer.getPixelRatio(),h*renderer.getPixelRatio());
  }
  addEventListener("resize",resize);
  resize();

  const lenis=new Lenis({
    lerp:.075,
    wheelMultiplier:.8,
    syncTouch:true,
    virtualScroll:()=>Math.abs(lenis.targetScroll-lenis.animatedScroll)<innerHeight*.5
  });
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",e=>{
      const target=document.querySelector(a.getAttribute("href"));
      if(!target)return;
      e.preventDefault();
      lenis.scrollTo(target,{duration:1.8});
    });
  });

  const gate=document.querySelector(".gate");
  const hint=document.querySelector(".hint");
  const fly=document.querySelector(".fly");
  const flySt=fly.querySelector(".fly-st");
  const flyAlt=fly.querySelector("b");
  const STAGES=[[0,"Tầng mây","Cloud layer"],[.3,"Ảnh vệ tinh","Satellite view"],[.72,"Khu vườn","The garden"]];
  const FLIGHT=8000;
  let enterAt=0,landed=false,entering=false;
  document.documentElement.classList.add("intro");
  lenis.stop();
  scrollTo(0,0);
  function enter(){
    if(entering)return;
    entering=true;
    gate.classList.add("wait");
    intro.ready.then(()=>{
      enterAt=performance.now();
      gate.classList.remove("wait");
      gate.classList.add("out");
      fly.classList.add("on");
      setTimeout(()=>gate.classList.add("gone"),1800);
    });
  }
  function land(){
    if(landed)return;
    landed=true;
    fly.classList.remove("on");
    document.documentElement.classList.remove("intro");
    lenis.start();
    setTimeout(()=>hint.classList.add("on"),1400);
  }
  fly.querySelector(".fly-skip").addEventListener("click",()=>{
    enterAt=Math.min(enterAt,performance.now()-FLIGHT*.8);
  });
  gate.addEventListener("click",enter);
  gate.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" ")enter()});

  const glEl=document.getElementById("gl");
  const typed=[...document.querySelectorAll(".tw")].map(el=>({el,parts:[...el.querySelectorAll(".vi,.en")].map(sp=>{
    const full=sp.textContent;
    const a=document.createTextNode("");
    const r=document.createElement("i");
    r.className="rest";
    r.textContent=full;
    sp.textContent="";
    sp.append(a,r);
    return {full,a,r};
  })}));
  function type(o){
    const el=o.el;
    const tip=el.closest(".tip");
    const delay=(tip?[...tip.parentNode.children].indexOf(tip)*220:0)+(el.tagName==="P"?500:0);
    const len=Math.max(...o.parts.map(x=>x.full.length));
    const dur=clamp(len*34,600,3200);
    const t1=performance.now()+delay;
    el.classList.add("typing");
    (function step(now){
      const k=clamp((now-t1)/dur);
      o.parts.forEach(x=>{
        const n=Math.floor(k*x.full.length);
        x.a.nodeValue=x.full.slice(0,n);
        x.r.textContent=x.full.slice(n);
      });
      if(k<1)requestAnimationFrame(step);
      else setTimeout(()=>el.classList.remove("typing"),1800);
    })(performance.now());
  }
  const typeIo=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    typeIo.unobserve(e.target);
    type(typed.find(o=>o.el===e.target));
  }),{threshold:.6});
  typed.forEach(o=>typeIo.observe(o.el));

  let active=-1;
  let t0=0;
  const pan={x:0,y:0};
  const tag=document.querySelector(".tag");
  const NAMES={hero:["Pam's Garden","Pam's Garden"],monstera:["Monstera","Monstera"],anthurium:["Anthurium","Anthurium"],begonia:["Begonia","Begonia"],orchid:["Lan & súng","Orchid & lily"],garden:["Từ vườn","The garden"]};
  const tagPos={x:0,y:0};

  function frame(now){
    lenis.raf(now);
    if(!t0)t0=now;
    const t=(now-t0)/1000;
    const sy=scrollY;
    const T=clamp(-story.getBoundingClientRect().top/(story.offsetHeight-h))||0;
    pointer.x+=(pointer.tx-pointer.x)*.06;
    pointer.y+=(pointer.ty-pointer.y)*.06;

    pan.x=world.pan()/16;
    const sr=seasons.getBoundingClientRect();
    const S=clamp(-sr.top/(seasons.offsetHeight-h))||0;
    const fv=ease(clamp(1-sr.top/h))*ease(clamp(sr.bottom/h));
    const gv=ease(clamp(sr.bottom/h));
    const afterFinale=clamp((sy-(seasons.offsetTop+seasons.offsetHeight-h))/Math.max(1,document.documentElement.scrollHeight-h-(seasons.offsetTop+seasons.offsetHeight-h)));
    const push=ease(afterFinale);
    glEl.style.transform=`scale(${(1+.24*push).toFixed(4)}) rotate(${(-1.6*push).toFixed(3)}deg)`;
    const m=sr.top>0?T*.78:S<1||sr.bottom>h?.79+S*.16:.95+afterFinale*.05;
    const mood=backdrop.render(t,m,pointer,pan);
    renderer.clearDepth();
    const fade=ease(clamp(story.getBoundingClientRect().bottom/h));
    const fp=enterAt?clamp((performance.now()-enterAt)/FLIGHT):0;
    const ia=1-ease(clamp((fp-.78)/.16));
    world.zoom=.85*(1-ease(clamp((fp-.74)/.24)));
    if(fp>=.84)land();
    if(enterAt&&!landed){
      const lang=document.documentElement.lang==="en"?2:1;
      let st=STAGES[0];
      STAGES.forEach(x=>{if(fp>=x[0])st=x});
      if(flySt.textContent!==st[lang])flySt.textContent=st[lang];
      flyAlt.textContent=Math.round(12000*Math.pow(1-clamp(fp/.9),2.4)).toLocaleString("en-US").replace(/,/g," ");
      fly.style.setProperty("--ret",(Math.sin(clamp((fp-.3)/.45)*Math.PI)).toFixed(3));
    }
    if(sy>60)hint.classList.remove("on");
    world.update(t,T,pointer,mood,fade);
    const st={petals:Math.max(bump(T,.2,.17),.55*clamp(1-T/.25)),sun:bump(T,.4,.17),dust:bump(T,.4,.17)*.9,rain:bump(T,.59,.16),leaves:bump(T,.76,.16),snow:bump(T,.92,.16)};
    const wx={};
    Object.keys(st).forEach(k=>{wx[k]=Math.max(st[k]*(1-fv*.6),FINALE[k]*fv)});
    audio.setMix({rain:wx.rain*gv,wind:(.25+.4*wx.leaves+.3*wx.snow+.2*wx.rain)*gv,chimes:(.6-.5*wx.rain+.3*wx.sun)*gv,warm:clamp(.6+.4*wx.sun-.4*wx.rain-.3*wx.snow),gain:gv});
    if(tag){
      const [group,no]=(world.hovered||"").split("-");
      const name=NAMES[group];
      const show=name&&/^\d+$/.test(no);
      if(show)tag.textContent=`Nº ${no.padStart(2,"0")} · ${name[document.documentElement.lang==="en"?1:0]}`;
      tag.classList.toggle("on",!!show);
      tagPos.x+=((pointer.tx+.5)*w+16-tagPos.x)*.2;
      tagPos.y+=((pointer.ty+.5)*h+16-tagPos.y)*.2;
      tag.style.transform=`translate3d(${tagPos.x.toFixed(1)}px,${tagPos.y.toFixed(1)}px,0)`;
    }
    if(ia<.995){
      renderer.render(world.scene,world.camera);
      if(weather.update(t,wx,gv))renderer.render(weather.scene,weather.camera);
    }
    if(intro.update(t,fp,ia))renderer.render(intro.scene,intro.camera);
    if(finalePanel){
      finalePanel.style.setProperty("--o",(fv*ease(clamp(S/.15))).toFixed(3));
      finalePanel.style.setProperty("--y","0px");
      finalePanel.style.setProperty("--x","0px");
    }

    let current=0;
    panels.forEach((p,i)=>{
      const c=CHAPTERS[i];
      const span=c.b-c.a;
      const k=clamp((T-c.a)/span);
      const lo=i?c.a+.016:c.a;
      const o=ease(clamp((T-lo)/.012))*(i===panels.length-1?1:1-ease(clamp((T-(c.b-.034))/.012)));
      const first=i===0;
      p.style.setProperty("--o",(first?clamp(1-T/(c.b*.9)):o).toFixed(3));
      p.style.setProperty("--y","0px");
      p.classList.toggle("on",(first?T<c.b:o>.3));
      const beats=p.querySelectorAll(".beat");
      beats.forEach((b,j)=>{
        const lo=j/beats.length,hi=(j+1)/beats.length;
        const v=(j?ease(clamp((k-lo)/.04)):1)*(j<beats.length-1?1-ease(clamp((k-hi+.04)/.04)):1);
        b.style.opacity=(beats.length>1?v:1).toFixed(3);
      });
      if(T>=c.a)current=i;
    });
    if(current!==active){
      active=current;
      dots.forEach((d,i)=>d.classList.toggle("on",i===current));
      audio.chime();
    }

    tracks.forEach((tr,i)=>{
      const x=(sy*.02+t*1.2)%50;
      tr.style.transform=`translate3d(${i%2?x-50:-x}%,0,0)`;
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
