"use strict";
/* Нижнее фото: перемещение и пропорциональный размер за углы. */
(() => {
  const page=document.querySelector("#custom-character");
  const canvas=page?.querySelector(".cc-canvas");
  const panel=page?.querySelector(".cc-separate-panel");
  const fields=page?.querySelector(".cc-data");
  const holder=page?.querySelector(".cc-secondary");
  const photo=holder?.querySelector(".cc-secondary-photo");
  if(!canvas || !panel || !fields || !holder || !photo || page.dataset.ccPhotoSizing)return;
  page.dataset.ccPhotoSizing="true";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let source="",position=null,zoom=1,drag=null,queued=false;
  const style=document.createElement("style");
  style.textContent=`
    #custom-character .cc-secondary.cc-filled {
      overflow:visible !important; touch-action:none; cursor:grab;
    }
    #custom-character .cc-secondary.cc-dragging { cursor:grabbing; }
    #custom-character .cc-secondary.cc-filled > .cc-secondary-photo {
      display:block; width:100% !important; height:100% !important;
      max-width:none; max-height:none; object-fit:contain !important;
      object-position:center; margin:0; padding:0; border:0;
      user-select:none; -webkit-user-drag:none;
    }
    #custom-character .cc-photo-controls { display:none !important; }
    #custom-character .cc-secondary .cc-photo-corner { display:none; }
    #custom-character .cc-secondary.cc-filled > .cc-photo-corner {
      display:block; position:absolute; width:28px; height:28px;
      margin:0; padding:0; z-index:6; border:0; background:transparent;
      touch-action:none; opacity:0;
    }
    #custom-character .cc-photo-corner::after {
      content:""; position:absolute; left:9px; top:9px;
      width:8px; height:8px; background:#E5E0CF; border:1px solid #516D79;
      box-sizing:border-box;
    }
    #custom-character .cc-photo-corner[data-corner="nw"] { left:-14px; top:-14px; cursor:nwse-resize; }
    #custom-character .cc-photo-corner[data-corner="ne"] { right:-14px; top:-14px; cursor:nesw-resize; }
    #custom-character .cc-photo-corner[data-corner="sw"] { left:-14px; bottom:-14px; cursor:nesw-resize; }
    #custom-character .cc-photo-corner[data-corner="se"] { right:-14px; bottom:-14px; cursor:nwse-resize; }
    #custom-character .cc-secondary.cc-filled:hover,
    #custom-character .cc-secondary.cc-filled:focus-within {
      outline:1px dashed #E5E0CF80; outline-offset:0;
    }
    #custom-character .cc-secondary.cc-filled:hover > .cc-photo-corner,
    #custom-character .cc-secondary.cc-filled:focus-within > .cc-photo-corner,
    #custom-character .cc-secondary.cc-dragging > .cc-photo-corner { opacity:1; }
    #custom-character .cc-photo-corner:focus-visible { outline:1px dashed #E5E0CF; }
    @media(hover:none) {
      #custom-character .cc-secondary.cc-filled > .cc-photo-corner { opacity:1; }
    }
  `;
  document.head.append(style);
  const handles=[];
  for(const corner of ["nw","ne","sw","se"]){
    const span=document.createElement("span");span.className="cc-photo-corner";
    span.dataset.corner=corner;span.tabIndex=-1;span.setAttribute("role","slider");
    span.setAttribute("aria-label","Размер фото: потяни угол или используй стрелки");
    span.setAttribute("aria-valuemin","25");span.setAttribute("aria-valuemax","200");
    holder.append(span);handles.push(span);
  }
  function rects(){
    const c=canvas.getBoundingClientRect(),p=panel.getBoundingClientRect(),f=fields.getBoundingClientRect();
    if(!c.width || !c.height || !p.width)return null;
    return {c,p,f,gap:Math.max(0,f.left-p.left)};
  }
  function geometry(nw,nh,aw,ah,z){
    const base=Math.min(1,Math.max(1,aw)/nw,Math.max(1,ah)/nh);
    return {width:nw*base*z,height:nh*base*z};
  }
  function update(){
    queued=false;const r=rects();if(!r)return;
    const {c,p,f,gap}=r;
    const current=photo.getAttribute("src") || "";
    const ready=Boolean(current && !photo.hidden);
    handles.forEach(h=>{h.tabIndex=ready?0:-1;h.setAttribute("aria-valuenow",String(Math.round(zoom*100)));});
    if(!ready){
      source="";position=null;zoom=1;drag=null;holder.classList.remove("cc-dragging");
      holder.style.removeProperty("width");holder.style.removeProperty("height");
      const width=holder.getBoundingClientRect().width;
      holder.style.setProperty("left",`${p.right-c.left-gap-width}px`,"important");
      holder.style.removeProperty("top");
      const last=fields.querySelector("input:last-child");
      if(last){const height=holder.getBoundingClientRect().height;
        holder.style.setProperty("top",`${last.getBoundingClientRect().bottom-c.top-height}px`,"important");}
      return;
    }
    if(!photo.complete || !photo.naturalWidth || !photo.naturalHeight)return;
    const left=p.left-c.left,right=p.right-c.left,top=p.top-c.top,bottom=p.bottom-c.top;
    const aw=Math.max(1,p.right-gap-f.right-gap*.35),ah=Math.max(1,p.height-gap*2);
    if(source!==current || !position){
      source=current;zoom=1;
      const initial=geometry(photo.naturalWidth,photo.naturalHeight,aw,ah,1);
      position={x:(right-gap-initial.width/2)/c.width,y:(top+p.height/2)/c.height};
    }
    const size=geometry(photo.naturalWidth,photo.naturalHeight,aw,ah,zoom);
    holder.style.setProperty("width",`${size.width}px`,"important");
    holder.style.setProperty("height",`${size.height}px`,"important");
    const margin=Math.min(gap*.4,p.width*.03,p.height*.03);
    const cx=clamp(position.x*c.width,left+margin,right-margin);
    const cy=clamp(position.y*c.height,top+margin,bottom-margin);
    position={x:cx/c.width,y:cy/c.height};
    holder.style.setProperty("left",`${cx-size.width/2}px`,"important");
    holder.style.setProperty("top",`${cy-size.height/2}px`,"important");
    holder.tabIndex=0;photo.draggable=false;
    holder.setAttribute("aria-label","Фото: перетаскивай для перемещения, тяни за угол для размера. Стрелки — перемещение, плюс и минус — размер.");
    handles.forEach(h=>h.setAttribute("aria-valuenow",String(Math.round(zoom*100))));
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
  function resizeFactor(w,h,sx,sy,dx,dy){return 1+(sx*w*dx+sy*h*dy)/(w*w+h*h);}
  holder.addEventListener("pointerdown",event=>{
    if(!position || event.button!==0 || event.target.closest("button") || drag)return;
    const r=rects();if(!r)return;
    const corner=event.target.closest(".cc-photo-corner")?.dataset.corner;
    const hr=holder.getBoundingClientRect();
    event.stopImmediatePropagation();event.preventDefault();
    drag={id:event.pointerId,px:event.clientX,py:event.clientY,start:{...position},zoom,c:r.c,w:hr.width,h:hr.height,corner};
    if(corner){
      drag.sx=corner.includes("e")?1:-1;drag.sy=corner.includes("s")?1:-1;
      drag.ax=position.x*r.c.width-drag.sx*hr.width/2;
      drag.ay=position.y*r.c.height-drag.sy*hr.height/2;
    }
    holder.setPointerCapture(event.pointerId);holder.classList.add("cc-dragging");
  },true);
  holder.addEventListener("pointermove",event=>{
    if(!drag || drag.id!==event.pointerId)return;
    event.stopImmediatePropagation();event.preventDefault();
    const dx=event.clientX-drag.px,dy=event.clientY-drag.py;
    if(drag.corner){
      const factor=resizeFactor(drag.w,drag.h,drag.sx,drag.sy,dx,dy);
      zoom=clamp(drag.zoom*factor,.25,2);
      const ratio=zoom/drag.zoom;
      position={x:(drag.ax+drag.sx*drag.w*ratio/2)/drag.c.width,y:(drag.ay+drag.sy*drag.h*ratio/2)/drag.c.height};
    }else{
      position={x:drag.start.x+dx/drag.c.width,y:drag.start.y+dy/drag.c.height};
    }
    update();
  },true);
  function finish(event){
    if(!drag || drag.id!==event.pointerId)return;
    event.stopImmediatePropagation();
    if(event.type==="pointercancel"){position=drag.start;zoom=drag.zoom;}
    drag=null;holder.classList.remove("cc-dragging");
    if(holder.hasPointerCapture(event.pointerId))holder.releasePointerCapture(event.pointerId);
    update();
  }
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>holder.addEventListener(type,finish,true));
  holder.addEventListener("keydown",event=>{
    if(!position)return;
    const onHandle=Boolean(event.target.closest(".cc-photo-corner"));
    if(onHandle && ["ArrowUp","ArrowRight","ArrowDown","ArrowLeft","+","=","-"].includes(event.key)){
      event.stopImmediatePropagation();event.preventDefault();
      const increase=["ArrowUp","ArrowRight","+","="].includes(event.key);
      zoom=clamp(zoom+(increase?.05:-.05),.25,2);update();return;
    }
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(delta){
      const r=rects();if(!r)return;
      event.stopImmediatePropagation();event.preventDefault();const step=event.shiftKey?20:5;
      position.x+=delta[0]*step/r.c.width;position.y+=delta[1]*step/r.c.height;update();
    }else if(["+","=","-"].includes(event.key)){
      event.stopImmediatePropagation();event.preventDefault();zoom=clamp(zoom+(event.key==="-"?-.05:.05),.25,2);update();
    }
  },true);
  new MutationObserver(schedule).observe(photo,{attributes:true,attributeFilter:["src","hidden"]});
  photo.addEventListener("load",schedule);
  if("ResizeObserver"in window){const o=new ResizeObserver(schedule);o.observe(canvas);o.observe(fields);}
  window.addEventListener("resize",schedule);window.addEventListener("hashchange",schedule);
  if(document.fonts?.ready)document.fonts.ready.then(schedule);
  schedule();
})();
