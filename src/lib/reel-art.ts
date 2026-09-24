/** Original code-drawn casino insignia; independent of platform suit fonts. */
const INKS = ["#ef4354", "#efb62f", "#367eea", "#25a77a"];
const TAU = Math.PI * 2;
function polygon(ctx: CanvasRenderingContext2D, points: number[][], fill: string) {
  ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  polygon(ctx, [[x, y-r], [x+r*.22,y-r*.22], [x+r,y], [x+r*.22,y+r*.22], [x,y+r], [x-r*.22,y+r*.22], [x-r,y], [x-r*.22,y-r*.22]], "#b78b42");
}
function suitPath(i: number) {
  const p = new Path2D();
  if (i === 0) {
    p.moveTo(0, 68); p.bezierCurveTo(-24, 42, -75, 11, -71, -24);
    p.bezierCurveTo(-67,-66,-20,-72,0,-40); p.bezierCurveTo(20,-72,67,-66,71,-24);
    p.bezierCurveTo(75,11,24,42,0,68);
  } else if (i === 1) {
    p.moveTo(0,-79); p.lineTo(73,-12); p.lineTo(0,79); p.lineTo(-73,-12);
  } else if (i === 2) {
    p.moveTo(0,-78); p.bezierCurveTo(-22,-51,-69,-19,-69,14);
    p.bezierCurveTo(-69,52,-26,62,-10,30); p.quadraticCurveTo(-11,61,-30,73);
    p.lineTo(30,73); p.quadraticCurveTo(11,61,10,30); p.bezierCurveTo(26,62,69,52,69,14);
    p.bezierCurveTo(69,-19,22,-51,0,-78);
  } else {
    p.moveTo(-11,25); p.bezierCurveTo(-82,58,-91,-36,-33,-26);
    p.bezierCurveTo(-72,-100,72,-100,33,-26); p.bezierCurveTo(91,-36,82,58,11,25);
    p.quadraticCurveTo(11,56,31,73); p.lineTo(-31,73); p.quadraticCurveTo(-11,56,-11,25);
  }
  p.closePath(); return p;
}

