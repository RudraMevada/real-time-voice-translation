document.addEventListener("DOMContentLoaded",()=>{

/* ==================================================
   THEME SYSTEM
================================================== */

const btn = document.getElementById("themeToggle");

if(btn){
  if(localStorage.getItem("theme")==="light"){
    document.body.classList.add("light");
    btn.textContent="☀️";
  }else{
    btn.textContent="🌙";
  }

  btn.addEventListener("click",()=>{
    document.body.classList.add("theme-transition");

    document.body.classList.toggle("light");

    if(document.body.classList.contains("light")){
      localStorage.setItem("theme","light");
      btn.textContent="☀️";
    }else{
      localStorage.setItem("theme","dark");
      btn.textContent="🌙";
    }

    setTimeout(()=>{
      document.body.classList.remove("theme-transition");
    },600);
  });
}


/* ==================================================
   HOME PAGE SIDE PANEL
================================================== */

const menuBtn=document.getElementById("menuBtn");
const sidePanel=document.getElementById("sidePanel");
const closePanel=document.getElementById("closePanel");

if(menuBtn && sidePanel && closePanel){
  menuBtn.onclick=()=>sidePanel.classList.toggle("active");
  closePanel.onclick=()=>sidePanel.classList.remove("active");
}


/* ==================================================
   HOME PAGE MODAL DATA
================================================== */

const data={
  users:{
    title:"Our Users",
    img:"/static/image/user.png",
    text:"AITalksy serves students, travelers, professionals, educators, customer service representatives, and international teams who frequently communicate across different languages. It is beneficial for individuals participating in global meetings, academic discussions, tourism activities, or cross-border collaborations. The platform helps users understand and respond in real time, enabling smooth conversations without requiring prior knowledge of foreign languages."
  },

  purpose:{
    title:"Our Purpose",
    img:"/static/image/purpose.png",
    text:"AITalksy is designed to simplify communication in multilingual situations such as education, travel, healthcare, business meetings, and online collaboration. The platform instantly translates spoken conversations, improving understanding and reducing communication delays. Its purpose is to provide an intelligent, accessible solution that enhances interaction efficiency while supporting inclusive communication among people from diverse linguistic and cultural backgrounds."
  },

  about:{
    title:"About Us",
    img:"/static/image/abtus.png",
    text:"AITalksy is an AI-driven real-time voice translation platform developed to bridge communication gaps across languages. Using advanced speech recognition and artificial intelligence, the system converts spoken language into translated speech instantly. Our platform focuses on delivering smooth, natural conversations, empowering users to communicate globally without linguistic barriers while promoting accessibility, inclusivity, and seamless digital interaction in everyday communication environments."
  },

  goal:{
    title:"Our Goal",
    img:"/static/image/goal.png",
    text:"The goal of AITalksy is to enable effortless and accurate multilingual communication through real-time AI voice translation. We aim to remove language limitations that restrict collaboration, learning, and global interaction. By providing instant speech conversion, AITalksy strives to create a connected world where individuals can exchange ideas, build relationships, and communicate confidently regardless of language differences or geographical boundaries."
  }
};

window.openModal=(key)=>{
  if(!data[key]) return;
  document.getElementById("modalImg").src=data[key].img;
  document.getElementById("modalTitle").textContent=data[key].title;
  document.getElementById("modalText").textContent=data[key].text;
  document.getElementById("modal").classList.add("active");
};

const closeModalBtn=document.getElementById("closeModal");
const modal=document.getElementById("modal");

if(closeModalBtn && modal){
  closeModalBtn.onclick=()=>modal.classList.remove("active");

  modal.onclick=(e)=>{
    if(e.target.id==="modal"){
      modal.classList.remove("active");
    }
  };
}


/* ==================================================
   TRANSLATOR PAGE – SUPPORTED LANGUAGES
================================================== */

const languageMap = {
  "English":"en",
  "Hindi":"hi",
  "Gujarati":"gu",
  "Spanish":"es",
  "French":"fr",
  "German":"de",
  "Chinese":"zh",
  "Italian":"it",
  "Portuguese":"pt",
  "Dutch":"nl",
  "Russian":"ru",
  "Japanese":"ja",
  "Arabic":"ar",
  "Korean":"ko",
  "Turkish":"tr",
  "Polish":"pl",
  "Vietnamese":"vi",
  "Indonesian":"id",
  "Thai":"th"
};

const languages = Object.keys(languageMap);

function setupDropdown(searchId,listId){

  const search=document.getElementById(searchId);
  const list=document.getElementById(listId);

  if(!search || !list) return;

  function render(filter=""){
    list.innerHTML="";

    languages
      .filter(lang=>lang.toLowerCase().includes(filter.toLowerCase()))
      .forEach(lang=>{
        const div=document.createElement("div");
        div.textContent=lang;

        div.onclick=()=>{
          search.value=lang;
          list.style.display="none";
        };

        list.appendChild(div);
      });
  }

  list.style.display="none";

  search.addEventListener("focus",()=>{
    list.style.display="block";
    render(search.value);
  });

  search.addEventListener("input",()=>{
    render(search.value);
    list.style.display="block";
  });

  document.addEventListener("click",(e)=>{
    if(!search.contains(e.target) && !list.contains(e.target)){
      list.style.display="none";
    }
  });
}

setupDropdown("fromSearch","fromList");
setupDropdown("toSearch","toList");


/* ==================================================
   SWAP LANGUAGES
================================================== */

const swapBtn=document.getElementById("swapLang");

if(swapBtn){
  swapBtn.addEventListener("click",()=>{
    const from=document.getElementById("fromSearch");
    const to=document.getElementById("toSearch");

    const temp=from.value;
    from.value=to.value;
    to.value=temp;
  });
}


/* ==================================================
   COPY TRANSLATION
================================================== */

const copyBtn=document.getElementById("copyBtn");

if(copyBtn){
  copyBtn.addEventListener("click",()=>{
    const text=document.getElementById("translatedText").value;

    if(!text) return;

    navigator.clipboard.writeText(text);

    copyBtn.innerText="✅ Copied";

    setTimeout(()=>{
      copyBtn.innerText="📋 Copy";
    },2000);
  });
}


/* ==================================================
   FRIENDLY ERROR HANDLING
================================================== */

function getFriendlyErrorMessage(rawError=""){
  const msg=String(rawError).toLowerCase();

  if(msg.includes("speech not detected")){
    return "No clear speech was detected. Please speak louder and try again.";
  }

  if(msg.includes("language not supported")){
    return "The selected language is not supported yet. Please choose another target language.";
  }

  if(msg.includes("translation failed")){
    return "Translation could not be completed. Please try again.";
  }

  if(msg.includes("failed to fetch") || msg.includes("networkerror")){
    return "Could not connect to the translation server. Please try again.";
  }

  return "Something went wrong while processing your voice. Please try again.";
}


/* ==================================================
   VOICE RECORDING + TRANSLATION
================================================== */

let mediaRecorder;
let audioChunks=[];
let recording=false;
let translatedAudio="";
let currentAudio=null;
let silenceTimer=null;
let recordingStartTime=0;

const recordBtn=document.getElementById("recordBtn");
const voiceStatus=document.getElementById("voiceStatus");
const waveform=document.getElementById("waveform");

async function startRecording(){

  if(recording) return;

  const sourceLang=document.getElementById("fromSearch")?.value;
  const targetLang=document.getElementById("toSearch")?.value;

  if(!sourceLang || !targetLang){
    document.getElementById("sourceText").value="Please select both source and target languages first.";
    if(recordBtn) recordBtn.classList.remove("recording");
    if(voiceStatus) voiceStatus.textContent="Select both languages first";
    if(waveform) waveform.classList.remove("active");
    return;
  }

  document.getElementById("sourceText").value="🎙 Listening...";
  document.getElementById("translatedText").value="";
  translatedAudio="";

  if(currentAudio){
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  let stream;

  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:true});
  }catch(err){
    console.error("Microphone error:", err);

    let message="Could not access microphone.";

    if(err.name==="NotAllowedError"){
      message="Microphone permission denied. Please allow microphone access and try again.";
    }else if(err.name==="NotFoundError"){
      message="No microphone device was found on this system.";
    }else if(err.name==="NotReadableError"){
      message="Microphone is busy or unavailable. Try reconnecting the mic or use laptop mic.";
    }else if(err.name==="SecurityError"){
      message="Microphone access is blocked due to browser security settings.";
    }

    document.getElementById("sourceText").value=message;
    if(recordBtn) recordBtn.classList.remove("recording");
    if(voiceStatus) voiceStatus.textContent="Microphone unavailable";
    if(waveform) waveform.classList.remove("active");
    return;
  }

  mediaRecorder=new MediaRecorder(stream);

  audioChunks=[];
  recording=true;
  silenceTimer=null;
  recordingStartTime=Date.now();

  if(recordBtn){
    recordBtn.classList.add("recording");
    recordBtn.innerText="⏹ Stop";
  }

  if(voiceStatus) voiceStatus.textContent="🎙 Listening...";
  if(waveform) waveform.classList.add("active");

  mediaRecorder.ondataavailable=e=>{
    audioChunks.push(e.data);
  };

  mediaRecorder.start();

  monitorSilence(stream);
}

