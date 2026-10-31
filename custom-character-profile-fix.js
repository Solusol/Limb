"use strict";
/* Полная замена custom-character-profile-fix.js. */
(() => {
  const page=document.querySelector("#custom-character");
  const canvas=page?.querySelector(".cc-canvas");
  if(!page || !canvas || document.querySelector("#cc-profile-polish-styles")) return;
  const heading=page.querySelector("#cc-title");
  if(heading)heading.textContent="Персонажи";
  page.classList.add("character-page");
  const note=page.querySelector(".cc-note");if(note)note.hidden=true;
  const tools=page.querySelector(".cc-tools");if(tools)tools.hidden=true;
  const border=new Image();border.alt="";border.draggable=false;
  border.className="cc-profile-border";
  border.src="assets/frames/character-sheet.webp";
  canvas.append(border);
  const error=page.querySelector(".cc-error");if(error)page.append(error);
  const style=document.createElement("style");style.id="cc-profile-polish-styles";
  style.textContent=`
    #custom-character { padding-top:24px; }
    #custom-character > #cc-title { text-align:center; margin-inline:auto; }
    #custom-character > .cc-note,
    #custom-character > .cc-tools,
    #custom-character > .cc-error:empty { display:none !important; }
    #custom-character .cc-canvas {
      position:relative; margin:24px auto 0;
      width:100%; aspect-ratio:1025 / 1325; border:0; background:transparent;
    }
    #custom-character .cc-profile-border {
      position:absolute !important; inset:0 !important;
      display:block; width:100% !important; height:100% !important;
      max-width:none; margin:0; padding:0; object-fit:fill;
      z-index:10; pointer-events:none; border:0;
    }
    #custom-character .cc-frame { display:none !important; }
    #custom-character .cc-main-upload.cc-filled,
    #custom-character .cc-secondary.cc-filled .cc-upload { display:none !important; }
    /* Компактная фотография / кнопка в нижнем правом углу плашки. */
    #custom-character .cc-secondary {
      left:71% !important; top:85% !important;
      width:17% !important; height:7% !important;
      overflow:hidden; z-index:4;
    }
    #custom-character .cc-secondary.cc-photo-movable {
      left:var(--cc-photo-left,71%) !important;
      top:var(--cc-photo-top,85%) !important;
      touch-action:none; cursor:grab; user-select:none;
    }
    #custom-character .cc-secondary.cc-dragging { cursor:grabbing; }
    #custom-character .cc-secondary-photo {
      display:block; width:100%; height:100%; object-fit:cover;
      border:0; background:transparent; user-select:none; -webkit-user-drag:none;
    }
    #custom-character .cc-secondary .cc-upload {
      display:grid; grid-template-columns:minmax(0,1fr);
      place-items:center; min-height:0;
      width:100%; height:100%; margin:0; padding:0;
      border:0; background:transparent;
    }
    #custom-character .cc-secondary .cc-upload > img {
      grid-area:1/1; display:block; width:100%; height:auto;
      max-height:100%; object-fit:contain; pointer-events:none;
    }
    #custom-character .cc-secondary .cc-upload .cc-normal { opacity:1; }
    #custom-character .cc-secondary .cc-upload .cc-hover { opacity:0; }
    #custom-character .cc-secondary .cc-upload:active .cc-normal,
    #custom-character .cc-secondary .cc-upload:focus-visible .cc-normal { opacity:0; }
    #custom-character .cc-secondary .cc-upload:active .cc-hover,
    #custom-character .cc-secondary .cc-upload:focus-visible .cc-hover { opacity:1; }
    @media(hover:hover) {
      #custom-character .cc-secondary .cc-upload:hover .cc-normal { opacity:0; }
      #custom-character .cc-secondary .cc-upload:hover .cc-hover { opacity:1; }
    }
    #custom-character .cc-stats {
      display:flex; flex-direction:column; height:auto; gap:18px;
    }
    #custom-character .cc-stat {
      position:relative; flex:none; width:100%; height:auto; min-height:0;
      aspect-ratio:var(--cc-stat-ratio,4 / 1);
    }
    #custom-character .cc-stat-art {
      position:relative; inset:auto; display:block;
      width:100%; height:auto; max-width:100%; margin:0; object-fit:contain;
    }
    #custom-character .cc-cells { top:auto; bottom:8%; height:45%; }
    #cc-icons:not([open]) { display:none !important; }
    #cc-icons[open] {
      position:fixed !important; inset:auto !important;
      left:50% !important; top:50% !important;
      transform:translate(-50%,-50%) !important; box-sizing:border-box;
      width:min(820px,calc(100vw - 32px)) !important;
      max-width:calc(100vw - 32px) !important;
      max-height:calc(100dvh - 48px) !important;
      margin:0 !important; padding:clamp(20px,4vw,44px) !important;
      overflow:auto; background-color:transparent !important;
      background-image:url("./assets/frames/taimline.webp") !important;
      background-position:center !important; background-repeat:no-repeat !important;
      background-size:100% 100% !important; border:0 !important;
      border-radius:0; outline:none !important; box-shadow:none !important;
    }
    #cc-icons::backdrop { background:rgb(0 0 0 / 65%); }
    #cc-icons .cc-close {
      display:block; margin:0 0 20px auto; padding:8px 12px;
      color:#FFFFFF; border:0 !important; border-radius:0;
      background:transparent !important; box-shadow:none !important;
    }
    #cc-icons .cc-icon-grid {
      display:grid; grid-template-columns:repeat(auto-fit,minmax(72px,1fr));
      align-items:center; gap:12px;
    }
    #cc-icons .cc-icon-choice {
      border:0 !important; background:transparent; outline:none; box-shadow:none; padding:8px;
    }
    #cc-icons .cc-icon-choice[aria-pressed="true"] {
      border:0 !important; background:rgb(0 0 0 / 12%);
    }
    #cc-icons .cc-icon-choice img {
      display:block; width:100%; height:80px; object-fit:contain;
    }
    #cc-icons .cc-close:focus:not(:focus-visible),
    #custom-character .cc-icon-select:focus:not(:focus-visible) { outline:none !important; }
    #cc-icons .cc-close:focus-visible,
    #cc-icons .cc-icon-choice:focus-visible {
      outline:1px dashed #E5E0CF !important; outline-offset:3px;
    }
    @media(hover:hover) {
      #cc-icons .cc-close:hover { color:#5D6444; }
      #cc-icons .cc-icon-choice:hover { background:rgb(0 0 0 / 12%); }
    }
  `;
  document.head.append(style);
  const statImages=[...page.querySelectorAll(".cc-stat-art")];
  function setRatio(img){
    if(img.naturalWidth && img.naturalHeight)img.parentElement.style.setProperty("--cc-stat-ratio",`${img.naturalWidth} / ${img.naturalHeight}`);
  }
  function fitStats(){
    const stats=page.querySelector(".cc-stats");
    if(!stats || !canvas.getBoundingClientRect().width)return;
    const cr=canvas.getBoundingClientRect();const maxHeight=cr.height*.37;
    let width=cr.width*.255;
    const ratios=statImages.map(img=>img.naturalWidth && img.naturalHeight ? img.naturalHeight/img.naturalWidth : .25);
    const sum=ratios.reduce((a,b)=>a+b,0);const gap=cr.width*.018;
    const space=gap*Math.max(0,ratios.length-1);
    if(sum && width*sum+space>maxHeight)width=Math.max(1,(maxHeight-space)/sum);
    stats.style.width=`${width}px`;stats.style.gap=`${gap}px`;
  }
  statImages.forEach(img=>{
    if(img.complete)setRatio(img);
    img.addEventListener("load",()=>{setRatio(img);fitStats();});
  });
  function matchHeading(){
    const ref=document.querySelector("#character > h1") || document.querySelector("#characters > h1");
    if(!ref || !heading)return;
    const cs=getComputedStyle(ref);
    for(const p of ["font-family","font-size","font-weight","line-height","letter-spacing","text-transform","color","margin-top","margin-bottom"])
      heading.style.setProperty(p,cs.getPropertyValue(p));
  }
  // Положение хранится только в памяти текущей страницы.
  const secondary=page.querySelector(".cc-secondary");
  const photo=secondary?.querySelector(".cc-secondary-photo");
  let x=71,y=85,drag=null,lastSource="";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function place(){
    if(!secondary)return;
    const cr=canvas.getBoundingClientRect();const sr=secondary.getBoundingClientRect();
    if(!cr.width || !cr.height)return;
    const w=sr.width/cr.width*100,h=sr.height/cr.height*100;
    x=clamp(x,10,90-w);y=clamp(y,65,93-h);
    secondary.style.setProperty("--cc-photo-left",`${x}%`);
    secondary.style.setProperty("--cc-photo-top",`${y}%`);
  }
  function syncPhoto(){
    if(!secondary || !photo)return;
    const src=photo.getAttribute("src") || "";
    const ready=Boolean(src && !photo.hidden);
    secondary.classList.toggle("cc-photo-movable",ready);
    if(src!==lastSource){x=71;y=85;drag=null;lastSource=src;}
    if(ready){
      photo.draggable=false;secondary.tabIndex=0;
      secondary.setAttribute("role","group");
      secondary.setAttribute("aria-label","Фотография. Перетаскивай внутри красной плашки или перемещай стрелками клавиатуры.");
      place();
    }else{
      secondary.removeAttribute("tabindex");secondary.removeAttribute("role");
      secondary.removeAttribute("aria-label");
      secondary.classList.remove("cc-dragging");
    }
  }
  if(secondary && photo){
    new MutationObserver(syncPhoto).observe(photo,{attributes:true,attributeFilter:["src","hidden"]});
    secondary.addEventListener("pointerdown",event=>{
      if(event.button!==0 || !secondary.classList.contains("cc-photo-movable") || event.target.closest("button"))return;
      const r=canvas.getBoundingClientRect();if(!r.width || !r.height)return;
      drag={id:event.pointerId,px:event.clientX,py:event.clientY,x,y,w:r.width,h:r.height};
      secondary.setPointerCapture(event.pointerId);
      secondary.classList.add("cc-dragging");event.preventDefault();
    });
    secondary.addEventListener("pointermove",event=>{
      if(!drag || drag.id!==event.pointerId)return;
      x=drag.x+(event.clientX-drag.px)/drag.w*100;
      y=drag.y+(event.clientY-drag.py)/drag.h*100;place();
    });
    function finish(event){
      if(!drag || drag.id!==event.pointerId)return;
      drag=null;secondary.classList.remove("cc-dragging");
      if(secondary.hasPointerCapture(event.pointerId))secondary.releasePointerCapture(event.pointerId);
    }
    ["pointerup","pointercancel","lostpointercapture"].forEach(type=>secondary.addEventListener(type,finish));
    secondary.addEventListener("keydown",event=>{
      if(!secondary.classList.contains("cc-photo-movable"))return;
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      if(!delta)return;event.preventDefault();
      const step=event.shiftKey?3:1;x+=delta[0]*step;y+=delta[1]*step;place();
    });
    syncPhoto();
  }
  function update(){matchHeading();fitStats();place();}
  window.addEventListener("resize",update);
  window.addEventListener("hashchange",()=>requestAnimationFrame(update));
  if("ResizeObserver"in window)new ResizeObserver(()=>{fitStats();place();}).observe(canvas);
  if(document.fonts?.ready)document.fonts.ready.then(update);
  update();
})();