export function drawReelEmblem(ctx: CanvasRenderingContext2D, index: number) {
  const color = INKS[index];
  const paper = ctx.createLinearGradient(0,0,0,288);
  paper.addColorStop(0,"#d6c09b"); paper.addColorStop(.12,"#fffaf0"); paper.addColorStop(.8,"#f6eddb"); paper.addColorStop(1,"#ceaf77");
  ctx.fillStyle=paper; ctx.fillRect(0,0,512,288);
  // Concentric rounded inlays with engraved corner fans and a coloured enamel key.
  for (const [inset,stroke,width] of [[10,"#947044",3],[17,"#fffdf1",2],[25,"#c3a87d",1]] as const) {
    ctx.beginPath(); ctx.roundRect(inset,inset,512-inset*2,288-inset*2,23-inset*.25);
    ctx.strokeStyle=stroke; ctx.lineWidth=width; ctx.stroke();
  }
  for (const side of [-1,1]) {
    ctx.save(); ctx.translate(256+side*210,144); ctx.scale(side,1);
    ctx.strokeStyle="#baa177"; ctx.lineWidth=1.5;
    for (let k=0;k<3;k++) { ctx.beginPath(); ctx.moveTo(-8-k*8,-96); ctx.lineTo(-8-k*8,-66); ctx.quadraticCurveTo(-8-k*8,-42,-37-k*6,-30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8-k*8,96); ctx.lineTo(-8-k*8,66); ctx.quadraticCurveTo(-8-k*8,42,-37-k*6,30); ctx.stroke(); }
    ctx.fillStyle=color; ctx.beginPath(); ctx.roundRect(-9,-15,7,30,3); ctx.fill(); ctx.restore();
  }
  ctx.save(); ctx.translate(256,145); ctx.scale(1.1,1.1);
  // A restrained guilloche sunburst sets the metal silhouette apart from the diffuser.
  ctx.strokeStyle="#d8c4a0"; ctx.lineWidth=1;
  for (let k=0;k<48;k++) { const a=k/48*TAU, r=k%4===0?107:113; ctx.beginPath(); ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r); ctx.lineTo(Math.cos(a)*123,Math.sin(a)*123); ctx.stroke(); }
  if(index===0) {
    for(const side of [-1,1]) {
      ctx.save(); ctx.scale(side,1);
      const wing = new Path2D("M 47 -19 C 80 -22 107 -48 140 -57 C 137 -33 123 -19 100 -9 L 130 -21 C 125 -2 108 10 88 11 L 113 10 C 101 31 74 34 51 20 Z");
      const g=ctx.createLinearGradient(65,-45,92,33); g.addColorStop(0,"#ffffff");g.addColorStop(.6,"#f3dbab");g.addColorStop(1,"#b68b45");
      ctx.fillStyle=g;ctx.strokeStyle="#a7773d";ctx.lineWidth=2.5;ctx.fill(wing);ctx.stroke(wing);ctx.restore();
    }
  }
  const path=suitPath(index);
  ctx.save(); ctx.translate(0,7); ctx.shadowColor="#62401f60";ctx.shadowBlur=10;ctx.shadowOffsetY=6;
  ctx.fillStyle="#79532e";ctx.fill(path);ctx.restore();
  ctx.lineJoin="round";ctx.strokeStyle="#98703c";ctx.lineWidth=12;ctx.stroke(path);
  ctx.strokeStyle="#ffe7a5";ctx.lineWidth=7;ctx.stroke(path);
  const enamel=ctx.createLinearGradient(-42,-72,55,80);
  enamel.addColorStop(0,["#ff808b","#fff3ad","#8bc3ff","#81e4b5"][index]);enamel.addColorStop(.38,color);enamel.addColorStop(1,["#aa153b","#af6a0c","#183d9f","#08614d"][index]);
  ctx.fillStyle=enamel;ctx.fill(path);
  ctx.save();ctx.clip(path);
  if(index===1) {
    polygon(ctx,[[0,-77],[-27,-13],[0,76],[28,-13]],"#ffd665");
    polygon(ctx,[[-71,-12],[-27,-13],[0,-77]],"#fff3be");
    polygon(ctx,[[28,-13],[71,-12],[0,76]],"#ca811c");
    ctx.strokeStyle="#fff0a9";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-70,-12);ctx.lineTo(71,-12);ctx.moveTo(0,-77);ctx.lineTo(-27,-13);ctx.lineTo(0,76);ctx.lineTo(28,-13);ctx.closePath();ctx.stroke();
  } else {
    const shine=ctx.createLinearGradient(0,-60,0,7);shine.addColorStop(0,"#ffffff60");shine.addColorStop(1,"#ffffff00");
    ctx.fillStyle=shine;ctx.beginPath();ctx.ellipse(-16,-37,63,32,-.28,0,TAU);ctx.fill();
  }
  ctx.restore();
  if(index===2) {
    polygon(ctx,[[-43,-65],[-51,-94],[-21,-84],[0,-108],[21,-84],[51,-94],[43,-65]],"#a97c38");
    polygon(ctx,[[-39,-70],[-44,-87],[-20,-78],[0,-99],[20,-78],[44,-87],[39,-70]],"#ffe5a0");
    ctx.fillStyle="#367eea";ctx.beginPath();ctx.arc(0,-80,5,0,TAU);ctx.fill();
  }
  if(index===3) {
    ctx.strokeStyle="#ffe4a1";ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(0,0,18,12,-.3,0,TAU);ctx.stroke();
    ctx.strokeStyle="#806137";ctx.lineWidth=1.5;ctx.stroke();
  }
  sparkle(ctx,-112,index===0?43:-65,11);sparkle(ctx,113,index===0?45:53,15);
  ctx.restore();
}
