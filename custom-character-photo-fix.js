"use strict";
/* Размер нижнего фото и равные боковые отступы. Подключать последним. */
(() => {
  const page=document.querySelector("#custom-character");
  const canvas=page?.querySelector(".cc-canvas");
  const panel=page?.querySelector(".cc-separate-panel");
  const fields=page?.querySelector(".cc-data");
  const holder=page?.querySelector(".cc-secondary");
  const photo=holder?.querySelector(".cc-secondary-photo");
  if(!canvas || !panel || !fields || !holder || !photo || page.dataset.ccPhotoSizing)return;
  page.dataset.ccPhotoSizing="true";
  const style=document.createElement("style");
  style.textContent=`
    #custom-character .cc-secondary.cc-filled > .cc-secondary-photo {
      display:block; width:100% !important; height:100% !important;
      max-width:none; max-height:none; object-fit:contain !important;
      object-position:center; margin:0; padding:0; border:0;
    }
    #custom-character .cc-secondary.cc-filled {
      overflow:visible !important; touch-action:none;
    }
  `;
  document.head.append(style);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let src="",position=null,drag=null,queued=false;
  function rectangles(){
    const c=canvas.getBoundingClientRect(),p=panel.getBoundingClientRect(),f=fields.getBoundingClientRect();
    if(!c.width || !c.height || !p.width)return null;
    const gap=Math.max(0,f.left-p.left);
    return {c,p,f,gap};
  }
  function writePosition(x,y){
    holder.style.setProperty("left",`${x}px`,"important");
    holder.style.setProperty("top",`${y}px`,"important");
  }
  function update(){
    queued=false;
    const r=rectangles();if(!r)return;
    const {c,p,f,gap}=r;
    const current=photo.getAttribute("src") || "";
    const ready=Boolean(current && !photo.hidden);
    if(!ready){
      src="";position=null;drag=null;
      holder.style.removeProperty("width");holder.style.removeProperty("height");
      // Расстояние от правого края кнопки до плашки = отступу текста слева.
      const width=holder.getBoundingClientRect().width;
      holder.style.setProperty("left",`${p.right-c.left-gap-width}px`,"important");
      holder.style.removeProperty("top");
      // После удаления старой фото-позиции снова совмещаем низ с текстом.
      const last=fields.querySelector("input:last-child");
      if(last){const bottom=last.getBoundingClientRect().bottom;const height=holder.getBoundingClientRect().height;
        holder.style.setProperty("top",`${bottom-c.top-height}px`,"important");}
      return;
    }
    if(!photo.complete || !photo.naturalWidth || !photo.naturalHeight)return;
    const innerRight=p.right-c.left-gap;
    const innerTop=p.top-c.top+gap;
    const innerBottom=p.bottom-c.top-gap;
    const availableWidth=Math.max(1,innerRight-(f.right-c.left+gap*.35));
    const availableHeight=Math.max(1,innerBottom-innerTop);
    // Нативный размер файла; уменьшаем только если не помещается справа.
    const scale=Math.min(1,availableWidth/photo.naturalWidth,availableHeight/photo.naturalHeight);
    const width=photo.naturalWidth*scale,height=photo.naturalHeight*scale;
    holder.style.setProperty("width",`${width}px`,"important");
    holder.style.setProperty("height",`${height}px`,"important");
    if(src!==current || !position){
      src=current;
      position={x:(innerRight-width)/c.width,y:(p.top-c.top+(p.height-height)/2)/c.height};
    }
    const minX=p.left-c.left+gap,minY=innerTop;
    const x=clamp(position.x*c.width,minX,Math.max(minX,innerRight-width));
    const y=clamp(position.y*c.height,minY,Math.max(minY,innerBottom-height));
    position={x:x/c.width,y:y/c.height};writePosition(x,y);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
  // Новое перемещение работает с реальными размерами целой фотографии.
  holder.addEventListener("pointerdown",event=>{
    if(!position || event.button!==0 || event.target.closest("button"))return;
    const r=rectangles();if(!r)return;
    event.stopImmediatePropagation();event.preventDefault();
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:position.x,startY:position.y,c:r.c};
    holder.setPointerCapture(event.pointerId);holder.classList.add("cc-dragging");
  },true);
  holder.addEventListener("pointermove",event=>{
    if(!drag || drag.id!==event.pointerId)return;
    event.stopImmediatePropagation();event.preventDefault();
    position={x:drag.startX+(event.clientX-drag.x)/drag.c.width,y:drag.startY+(event.clientY-drag.y)/drag.c.height};
    update();
  },true);
  function finish(event){
    if(!drag || drag.id!==event.pointerId)return;
    event.stopImmediatePropagation();drag=null;holder.classList.remove("cc-dragging");
    if(holder.hasPointerCapture(event.pointerId))holder.releasePointerCapture(event.pointerId);
  }
  ["pointerup","pointercancel","lostpointercapture"].forEach(type=>holder.addEventListener(type,finish,true));
  holder.addEventListener("keydown",event=>{
    if(!position)return;
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!delta)return;
    const r=rectangles();if(!r)return;
    event.stopImmediatePropagation();event.preventDefault();const step=event.shiftKey?20:5;
    position.x+=delta[0]*step/r.c.width;position.y+=delta[1]*step/r.c.height;update();
  },true);
  new MutationObserver(schedule).observe(photo,{attributes:true,attributeFilter:["src","hidden"]});
  photo.addEventListener("load",schedule);
  if("ResizeObserver"in window){const o=new ResizeObserver(schedule);o.observe(canvas);o.observe(fields);}
  window.addEventListener("resize",schedule);window.addEventListener("hashchange",schedule);
  if(document.fonts?.ready)document.fonts.ready.then(schedule);
  schedule();
})();