function stopRecording(){

  if(!recording) return;

  recording=false;

  if(recordBtn){
    recordBtn.classList.remove("recording");
    recordBtn.innerText="🎤 Speak";
  }

  if(voiceStatus) voiceStatus.textContent="⏳ Processing speech...";
  if(waveform) waveform.classList.remove("active");

  mediaRecorder.stop();
  mediaRecorder.stream.getTracks().forEach(track=>track.stop());

  if(silenceTimer) clearTimeout(silenceTimer);

  mediaRecorder.onstop=async()=>{

    const blob=new Blob(audioChunks,{type:"audio/webm"});
    const sourceLang=document.getElementById("fromSearch").value.toLowerCase();
    const targetLang=document.getElementById("toSearch").value.toLowerCase();

    const formData=new FormData();
    formData.append("audio",blob,"speech.webm");
    formData.append("target_language",targetLang);
    formData.append("source_language",sourceLang);

    document.getElementById("sourceText").value="⏳ Processing speech...";
    document.getElementById("translatedText").value="";

    let res;

    try{
      res=await fetch("/translate",{
        method:"POST",
        body:formData
      });
    }catch(err){
      document.getElementById("sourceText").value="Could not connect to the server.";
      document.getElementById("translatedText").value="Please check the backend and try again.";
      if(voiceStatus) voiceStatus.textContent="Server connection failed";
      return;
    }

    const data=await res.json();

    if(data.error){
      document.getElementById("sourceText").value="⚠ " + getFriendlyErrorMessage(data.error);
      document.getElementById("translatedText").value="";
      translatedAudio="";
      if(voiceStatus) voiceStatus.textContent="Please try again";
      return;
    }

    document.getElementById("sourceText").value=data.source_text;
    document.getElementById("translatedText").value=data.translated_text;
    translatedAudio=data.audio_url || "";

    if(voiceStatus){
      voiceStatus.textContent = translatedAudio
        ? "✅ Translation complete • Click Listen for audio"
        : "✅ Translation complete • Audio unavailable";
    }
  };
}


