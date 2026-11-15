import Lenis from "lenis";

const root=document.documentElement;
const reduced=root.classList.contains("rm");
const narrow=matchMedia("(max-width: 899px)").matches;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const minutes=s=>{const [h,m]=s.split(":");return +h*60+ +m};

function splitWords(el,cls){
  let n=0;
  (function walk(node){
    [...node.childNodes].forEach(c=>{
      if(c.nodeType===3){
        const frag=document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t=>{
          if(!t)return;
          if(/^\s+$/.test(t)){frag.append(t);return}
          const w=document.createElement("span");
          w.className="w";
          if(cls==="reveal"){
            const i=document.createElement("i");
            i.style.setProperty("--i",n++);
            i.textContent=t;
            w.append(i);
          }else{
            w.textContent=t;
            w.dataset.k=n++;
          }
          frag.append(w);
        });
        c.replaceWith(frag);
      }else if(c.nodeType===1&&c.childNodes.length)walk(c);
    });
  })(el);
}

document.querySelectorAll(".split").forEach(el=>splitWords(el,"reveal"));
const wordBlocks=[...document.querySelectorAll(".words")].map(el=>{
  splitWords(el);
  return {el,spans:[...el.querySelectorAll(".w")]};
});

const io=new IntersectionObserver(es=>es.forEach(e=>{
  const t=e.target;
  if(e.isIntersecting){
    t.classList.remove("above");
    t.classList.add("in");
  }else{
    t.classList.remove("in");
    t.classList.toggle("above",e.boundingClientRect.top<0);
  }
}),{threshold:.18,rootMargin:"0px 0px -6% 0px"});
const observable=[...document.querySelectorAll(".split,.rv,.shot,.pin")];
observable.filter(el=>!el.closest(".cover")).forEach(el=>io.observe(el));

if(!reduced&&matchMedia("(min-width:900px) and (pointer:fine)").matches){
  import("./gl.js").then(m=>{
    m.startGL();
    root.classList.add("gl");
  }).catch(()=>{});
}

const flies=document.querySelector(".flies");
if(flies&&!reduced){
  for(let i=0;i<(narrow?8:18);i++){
    const f=document.createElement("i");
    f.style.cssText=`left:${(Math.random()*100).toFixed(1)}%;top:${(20+Math.random()*75).toFixed(1)}%;--t:${(4+Math.random()*6).toFixed(1)}s;--dx:${(Math.random()*120-60).toFixed(0)}px;--dy:${(Math.random()*-110).toFixed(0)}px;animation-delay:-${(Math.random()*8).toFixed(1)}s`;
    flies.append(f);
  }
}

const anchors=[...document.querySelectorAll("[data-time]")];
const clockB=document.querySelector(".clock b");
const clockS=document.querySelector(".clock span");
const sun=document.querySelector(".sun");
const bar=document.querySelector(".bar");
const cover=document.querySelector(".cover");
const collage=document.querySelector(".collage");
const shots=[...document.querySelectorAll(".shot")];
const SUN=[[345,[255,214,170,.4]],[600,[232,244,196,.42]],[840,[246,250,226,.38]],[1050,[255,236,170,.4]],[1170,[255,172,112,.32]],[1230,[110,150,190,.26]],[1290,[90,130,170,.2]]];

function sunColor(m){
  for(let i=1;i<SUN.length;i++){
    if(m<=SUN[i][0]||i===SUN.length-1){
      const [m0,c0]=SUN[i-1],[m1,c1]=SUN[i];
      const t=clamp((m-m0)/(m1-m0));
      return `rgba(${c0.slice(0,3).map((v,k)=>Math.round(lerp(v,c1[k],t))).join(",")},${lerp(c0[3],c1[3],t).toFixed(2)})`;
    }
  }
}

