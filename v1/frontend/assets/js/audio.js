const BOWLS=[293.66,329.63,392,440];
const BELL=[[1,.5,11],[2,.34,8],[2.4,.24,6],[3,.18,5],[4.1,.1,3.5],[5.4,.06,2.4]];
const LINES={
  vi:"Mỗi chiếc lá là một tác phẩm. Mang hơi thở rừng xanh vào từng góc nhỏ nhà bạn.",
  en:"Every leaf is a work of art. Bringing the breath of the green forest into every corner of your home."
};

export function createAudio(){
  let ctx=null;
  let on=false;
  let nodes=null;
  let timers=[];
  let lastBowl=0;
  let mix={rain:0,wind:.3,warm:.6,gain:1};
  let lastApply=0;
  let beat=0;

  function noiseBuffer(c){
    const buf=c.createBuffer(1,c.sampleRate*3,c.sampleRate);
    const d=buf.getChannelData(0);
    let last=0;
    for(let i=0;i<d.length;i++){
      last=(last+(Math.random()*2-1)*.06)/1.02;
      d[i]=(Math.random()*2-1)*.5+last*3;
    }
    return buf;
  }

  function reverb(c){
    const len=c.sampleRate*5.5;
    const buf=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){
      const d=buf.getChannelData(ch);
      for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);
    }
    const conv=c.createConvolver();
    conv.buffer=buf;
    return conv;
  }

  function build(){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    const master=ctx.createGain();
    master.gain.value=0;
    master.connect(ctx.destination);

    const wet=ctx.createGain();
    wet.gain.value=.7;
    const conv=reverb(ctx);
    wet.connect(conv);
    conv.connect(master);

    const droneFilter=ctx.createBiquadFilter();
    droneFilter.type="lowpass";
    droneFilter.frequency.value=520;
    const droneGain=ctx.createGain();
    droneGain.gain.value=.14;
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    droneGain.connect(wet);
    [[73.42,"sine",1],[110,"sine",.55],[146.83,"triangle",.3],[220,"sine",.14]].forEach(([f,type,v])=>{
      [0,.9].forEach(d=>{
        const o=ctx.createOscillator();
        const g=ctx.createGain();
        o.type=type;
        o.frequency.value=f+d;
        g.gain.value=v*.5;
        o.connect(g);
        g.connect(droneFilter);
        o.start();
      });
    });
    const swell=ctx.createOscillator();
    swell.frequency.value=.045;
    const swellGain=ctx.createGain();
    swellGain.gain.value=.05;
    swell.connect(swellGain);
    swellGain.connect(droneGain.gain);
    swell.start();

    const noise=noiseBuffer(ctx);
    const windSrc=ctx.createBufferSource();
    windSrc.buffer=noise;
    windSrc.loop=true;
    const windBand=ctx.createBiquadFilter();
    windBand.type="bandpass";
    windBand.frequency.value=420;
    windBand.Q.value=.7;
    const windGain=ctx.createGain();
    windGain.gain.value=0;
    windSrc.connect(windBand);
    windBand.connect(windGain);
    windGain.connect(master);
    windSrc.start();
    const windLfo=ctx.createOscillator();
    windLfo.frequency.value=.08;
    const windLfoGain=ctx.createGain();
    windLfoGain.gain.value=130;
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windBand.frequency);
    windLfo.start();

    const rainSrc=ctx.createBufferSource();
    rainSrc.buffer=noise;
    rainSrc.loop=true;
    const rainHigh=ctx.createBiquadFilter();
    rainHigh.type="highpass";
    rainHigh.frequency.value=1400;
    const rainLow=ctx.createBiquadFilter();
    rainLow.type="lowpass";
    rainLow.frequency.value=7000;
    const rainGain=ctx.createGain();
    rainGain.gain.value=0;
    rainSrc.connect(rainHigh);
    rainHigh.connect(rainLow);
    rainLow.connect(rainGain);
    rainGain.connect(master);
    rainGain.connect(wet);
    rainSrc.start(0,1.3);

    nodes={master,wet,droneFilter,windGain,rainGain};
  }

  function strike(f,partials,peak,pan){
    const now=ctx.currentTime;
    partials.forEach(([ratio,amp,decay])=>{
      const g=ctx.createGain();
      g.gain.setValueAtTime(0,now);
      g.gain.linearRampToValueAtTime(peak*amp,now+.01);
      g.gain.exponentialRampToValueAtTime(.0001,now+decay);
      const o=ctx.createOscillator();
      o.type="sine";
      o.frequency.value=f*ratio+(pan||0)*ratio;
      o.connect(g);
      g.connect(nodes.master);
      g.connect(nodes.wet);
      o.start(now);
      o.stop(now+decay+.2);
    });
  }

  function bowl(){
    if(!ctx||!on)return;
    const f=BOWLS[Math.floor(Math.random()*BOWLS.length)];
    strike(f,[[1,1,9],[1.004,.8,9],[2.71,.28,6],[5.4,.1,3]],.15,0);
  }

  function bell(){
    if(!ctx||!on)return;
    strike(98,BELL,.26,0);
  }

  function wood(){
    if(!ctx||!on)return;
    const now=ctx.currentTime;
    const o=ctx.createOscillator();
    const g=ctx.createGain();
    o.type="sine";
    o.frequency.setValueAtTime(980,now);
    o.frequency.exponentialRampToValueAtTime(560,now+.07);
    g.gain.setValueAtTime(0,now);
    g.gain.linearRampToValueAtTime(.12,now+.004);
    g.gain.exponentialRampToValueAtTime(.0001,now+.16);
    o.connect(g);
    g.connect(nodes.master);
    g.connect(nodes.wet);
    o.start(now);
    o.stop(now+.2);
  }

  function woodLoop(){
    const gap=beat%5===4?1900:1050;
    if(beat%5!==4)wood();
    beat++;
    timers.push(setTimeout(woodLoop,gap));
  }

  function loop(fn,min,max){
    timers.push(setTimeout(()=>{
      fn();
      loop(fn,min,max);
    },min+Math.random()*(max-min)));
  }

  let voice=null;
  function pickVoice(code){
    const list=window.speechSynthesis?speechSynthesis.getVoices():[];
    return list.find(v=>v.lang.toLowerCase().startsWith(code))||null;
  }
  function speak(){
    if(!on||!window.speechSynthesis)return;
    const code=document.documentElement.lang==="en"?"en":"vi";
    voice=pickVoice(code);
    if(!voice)return;
    const u=new SpeechSynthesisUtterance(LINES[code]);
    u.voice=voice;
    u.lang=voice.lang;
    u.rate=.62;
    u.pitch=.6;
    u.volume=.7;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function apply(){
    if(!nodes)return;
    const now=ctx.currentTime;
    nodes.rainGain.gain.setTargetAtTime(mix.rain*.2,now,.8);
    nodes.windGain.gain.setTargetAtTime(mix.wind*.09,now,1.2);
    nodes.droneFilter.frequency.setTargetAtTime(380+mix.warm*360,now,1.5);
    if(on)nodes.master.gain.setTargetAtTime(.55*Math.max(.15,mix.gain),now,.6);
  }

  function toggle(){
    if(!ctx)build();
    on=!on;
    if(on){
      ctx.resume();
      nodes.master.gain.setTargetAtTime(.55,ctx.currentTime,1.8);
      timers.push(setTimeout(bell,1200));
      timers.push(setTimeout(speak,4200));
      timers.push(setTimeout(woodLoop,3000));
      loop(bowl,12000,22000);
      loop(bell,38000,56000);
      loop(speak,70000,95000);
    }else{
      nodes.master.gain.setTargetAtTime(0,ctx.currentTime,.5);
      timers.forEach(t=>clearTimeout(t));
      timers=[];
      if(window.speechSynthesis)speechSynthesis.cancel();
      setTimeout(()=>{if(!on)ctx.suspend()},1800);
    }
    return on;
  }

  if(window.speechSynthesis)speechSynthesis.getVoices();

  document.addEventListener("visibilitychange",()=>{
    if(!ctx||!on)return;
    if(document.hidden){
      ctx.suspend();
      if(window.speechSynthesis)speechSynthesis.cancel();
    }else ctx.resume();
  });

  return {
    toggle,
    chime(){
      const now=performance.now();
      if(on&&now-lastBowl>4000){
        lastBowl=now;
        bowl();
      }
    },
    setMix(m){
      mix=m;
      const now=performance.now();
      if(on&&now-lastApply>150){
        lastApply=now;
        apply();
      }
    }
  };
}