/* ==================================================
   SILENCE DETECTION
================================================== */

function monitorSilence(stream){

  const audioContext=new AudioContext();
  const analyser=audioContext.createAnalyser();
  const mic=audioContext.createMediaStreamSource(stream);

  mic.connect(analyser);

  const data=new Uint8Array(analyser.frequencyBinCount);

  function detect(){

    analyser.getByteFrequencyData(data);

    const volume=data.reduce((a,b)=>a+b)/data.length;

    if(volume < 8){
      if(!silenceTimer){
        silenceTimer=setTimeout(()=>{
          if(Date.now() - recordingStartTime > 1500){
            stopRecording();
          }
        },1800);
      }
    }else{
      if(silenceTimer){
        clearTimeout(silenceTimer);
        silenceTimer=null;
      }
    }

    if(recording) requestAnimationFrame(detect);
  }

  detect();
}


/* ==================================================
   BUTTON TOGGLE
================================================== */

if(recordBtn){
  recordBtn.addEventListener("click",()=>{
    if(!recording){
      startRecording();
    }else{
      stopRecording();
    }
  });
}


/* ==================================================
   PLAY READY TRANSLATED AUDIO
================================================== */

window.playTranslation=function(){
  if(!translatedAudio){
    if(voiceStatus) voiceStatus.textContent="No translated audio available.";
    return;
  }

  if(currentAudio){
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(translatedAudio);

  currentAudio.play()
    .then(()=>{
      if(voiceStatus) voiceStatus.textContent="✅ Playing translated audio";
    })
    .catch(err=>{
      console.error("Audio playback failed:", err);
      if(voiceStatus) voiceStatus.textContent="Audio playback failed.";
    });
};

});