const walk=document.querySelector(".pg.walk");
const walkLine=document.createElement("i");
walkLine.className="walk-line";
walkLine.setAttribute("aria-hidden","true");
if(walk)walk.querySelector(".pg-in").append(walkLine);
let walkD=0;
const marquee=[...document.querySelectorAll(".marquee p")];
marquee.forEach(p=>{p.innerHTML=p.innerHTML.repeat(4)});
let cycles=[],pts=[];

function measure(){
  if(walk){
    walk.style.setProperty("--wx","0px");
    if(innerWidth<900){
      walk.style.removeProperty("--walk-h");
      walkD=0;
    }else{
      const inner=walk.querySelector(".pg-in");
      walkD=Math.max(0,inner.scrollWidth-inner.clientWidth);
      walk.style.setProperty("--walk-h",`${walkD+innerHeight}px`);
    }
  }
  cycles=marquee.map(p=>p.scrollWidth/4);
  pts=anchors.map(el=>({m:minutes(el.dataset.time),c:el.offsetTop+el.offsetHeight*.5,el}));
}
addEventListener("resize",measure);
addEventListener("load",measure);
if(document.fonts)document.fonts.ready.then(measure);
measure();

const firstShots=document.querySelector("#monstera .shots");
if(firstShots){
  const hint=document.createElement("p");
  hint.className="swipe";
  hint.innerHTML='<span class="vi">Vuốt ngang để xem ảnh</span><span class="en">Swipe sideways for photos</span><i></i>';
  firstShots.before(hint);
  firstShots.addEventListener("scroll",()=>hint.classList.add("done"),{once:true,passive:true});
}

const pointer={x:0,y:0,tx:0,ty:0};
let dirty=60;
const mark=()=>{dirty=45};
addEventListener("scroll",mark,{passive:true,capture:true});
addEventListener("resize",mark);
addEventListener("click",mark);
if(!reduced)addEventListener("pointermove",e=>{
  pointer.tx=e.clientX/innerWidth-.5;
  pointer.ty=e.clientY/innerHeight-.5;
  mark();
});

const motionBtn=document.querySelector(".motion button");
if(motionBtn)motionBtn.addEventListener("click",()=>{
  try{localStorage.setItem("motion",reduced?"on":"off")}catch(e){}
  location.reload();
});

let lenis=null;
if(!reduced){
  lenis=new Lenis({lerp:.09});
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",e=>{
      const t=document.querySelector(a.getAttribute("href"));
      if(!t)return;
      e.preventDefault();
      lenis.scrollTo(t,{duration:1.8});
    });
  });
}

const gate=document.querySelector(".gate");
let opened=false;
if("scrollRestoration" in history)history.scrollRestoration="manual";
scrollTo(0,0);
root.classList.add("gated");
if(lenis)lenis.stop();
function openGate(){
  if(opened)return;
  opened=true;
  gate.classList.add("open");
  setTimeout(()=>{
    root.classList.remove("gated");
    if(lenis)lenis.start();
    observable.filter(el=>el.closest(".cover")).forEach(el=>io.observe(el));
  },reduced?250:650);
  setTimeout(()=>gate.classList.add("gone"),reduced?800:1700);
}
gate.addEventListener("click",openGate);
gate.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key===" "){
    e.preventDefault();
    openGate();
  }
});
gate.focus({preventScroll:true});

const view=document.querySelector(".view");
const viewImg=new Image(),viewCap=view.querySelector("p");
view.prepend(viewImg);
document.querySelectorAll(".shot,.pin").forEach(fig=>{
  const img=fig.querySelector("img");
  fig.tabIndex=0;
  fig.setAttribute("role","button");
  fig.setAttribute("aria-label",img.alt);
  const open=()=>{
    viewImg.src=img.src.replace("-640.","-1080.");
    viewImg.alt=img.alt;
    viewCap.textContent=img.alt.split(" / ")[root.lang==="en"?1:0];
    view.showModal();
    if(lenis)lenis.stop();
  };
  fig.addEventListener("click",open);
  fig.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}});
});
view.addEventListener("click",()=>view.close());
view.addEventListener("close",()=>{if(lenis)lenis.start()});

