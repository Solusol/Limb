"use strict";
/* Полная замена custom-character-panel-fix.js. */
(() => {
  const page=document.querySelector("#custom-character");
  const canvas=page?.querySelector(".cc-canvas");
  const secondary=page?.querySelector(".cc-secondary");
  const button=secondary?.querySelector(".cc-upload");
  const fields=page?.querySelector(".cc-data");
  const C=window.LIMB_CUSTOM_CHARACTER;
  if(!canvas || !secondary || !button || !fields || !C || document.querySelector("#cc-panel-button-styles"))return;
  let panel=canvas.querySelector(".cc-separate-panel");
  if(!panel){panel=new Image();panel.alt="";panel.draggable=false;panel.className="cc-separate-panel";panel.src="assets/sozdai-sebya/Rectangle%2016.webp";canvas.append(panel);}
  const base=C.base.replace(/\/?$/, "/");
  function picture(file,cls){const img=new Image();img.alt="";img.className=cls;img.draggable=false;img.src=base+file;return img;}
  const normal=picture(C.assets.upload,"cc-normal");
  const hover=picture(C.assets.uploadHover,"cc-hover");
  button.classList.remove("cc-live-upload");button.classList.add("cc-image-upload");
  button.replaceChildren(normal,hover);
  hover.addEventListener("error",()=>{hover.src=normal.src;hover.style.filter="brightness(.7)";},{once:true});
  const style=document.createElement("style");style.id="cc-panel-button-styles";
  style.textContent=`
    /* Приподнимаем только внешнюю рамку, содержимое остаётся на месте. */
    #custom-character .cc-canvas > .cc-profile-border {
      inset:auto !important; left:0 !important; top:-1.2% !important;
      width:100% !important; height:101.2% !important;
      object-fit:fill;
    }
    #custom-character .cc-canvas > .cc-separate-panel {
      position:absolute; left:9%; top:64%; width:82%; height:29%;
      display:block; max-width:none; margin:0; padding:0;
      object-fit:fill; z-index:0; pointer-events:none;
    }
    #custom-character .cc-canvas > .cc-base { z-index:-1; }
    #custom-character .cc-secondary:not(.cc-filled) {
      left:71% !important; width:17% !important; height:7% !important;
      overflow:visible !important;
    }
    #custom-character .cc-secondary:not(.cc-filled) > button.cc-upload.cc-image-upload {
      position:absolute !important; inset:0 !important;
      display:grid !important; grid-template-columns:minmax(0,1fr);
      place-items:center; box-sizing:border-box;
      width:100% !important; height:100% !important;
      min-width:0; min-height:0; margin:0 !important; padding:0 !important;
      border:0 !important; border-radius:0;
      background:transparent !important; box-shadow:none !important;
      line-height:0 !important; filter:none !important;
      opacity:1 !important; transform:none !important; cursor:pointer;
    }
    #custom-character .cc-secondary:not(.cc-filled) > button.cc-image-upload > img {
      grid-area:1/1; display:block !important;
      width:100% !important; height:100% !important;
      max-width:100%; max-height:100%; margin:0; padding:0;
      object-fit:contain; pointer-events:none;
    }
    #custom-character .cc-secondary .cc-image-upload > .cc-normal { opacity:1; }
    #custom-character .cc-secondary .cc-image-upload > .cc-hover { opacity:0; }
    @media(hover:hover) {
      #custom-character .cc-secondary .cc-image-upload:hover > .cc-normal { opacity:0; }
      #custom-character .cc-secondary .cc-image-upload:hover > .cc-hover { opacity:1; }
    }
    #custom-character .cc-secondary .cc-image-upload:active > .cc-normal,
    #custom-character .cc-secondary .cc-image-upload:focus-visible > .cc-normal { opacity:0; }
    #custom-character .cc-secondary .cc-image-upload:active > .cc-hover,
    #custom-character .cc-secondary .cc-image-upload:focus-visible > .cc-hover { opacity:1; }
    #custom-character .cc-secondary.cc-filled > button.cc-image-upload { display:none !important; }
  `;
  document.head.append(style);
  function align(){
    if(secondary.classList.contains("cc-filled")){secondary.style.removeProperty("top");return;}
    const last=fields.querySelector("input:last-child");if(!last)return;
    const cr=canvas.getBoundingClientRect();const lr=last.getBoundingClientRect();
    if(!cr.height || !cr.width || !lr.height)return;
    const height=secondary.getBoundingClientRect().height;
    secondary.style.setProperty("top",`${(lr.bottom-cr.top-height)/cr.height*100}%`,"important");
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;align();});}
  const photo=secondary.querySelector(".cc-secondary-photo");
  if(photo)new MutationObserver(schedule).observe(photo,{attributes:true,attributeFilter:["hidden","src"]});
  if("ResizeObserver"in window){const o=new ResizeObserver(schedule);o.observe(canvas);o.observe(fields);}
  normal.addEventListener("load",schedule);
  window.addEventListener("resize",schedule);window.addEventListener("hashchange",schedule);
  if(document.fonts?.ready)document.fonts.ready.then(schedule);
  schedule();
})();