let lastLabel="",lastY=scrollY,down=true,tick=0;
function frame(now){
  if(lenis)lenis.raf(now);
  requestAnimationFrame(frame);
  if(dirty<=0)return;
  dirty--;
  tick++;
  const vh=innerHeight,y=scrollY+vh*.5;

  let m=pts[0].m,cur=pts[0];
  if(y>=pts[pts.length-1].c){m=pts[pts.length-1].m;cur=pts[pts.length-1]}
  else if(y>pts[0].c){
    for(let i=1;i<pts.length;i++){
      if(y<=pts[i].c){
        const t=clamp((y-pts[i-1].c)/(pts[i].c-pts[i-1].c));
        m=lerp(pts[i-1].m,pts[i].m,t);
        cur=t<.5?pts[i-1]:pts[i];
        break;
      }
    }
  }
  const hh=Math.floor(m/60),mm=Math.floor(m%60);
  clockB.textContent=`${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  const label=root.lang==="en"?cur.el.dataset.en:cur.el.dataset.vi;
  if(label!==lastLabel){clockS.textContent=label;lastLabel=label}
  root.classList.toggle("night",m>=1110);

  if(!narrow||tick%4===0){
    const day=clamp((m-345)/(1290-345));
    sun.style.setProperty("--sx",`${(lerp(8,92,day)).toFixed(1)}%`);
    sun.style.setProperty("--sy",`${(78-Math.sin(day*Math.PI)*66).toFixed(1)}%`);
    sun.style.setProperty("--sun",sunColor(m));
  }

  wordBlocks.forEach(({el,spans})=>{
    const r=el.getBoundingClientRect();
    if(r.bottom<-vh*.3||r.top>vh*1.3)return;
    const p=clamp((vh*.85-r.top)/(r.height+vh*.45));
    spans.forEach(s=>{
      s.style.opacity=lerp(.14,1,clamp(p*(spans.length+6)-s.dataset.k,0,1)).toFixed(2);
    });
  });
  if(reduced)return;
  const dy=scrollY-lastY;
  lastY=scrollY;
  if(Math.abs(dy)>2)down=dy>0;
  bar.classList.toggle("hide",down&&scrollY>240);

  pointer.x+=(pointer.tx-pointer.x)*.07;
  pointer.y+=(pointer.ty-pointer.y)*.07;
  cover.style.setProperty("--mx",pointer.x.toFixed(3));
  cover.style.setProperty("--my",pointer.y.toFixed(3));
  collage.style.setProperty("--cp",clamp(scrollY/vh).toFixed(3));

  if(walk&&walkD){
    const r=walk.getBoundingClientRect();
    const p=clamp(-r.top/(r.height-vh));
    walk.style.setProperty("--wx",`${(-p*walkD).toFixed(1)}px`);
    walkLine.style.transform=`scaleX(${p.toFixed(3)})`;
  }
  marquee.forEach((p,i)=>{
    const cw=cycles[i];
    if(!cw)return;
    const o=(scrollY*.28)%cw;
    p.style.transform=`translate3d(${(i?o-cw:-o).toFixed(1)}px,0,0)`;
  });

  const wide=innerWidth>=900;
  shots.forEach(s=>{
    const r=s.getBoundingClientRect();
    if(r.bottom<-100||r.top>vh+100||r.right<-80||r.left>innerWidth+80)return;
    if(wide)s.style.setProperty("--p",((r.top+r.height/2-vh/2)/vh).toFixed(3));
    else{
      const d=clamp((r.left+r.width/2-innerWidth/2)/innerWidth,-1,1);
      s.style.setProperty("--ry",`${(d*38).toFixed(1)}deg`);
      s.style.setProperty("--sc",(1-Math.abs(d)*.1).toFixed(3));
    }
  });
}
requestAnimationFrame(frame);
