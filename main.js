import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

// Reality Debugger — Glitch City V1. All 3D content is procedurally generated.
const $ = id => document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const keys = new Set();
const canvas=$('world');
const renderer=new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene();scene.background=new THREE.Color('#2a3445');scene.fog=new THREE.FogExp2('#2a3445',.0065);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,600);
camera.position.set(0,7,86);
const hemi=new THREE.HemisphereLight(0xa9d1e5,0x3a3331,2.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffc69a,3.1);sun.position.set(-70,108,-100);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-125;sun.shadow.camera.right=125;sun.shadow.camera.top=125;sun.shadow.camera.bottom=-125;sun.shadow.camera.near=1;sun.shadow.camera.far=310;sun.shadow.bias=-.0005;scene.add(sun);
const fillLight=new THREE.DirectionalLight(0x6c9fe2,1.1);fillLight.position.set(55,45,70);scene.add(fillLight);
// Tiny procedural asphalt surface texture makes the streets read as asphalt instead of flat cubes.
function makeAsphaltTexture(){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');const data=ctx.createImageData(256,256);for(let i=0;i<data.data.length;i+=4){const n=Math.round(95+(Math.random()-.5)*41);data.data[i]=n;data.data[i+1]=n+3;data.data[i+2]=n+7;data.data[i+3]=255}ctx.putImageData(data,0,0);ctx.globalAlpha=.12;for(let k=0;k<22;k++){ctx.beginPath();ctx.strokeStyle=k%3?'#b4b5ac':'#232d33';ctx.lineWidth=.3+Math.random()*1.5;const x=Math.random()*256,y=Math.random()*256;ctx.moveTo(x,y);ctx.lineTo(x+Math.random()*28-14,y+Math.random()*23-12);ctx.stroke()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);t.colorSpace=THREE.SRGBColorSpace;return t}
const asphalt=new THREE.MeshStandardMaterial({color:0x637078,map:makeAsphaltTexture(),roughness:.95,metalness:.02});
const concrete=new THREE.MeshStandardMaterial({color:0x67737a,roughness:.91});
const concreteLight=new THREE.MeshStandardMaterial({color:0x88949b,roughness:.88});
const lane=new THREE.MeshStandardMaterial({color:0xd1c9a6,roughness:.9,emissive:0x393125,emissiveIntensity:.1});
const cyanMat=new THREE.MeshBasicMaterial({color:0x58f2ff});
const amberMat=new THREE.MeshBasicMaterial({color:0xffaa73});
const blackMat=new THREE.MeshStandardMaterial({color:0x121c24,metalness:.3,roughness:.65});
let seed=155;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}const pick=a=>a[Math.floor(rand()*a.length)];
const v=(x,y,z)=>new THREE.Vector3(x,y,z);
const world=new THREE.Group();scene.add(world);
const decorative=new THREE.Group();world.add(decorative);
const collisionBoxes=[];
function box(w,h,d,material,x,y,z,parent=world,shadow=true){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=shadow;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function plane(w,h,material,x,y,z,parent=world){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh}
function cyl(radiusTop,radiusBottom,height,material,x,y,z,parent=world,segments=10){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,height,segments),material);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh}
function glowSprite(color,size,x,y,z,parent=world){const c=document.createElement('canvas');c.width=c.height=96;const context=c.getContext('2d');const grad=context.createRadialGradient(48,48,3,48,48,48);const cc=new THREE.Color(color);grad.addColorStop(0,`rgba(${Math.round(cc.r*255)},${Math.round(cc.g*255)},${Math.round(cc.b*255)},.95)`);grad.addColorStop(.18,`rgba(${Math.round(cc.r*255)},${Math.round(cc.g*255)},${Math.round(cc.b*255)},.3)`);grad.addColorStop(1,'rgba(0,0,0,0)');context.fillStyle=grad;context.fillRect(0,0,96,96);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.position.set(x,y,z);sprite.scale.set(size,size,size);parent.add(sprite);return sprite}
// World ground, roads and pedestrian infrastructure
plane(420,420,new THREE.MeshStandardMaterial({color:0x48564f,roughness:1}),0,-.22,0);
const roads=[{dir:'z',axis:0},{dir:'x',axis:0},{dir:'z',axis:-100},{dir:'z',axis:100},{dir:'x',axis:-100},{dir:'x',axis:100}];
for(const road of roads){if(road.dir==='z')plane(21,410,asphalt,road.axis,-.09,0);else plane(410,21,asphalt,0,-.08,road.axis)}
// Slight shoulder and strips; sidewalk around main roads
for(const z of [-150,-125,-75,-50,-26,26,50,75,125,150]){
 for(const x of [-75,-50,-26,26,50,75]){
   if(Math.abs(x)<25||Math.abs(z)<25)continue;
 }
}
for(const side of [-1,1]){
 for(const axis of [0,-100,100]){
  const off=axis+side*12.1;
  box(3,.34,204,concrete,off,.03,0,world,false);
  box(204,.34,3,concrete,0,.04,off,world,false);
  for(let z=-185;z<190;z+=12){if(Math.abs(z)<12||Math.abs(z-100)<12||Math.abs(z+100)<12)continue;plane(.15,4.5,lane,axis+side*2.7,-.065,z)}
  for(let x=-185;x<190;x+=12){if(Math.abs(x)<12||Math.abs(x-100)<12||Math.abs(x+100)<12)continue;plane(4.5,.15,lane,x,-.063,axis+side*2.7)}
 }
}
for(const z of [0,-100,100])for(const x of [0,-100,100]){
 for(let k=-7;k<=7;k++){
  plane(1.25,3.2,concreteLight,x+k*2.5,.0,z-14.4);
  plane(3.2,1.25,concreteLight,x-14.4,.0,z+k*2.5);
 }
}
const glassMats=[new THREE.MeshStandardMaterial({color:0x82b6c6,metalness:.5,roughness:.27,emissive:0x574c40,emissiveIntensity:.42}),new THREE.MeshStandardMaterial({color:0xd5b78e,metalness:.5,roughness:.27,emissive:0x775d37,emissiveIntensity:.4}),new THREE.MeshStandardMaterial({color:0x9daeb3,metalness:.5,roughness:.27,emissive:0x4e626c,emissiveIntensity:.36}),new THREE.MeshStandardMaterial({color:0x253544,metalness:.5,roughness:.27,emissive:0x020c16,emissiveIntensity:.04})];function windowMat(lit){return lit?glassMats[Math.floor(rand()*3)]:glassMats[3]}
const wallColors=[0x5c656d,0x7b7e81,0x444e58,0x746d67,0x899096,0x535f65,0x596775,0x857c71];
function building(x,z,w=22,d=20,h=33,glitch=false){const group=new THREE.Group();group.position.set(x,0,z);world.add(group);
 const col=new THREE.MeshStandardMaterial({color:pick(wallColors),roughness:.73,metalness:.06});
 const trim=new THREE.MeshStandardMaterial({color:0x2d3841,metalness:.55,roughness:.4});
 box(w,h,d,col,0,h/2,0,group);
 box(w+.5,.7,d+.5,trim,0,h+.2,0,group);
 // windows use front-facing sets, bands and parapet
 const floors=Math.floor(h/4.0), columns=Math.max(2,Math.floor(w/3.25));
 for(let floor=1;floor<floors;floor++){
  let yy=floor*4-1.2;
  box(w+.14,.15,d+.14,trim,0,yy+1.4,0,group,false);
  for(let i=0;i<columns;i++){
   let xx=-w/2+(i+.5)*w/columns,lit=rand()>.38;
   box(w/columns*.68,2.4,.09,windowMat(lit),xx,yy,d/2+.065,group,false);
   box(w/columns*.68,2.4,.09,windowMat(rand()>.50),xx,yy,-d/2-.065,group,false);
  }
  for(let i=0;i<Math.floor(d/3.3);i++){
   const zz=-d/2+(i+.5)*d/Math.floor(d/3.3);
   box(.09,2.2,d/Math.floor(d/3.3)*.65,windowMat(rand()>.55),w/2+.06,yy,zz,group,false);
  }
 }
 box(Math.min(8,w*.43),2.6,.1,new THREE.MeshStandardMaterial({color:0x0a1d29,emissive:0x17405b,emissiveIntensity:.5}),0,1.6,d/2+.14,group,false);
 // Unique, locally drawn storefront sign — readable at street level with no external textures.
 if(rand()>.38){const signNames=['NOVA','ATLAS','CAFE 07','MOTION','DISTRICT','STUDIO','NEON','URBAN','PULSE','MARKET'];const sign=pick(signNames);const c=document.createElement('canvas');c.width=384;c.height=80;const tx=c.getContext('2d');tx.fillStyle='#122431';tx.fillRect(0,0,384,80);tx.strokeStyle='#5ec9c8';tx.lineWidth=4;tx.strokeRect(2,2,380,76);tx.fillStyle='#a9eced';tx.font='bold 44px Arial';tx.textAlign='center';tx.textBaseline='middle';tx.fillText(sign,192,42);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:tex});box(Math.min(8,w*.46),1.3,.12,m,0,4,d/2+.17,group,false)}
 if(rand()>.5){box(w*.45,.7,2.3,trim,-w*.2,h+.9,-d*.15,group);box(1.2,3.5,1.2,trim,w*.25,h+2.1,d*.25,group)}
 collisionBoxes.push({x,z,w:w/2+1,d:d/2+1});return group;
}
// Create a visually varied street grid; special glitch building installed separately.
for(const x of [-161,-136,-70,-43,42,70,137,162])for(const z of [-157,-128,-70,-42,42,70,127,160]){
 if(Math.abs(x)>130||Math.abs(z)>130)continue;
 if(x===42 && z===-42)continue;
 if((Math.abs(x)+Math.abs(z))%3===0&&rand()<.2)continue;
 building(x,z,17+rand()*6,17+rand()*6,17+rand()*44);
}
// Populate skyline beyond playable area, cost controlled
for(let i=0;i<75;i++){let angle=rand()*Math.PI*2;let r=150+rand()*95;let x=Math.sin(angle)*r,z=Math.cos(angle)*r;let h=25+rand()*90;box(13+rand()*15,h,13+rand()*15,new THREE.MeshStandardMaterial({color:pick(wallColors),roughness:.8}),x,h/2,z,decorative,false)}
function tree(x,z){const trunk=new THREE.MeshStandardMaterial({color:0x43372c,roughness:1});const leaves=new THREE.MeshStandardMaterial({color:pick([0x31594b,0x476651,0x3b6655,0x36534b]),roughness:1});cyl(.17,.26,3.8,trunk,x,2,z);for(let i=0;i<3;i++){const s=new THREE.Mesh(new THREE.IcosahedronGeometry(1.85-i*.35,1),leaves);s.position.set(x+(i%2)*.35,4.2+i*.8,z);s.castShadow=true;world.add(s)}}
function lamp(x,z){const mast=new THREE.MeshStandardMaterial({color:0x28363d,metalness:.63,roughness:.45});cyl(.10,.15,8,mast,x,4,z);box(2.0,.2,.4,mast,x+.83,8,z);box(.8,.1,.36,new THREE.MeshBasicMaterial({color:0xffddae}),x+1.5,7.86,z);const l=new THREE.PointLight(0xffd1a0,3.2,19,2);l.position.set(x+1.5,7.3,z);world.add(l);glowSprite('#ffdca8',3.5,x+1.5,7.9,z)}
for(let z=-84;z<=84;z+=27){if(Math.abs(z)<16)continue;for(const s of [-1,1]){tree(s*16,z+8);if(Math.abs(z)%2<1)lamp(s*13.9,z-5)}}
for(let x=-84;x<=84;x+=27){if(Math.abs(x)<16)continue;for(const s of [-1,1]){tree(x+8,s*16);if(Math.abs(x)%2<1)lamp(x-5,s*13.9)}}
function makeCar(parent,bodyColor=0xb4c2cb){const car=new THREE.Group();parent.add(car);const paint=new THREE.MeshStandardMaterial({color:bodyColor,metalness:.65,roughness:.28});const glass=new THREE.MeshStandardMaterial({color:0x1b2b3c,metalness:.35,roughness:.14});const tire=new THREE.MeshStandardMaterial({color:0x0b1015,roughness:1});const head=new THREE.MeshStandardMaterial({color:0xffe2b4,emissive:0xffd4a4,emissiveIntensity:1.25});const red=new THREE.MeshStandardMaterial({color:0xf04e5f,emissive:0xca1f2b,emissiveIntensity:1.1});box(2.4,.95,4.6,paint,0,.78,0,car);box(2.07,.82,2.38,glass,0,1.53,-.25,car);box(2.05,.13,2.25,paint,0,1.95,-.25,car);for(const s of [-1,1])for(const q of [-1,1]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.24,12),tire);wheel.rotation.z=Math.PI/2;wheel.position.set(s*1.17,.48,q*1.42);wheel.castShadow=true;car.add(wheel)}for(const s of [-1,1]){box(.5,.21,.08,head,s*.75,.9,-2.35,car,false);box(.5,.21,.08,red,s*.75,.9,2.35,car,false)}return car}
const parked=[];for(let k=0;k<12;k++){let zz=pick([-74,-60,-48,46,64,78]);let side=pick([-1,1]);let car=makeCar(world,pick([0x818e99,0xdccdbc,0x405968,0x9a6c65,0xc7c5b9]));car.position.set(side*7.2,.1,zz+(rand()-.5)*6);if(rand()>.6)car.rotation.y=Math.PI;parked.push(car)}
const trafficCars=[];for(let k=0;k<5;k++){const car=makeCar(world,pick([0x586e88,0xb0aeac,0x9c9b88]));car.position.set(k%2?5.5:-5.5,.2,-140+k*55);car.rotation.y=k%2?Math.PI:0;trafficCars.push({car,speed:3+rand()*3,sign:k%2?1:-1})}
// Player character: fully 3D procedural third-person avatar.
const playerRoot=new THREE.Group();world.add(playerRoot);playerRoot.position.set(0,.08,83);
const jacket=new THREE.MeshStandardMaterial({color:0x183a4c,roughness:.74,metalness:.1});const jeans=new THREE.MeshStandardMaterial({color:0x192631,roughness:1});const skin=new THREE.MeshStandardMaterial({color:0xc39474,roughness:1});const luminous=new THREE.MeshStandardMaterial({color:0x58d6eb,emissive:0x37b8ce,emissiveIntensity:.75});
const playerBody=new THREE.Group();playerRoot.add(playerBody);box(.86,1.35,.43,jacket,0,1.75,0,playerBody);box(.8,.13,.46,luminous,0,2.35,.01,playerBody);const head=new THREE.Mesh(new THREE.SphereGeometry(.37,12,10),skin);head.position.y=2.74;playerBody.add(head);box(.84,.18,.48,blackMat,0,3,.03,playerBody);const legs=[],arms=[];for(const s of [-1,1]){const leg=new THREE.Group();leg.position.set(s*.24,1.1,0);playerBody.add(leg);box(.32,.95,.34,jeans,0,-.5,0,leg);box(.37,.18,.59,blackMat,0,-.96,-.11,leg);legs.push(leg);const arm=new THREE.Group();arm.position.set(s*.56,2.25,0);playerBody.add(arm);box(.25,.9,.28,jacket,0,-.5,0,arm);box(.27,.18,.27,skin,0,-.99,0,arm);arms.push(arm)}
const playerMarker=glowSprite('#a1e9ff',2,0,3.7,83,playerRoot);playerMarker.position.set(0,3.7,0);
// Glitch 1 — airborne car; its world transform physically changes as the repair progresses.
const glitchCarRoot=new THREE.Group();glitchCarRoot.position.set(0,12,31);world.add(glitchCarRoot);const glitchCar=makeCar(glitchCarRoot,0xefb873);glitchCar.rotation.set(.08,0,.14);
const carHalo=new THREE.PointLight(0xff7caa,4.5,23);carHalo.position.set(0,9,31);world.add(carHalo);const carAura=glowSprite('#fc72ac',11,0,11,31,world);
// Glitch 2 — doubled building phantom tower that progressively collapses.
const buildingBase=building(42,-42,21,20,34,true);
const phantoms=new THREE.Group();phantoms.position.set(42,0,-42);world.add(phantoms);const ghostMat=new THREE.MeshStandardMaterial({color:0x9e75ff,transparent:true,opacity:.28,emissive:0x7a3bdf,emissiveIntensity:.5,metalness:.12,roughness:.35,depthWrite:false});
for(let k=0;k<5;k++){const g=box(21,9,20,ghostMat,0,37+k*9,0,phantoms,false);g.userData.restY=37+k*9}const buildingHalo=new THREE.PointLight(0xa675ff,3.5,35);buildingHalo.position.set(42,30,-42);world.add(buildingHalo);
// Glitch 3 — genuinely dislocated street slabs, not merely a progress number.
const roadCrack=new THREE.Group();roadCrack.position.set(0,0,-62);world.add(roadCrack);const patchMat=new THREE.MeshStandardMaterial({color:0x43505b,metalness:.06,roughness:.8,side:THREE.DoubleSide});const patchA=box(9,.37,10,patchMat,-4.5,.4,0,roadCrack);patchA.rotation.z=.26;patchA.rotation.x=.11;const patchB=box(9,.37,10,patchMat,4.5,-.18,0,roadCrack);patchB.rotation.z=-.23;patchB.rotation.x=-.12;const crackMat=new THREE.MeshBasicMaterial({color:0x58e5ff,transparent:true,opacity:.95,depthWrite:false});const crackLine=box(.22,.09,10.6,crackMat,0,.32,0,roadCrack,false);const roadAura=glowSprite('#5cddff',7,0,2,-62,world);
const anomalies=[
 {id:'car',name:'REVERSE GRAVITY',short:'Airborne vehicle',pos:v(0,0,31),description:'Physics is inverted. Grab the gravity core and pull it DOWN into its ground anchor.',done:false,progress:0,icon:'◈',color:0xffa86b,core:v(0,13.5,31),anchor:v(0,2.1,31)},
 {id:'building',name:'INFINITE REPLICATION',short:'Duplicating building',pos:v(42,0,-42),description:'A building is cloning itself endlessly. Grab the purple core and pull it DOWN to collapse the duplicates.',done:false,progress:0,icon:'▧',color:0xb688ff,core:v(42,54,-31),anchor:v(42,28,-31)},
 {id:'road',name:'FRACTURED ROAD',short:'Torn road geometry',pos:v(0,0,-62),description:'The street is split across dimensions. Drag the core horizontally RIGHT to stitch the road back together.',done:false,progress:0,icon:'⌁',color:0x72e5ff,core:v(-8,2,-62),anchor:v(8,2,-62)}
];
const anomalyFx=[];
for(const a of anomalies){const group=new THREE.Group();group.position.copy(a.pos);world.add(group);const ring=new THREE.Mesh(new THREE.TorusGeometry(5,.12,8,52),new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.78}));ring.rotation.x=Math.PI/2;ring.position.y=.32;group.add(ring);const inner=new THREE.Mesh(new THREE.TorusGeometry(3.3,.09,6,50),new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.57}));inner.rotation.x=Math.PI/2;inner.position.y=.36;group.add(inner);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.10,.10,18,10),new THREE.MeshBasicMaterial({color:a.color,transparent:true,opacity:.2,depthWrite:false}));beam.position.y=9;group.add(beam);const sphere=new THREE.Mesh(new THREE.IcosahedronGeometry(.6,1),new THREE.MeshBasicMaterial({color:a.color,wireframe:true}));sphere.position.y=4;group.add(sphere);glowSprite('#ffad78',4,0,4,0,group);anomalyFx.push({group,ring,inner,beam,sphere})}
const pulseLight=new THREE.PointLight(0x60cafa,4,26,2);pulseLight.position.set(0,9,-62);world.add(pulseLight);
const particles=[];
function burst(pos,color){for(let i=0;i<36;i++){let m=new THREE.Mesh(new THREE.IcosahedronGeometry(.09+rand()*.2,0),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));m.position.copy(pos).add(v((rand()-.5)*5,2+rand()*4,(rand()-.5)*5));world.add(m);particles.push({mesh:m,vel:v((rand()-.5)*9,rand()*9,(rand()-.5)*9),life:1.25})}}
// ---------------------------------------------------------------------------
// Game state and input: real physics-state changes, not canned percentage UI.
// ---------------------------------------------------------------------------
let started=false,mode='explore',focus=null,walking=0,playerYaw=0,cameraYaw=0,moveForward=0,moveTurn=0,debugPose=0;
const targetLook=new THREE.Vector3(0,2.6,0),lastLook=new THREE.Vector3(0,2.6,66);
let drag=null,heldGestureTime=0,exitGestureTime=0,lastToggle=0,notifyTimer;
const hand={stream:null,detector:null,active:false,lastFrame:0,found:false,lostAt:0,gesture:'NO HAND',palmX:.5,palmY:.5,calX:.5,calY:.5,calibrated:false,calSamples:0,stableXs:[],stableYs:[],pinched:false,pinchPrev:false,sensitivity:1,reticleX:innerWidth/2,reticleY:innerHeight/2,lastDetection:0};
const handCursor=document.createElement('div');handCursor.style.cssText='position:absolute;z-index:12;width:25px;height:25px;border:2px solid #76f3e7;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 18px #69f4e6;pointer-events:none;display:none;transition:width .1s,height .1s;';$('app').appendChild(handCursor);
function toast(message,time=2100){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>el.classList.remove('visible'),time)}
function updateIntegrity(){const count=anomalies.filter(a=>a.done).length;$('integrityFill').style.width=(count/3*100)+'%';$('integrityText').textContent=`${count} / 3 ANOMALIES RESOLVED`;if(count===3){setTimeout(()=>{$('victory').classList.remove('hidden')},1900)}}
function nearestAnomaly(){let best=null,dist=Infinity;for(const a of anomalies){if(a.done)continue;const d=Math.hypot(playerRoot.position.x-a.pos.x,playerRoot.position.z-a.pos.z);if(d<dist){best=a;dist=d}}return {a:best,d:dist}}
function enterDebug(){if(mode==='debug')return;const {a,d}=nearestAnomaly();if(!a){toast('ALL ANOMALIES RESOLVED');return}if(d>29){toast(`MOVE CLOSER TO ANOMALY — ${Math.round(d)}m AWAY`);return}focus=a;mode='debug';drag=null;moveForward=0;moveTurn=0;$('floatingNodes').classList.remove('hidden');$('debugReadout').classList.remove('hidden');$('modePill').classList.add('debug');$('modeName').textContent='REALITY DEBUG MODE';$('app').classList.add('debug');$('glitchTitle').textContent=a.name;$('glitchDescription').textContent=a.description;$('repairPercent').textContent='0%';$('repairFill').style.width='0%';$('objective').classList.add('hidden');lastToggle=performance.now();toast('REALITY INTERFACE ENGAGED',1300)}
function exitDebug(){if(mode==='explore')return;mode='explore';focus=null;drag=null;moveForward=moveTurn=0;$('floatingNodes').classList.add('hidden');$('debugReadout').classList.add('hidden');$('modePill').classList.remove('debug');$('modeName').textContent='EXPLORE MODE';$('app').classList.remove('debug');$('objective').classList.remove('hidden');lastToggle=performance.now();toast('BACK IN EXPLORE MODE',1100)}
function toggleDebug(){if(mode==='debug')exitDebug();else enterDebug()}
function setRepairProgress(value){if(!focus||focus.done)return;focus.progress=clamp(value,0,1);applyRepairVisuals(focus);$('repairPercent').textContent=Math.round(focus.progress*100)+'%';$('repairFill').style.width=Math.round(focus.progress*100)+'%'}
function applyRepairVisuals(a){const p=a.progress;
 if(a.id==='car'){glitchCarRoot.position.y=lerp(12,.12,p);glitchCar.rotation.z=.14*(1-p);glitchCar.rotation.x=.08*(1-p);carHalo.intensity=4.5*(1-p);carAura.material.opacity=1-p;}
 if(a.id==='building'){phantoms.scale.y=Math.max(.0001,1-p);phantoms.visible=p<.999;buildingHalo.intensity=3.5*(1-p)}
 if(a.id==='road'){patchA.rotation.z=.26*(1-p);patchA.rotation.x=.11*(1-p);patchA.position.y=lerp(.4,.15,p);patchB.rotation.z=-.23*(1-p);patchB.rotation.x=-.12*(1-p);patchB.position.y=lerp(-.18,.15,p);crackMat.opacity=(1-p)*.95;pulseLight.intensity=4*(1-p);roadAura.material.opacity=1-p}
}
function finishRepair(){if(!focus||focus.done)return;const repaired=focus;repaired.progress=1;applyRepairVisuals(repaired);repaired.done=true;const idx=anomalies.indexOf(repaired);anomalyFx[idx].group.visible=false;burst(repaired.pos,repaired.color);updateIntegrity();toast(`${repaired.short.toUpperCase()} — REALITY RESTORED`,2400);setTimeout(()=>{if(mode==='debug'&&focus===repaired)exitDebug()},1100)}
function project(pt){const o=pt.clone().project(camera);return {x:(o.x+1)/2*innerWidth,y:(1-o.y)/2*innerHeight,behind:o.z>1}}
let nodeStart={x:0,y:0},nodeEnd={x:0,y:0};
function positionDebugNodes(){if(mode!=='debug'||!focus)return;const a=focus;const core=project(a.core),anchor=project(a.anchor);nodeStart=core;nodeEnd=anchor;const el=$('coreNode'),end=$('anchorNode'),line=$('debugLink');
 if(!drag){el.style.left=core.x+'px';el.style.top=core.y+'px'}end.style.left=anchor.x+'px';end.style.top=anchor.y+'px';const start=drag?{x:drag.x,y:drag.y}:core;const dx=anchor.x-start.x,dy=anchor.y-start.y;line.style.left=start.x+'px';line.style.top=start.y+'px';line.style.width=Math.hypot(dx,dy)+'px';line.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
 el.querySelector('small').textContent=a.id==='road'?'STITCH POINT':'GRAB CORE';end.querySelector('small').textContent=a.id==='road'?'STITCH END':'DROP HERE';
}
function beginDrag(x,y,force=false){if(mode!=='debug'||!focus||focus.done)return false;if(!force&&Math.hypot(x-nodeStart.x,y-nodeStart.y)>94)return false;drag={x,y,fromX:nodeStart.x,fromY:nodeStart.y};setRepairProgress(0);$('coreNode').style.cursor='grabbing';return true}
function moveDrag(x,y){if(!drag||!focus)return;drag.x=x;drag.y=y;$('coreNode').style.left=x+'px';$('coreNode').style.top=y+'px';const dx=nodeEnd.x-drag.fromX,dy=nodeEnd.y-drag.fromY,len2=dx*dx+dy*dy;const p=clamp(((x-drag.fromX)*dx+(y-drag.fromY)*dy)/Math.max(len2,1),0,1);setRepairProgress(p)}
function releaseDrag(){if(!drag)return;const good=Math.hypot(drag.x-nodeEnd.x,drag.y-nodeEnd.y)<Math.max(60,Math.min(85,innerWidth*.1))||focus.progress>.86;drag=null;$('coreNode').style.cursor='grab';if(good){finishRepair()}else{setRepairProgress(0);toast('NOT ALIGNED — DRAG INTO GREEN TARGET',1300)}}
$('coreNode').addEventListener('pointerdown',e=>{if(hand.active&&hand.found&&hand.pinched)return;e.preventDefault();e.stopPropagation();beginDrag(e.clientX,e.clientY,true);$('coreNode').setPointerCapture(e.pointerId)});
$('coreNode').addEventListener('pointermove',e=>{if(drag&&!hand.pinched)moveDrag(e.clientX,e.clientY)});
$('coreNode').addEventListener('pointerup',e=>{if(drag&&!hand.pinched)releaseDrag()});
$('coreNode').addEventListener('pointercancel',()=>{drag=null;setRepairProgress(0)});
window.addEventListener('pointermove',e=>{if(drag&&!hand.pinched&&e.buttons)moveDrag(e.clientX,e.clientY)});
window.addEventListener('pointerup',()=>{if(drag&&!hand.pinched)releaseDrag()});
function resetWorld(){for(const a of anomalies){a.done=false;a.progress=0;applyRepairVisuals(a)}anomalyFx.forEach(f=>f.group.visible=true);particles.forEach(p=>world.remove(p.mesh));particles.length=0;exitDebug();playerRoot.position.set(0,.08,83);playerYaw=0;updateIntegrity();$('victory').classList.add('hidden');toast('SIMULATION RESET — 3 ANOMALIES ACTIVE')}
function activateGame(){started=true;$('startScreen').classList.add('hidden');for(const id of ['topHud','leftHud','rightHud','bottomHud','objective'])$(id).classList.remove('hidden');if(('ontouchstart' in window)||navigator.maxTouchPoints>0)$('touchControls').classList.remove('hidden');toast('FIND THE FIRST GLITCH · MOVE WITH WASD',2700)}
$('startBtn').addEventListener('click',activateGame);$('startCameraBtn').addEventListener('click',async()=>{activateGame();await startCamera()});$('cameraToggle').addEventListener('click',async()=>hand.active?stopCamera():startCamera());$('cameraStopBtn').addEventListener('click',stopCamera);$('calibrateBtn').addEventListener('click',()=>calibrate(true));$('settingsBtn').addEventListener('click',()=>{$('settingsModal').classList.remove('hidden');keys.clear()});$('closeSettings').addEventListener('click',()=>$('settingsModal').classList.add('hidden'));$('quality').addEventListener('change',e=>setGraphics(e.target.value));$('sensitivity').addEventListener('input',e=>{hand.sensitivity=+e.target.value;$('sensText').textContent=hand.sensitivity.toFixed(1)+'×'});$('exitDebug').addEventListener('click',exitDebug);$('resetWorld').addEventListener('click',resetWorld);$('replay').addEventListener('click',resetWorld);$('touchDebug').addEventListener('click',toggleDebug);
function setGraphics(q){renderer.setPixelRatio(Math.min(devicePixelRatio,q==='high'?1.7:q==='medium'?1.25:1));renderer.shadowMap.enabled=q!=='low';renderer.setSize(innerWidth,innerHeight);scene.fog.density=q==='low'?.0045:.0065;toast(`GRAPHICS QUALITY: ${q.toUpperCase()}`,1000)}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(!started)return;if(e.repeat&&e.code==='KeyE')return;keys.add(e.code);if(e.code==='KeyE'&&$('settingsModal').classList.contains('hidden'))toggleDebug();if(e.code==='Escape'){exitDebug();$('settingsModal').classList.add('hidden')}});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
for(const button of document.querySelectorAll('[data-key]')){const k=button.dataset.key;button.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(k);button.setPointerCapture(e.pointerId)});button.addEventListener('pointerup',()=>keys.delete(k));button.addEventListener('pointercancel',()=>keys.delete(k))}
let mouseLooking=false,mouseStart=0;
canvas.addEventListener('pointerdown',e=>{if(e.button===0&&mode==='explore'){mouseLooking=true;mouseStart=e.clientX;canvas.setPointerCapture(e.pointerId)}});
canvas.addEventListener('pointermove',e=>{if(mouseLooking&&mode==='explore'){cameraYaw=clamp(cameraYaw+(e.clientX-mouseStart)*.006,-1,1);mouseStart=e.clientX}});
canvas.addEventListener('pointerup',()=>mouseLooking=false);canvas.addEventListener('pointercancel',()=>mouseLooking=false);
// ---------------------------------------------------------------------------
// On-device MediaPipe hand tracking. No webcam data is transmitted to this app.
// ---------------------------------------------------------------------------
const video=$('cam'),landmarks=$('landmarks'),ctx=landmarks.getContext('2d');
let wasVideoReady=false,mediaLoopActive=false;
async function startCamera(){if(hand.active)return;try{
 if(!navigator.mediaDevices?.getUserMedia){throw new Error('Camera needs HTTPS (or localhost) and a compatible browser.')}
 $('cameraStatus').textContent='LOADING HAND MODEL…';$('trackerLive').textContent='LOADING';
 const module=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');
 const fileset=await module.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');
 let detector;
 try{detector=await module.HandLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.5})}
 catch {detector=await module.HandLandmarker.createFromOptions(fileset,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},runningMode:'VIDEO',numHands:1})}
 const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
 hand.detector=detector;hand.stream=stream;video.srcObject=stream;await video.play();hand.active=true;hand.found=false;hand.calibrated=false;hand.calSamples=0;hand.stableXs=[];hand.stableYs=[];hand.lastDetection=performance.now();
 $('trackerLive').textContent='LIVE';$('trackerLive').classList.add('active');$('cameraToggle').innerHTML='◎ <span>CAMERA LIVE</span>';$('cameraStatus').textContent='Show one hand in the frame';wasVideoReady=true;mediaLoopActive=true;runMediaLoop();toast('CAMERA LIVE — HOLD YOUR PALM CENTERED TO CALIBRATE',2500)
 }catch(e){$('cameraStatus').textContent='TRACKING UNAVAILABLE';$('trackerLive').textContent='ERROR';hand.active=false;toast(`CAMERA: ${e.message||'UNAVAILABLE'} · USE WASD`,4000);console.warn('MediaPipe start failed:',e);try{hand.stream?.getTracks().forEach(t=>t.stop())}catch{}}}
function stopCamera(){mediaLoopActive=false;hand.active=false;hand.found=false;hand.pinched=false;hand.pinchPrev=false;hand.calibrated=false;hand.stream?.getTracks().forEach(t=>t.stop());hand.stream=null;video.srcObject=null;hand.detector?.close?.();hand.detector=null;ctx.clearRect(0,0,landmarks.width,landmarks.height);$('trackerLive').textContent='OFFLINE';$('trackerLive').classList.remove('active');$('cameraToggle').innerHTML='◎ <span>CAMERA OFF</span>';$('cameraStatus').textContent='Camera is off';$('gestureLabel').textContent='NO GESTURE';$('handMeterFill').style.width='0';handCursor.style.display='none';moveForward=moveTurn=0;toast('CAMERA STOPPED',900)}
function calibrate(manual=false){hand.calibrated=false;hand.calSamples=0;hand.stableXs=[];hand.stableYs=[];if(manual)toast('HOLD AN OPEN PALM IN THE CENTER OF THE CAMERA',2000)}
function d2(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function gestureDetails(pts){const wrist=pts[0];const fingers=[8,12,16,20].map((tip,i)=>d2(pts[tip],wrist)>d2(pts[[6,10,14,18][i]],wrist)*1.12);const open=fingers.every(Boolean);const fist=fingers.every(f=>!f);const pointing=fingers[0]&&!fingers[1]&&!fingers[2]&&!fingers[3];const span=Math.max(.045,d2(pts[0],pts[9]));const ratio=d2(pts[4],pts[8])/span;const pinch=ratio<.47&&!fist;return {open,fist,pointing,pinch,span,ratio}}
function runMediaLoop(){if(!mediaLoopActive||!hand.active)return;requestAnimationFrame(runMediaLoop);if(video.readyState<2||!hand.detector)return;let now=performance.now();if(now-hand.lastFrame<45)return;hand.lastFrame=now;try{const result=hand.detector.detectForVideo(video,now);processHands(result,now)}catch(e){console.warn('Camera detection error',e);$('cameraStatus').textContent='Tracking error — use keyboard';hand.found=false;moveForward=moveTurn=0}}
function processHands(result,now){const pts=result.landmarks?.[0];landmarks.width=video.videoWidth||640;landmarks.height=video.videoHeight||480;ctx.clearRect(0,0,landmarks.width,landmarks.height);if(!pts){hand.found=false;hand.pinched=false;hand.pinchPrev=false;hand.gesture='NO HAND';hand.calSamples=0;moveForward=moveTurn=0;$('gestureLabel').textContent='NO HAND';$('cameraStatus').textContent='Move your hand into view';$('handMeterFill').style.width='0';handCursor.style.display='none';heldGestureTime=exitGestureTime=0;return}
 const W=landmarks.width,H=landmarks.height;
 const links=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
 ctx.lineWidth=3;ctx.strokeStyle='#74ffff';ctx.fillStyle='#efffff';for(const [a,b] of links){ctx.beginPath();ctx.moveTo(pts[a].x*W,pts[a].y*H);ctx.lineTo(pts[b].x*W,pts[b].y*H);ctx.stroke()}for(let i=0;i<21;i++){ctx.beginPath();ctx.arc(pts[i].x*W,pts[i].y*H,i===8?6:3.2,0,Math.PI*2);ctx.fill()}
 const g=gestureDetails(pts);const mirror=$('invertHand').checked;const palmX=mirror?1-(pts[0].x+pts[9].x)/2:(pts[0].x+pts[9].x)/2,palmY=(pts[0].y+pts[9].y)/2;hand.palmX=lerp(hand.palmX,palmX,.34);hand.palmY=lerp(hand.palmY,palmY,.34);hand.found=true;hand.lastDetection=now;
 // Robust auto-calibration while a hand is first detected near camera center.
 if(!hand.calibrated){hand.stableXs.push(hand.palmX);hand.stableYs.push(hand.palmY);if(hand.stableXs.length>18){hand.stableXs.shift();hand.stableYs.shift()};hand.calSamples++;$('cameraStatus').textContent=`Calibrating… ${Math.round(Math.min(1,hand.calSamples/24)*100)}%`;if(hand.calSamples>=24){const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;hand.calX=avg(hand.stableXs);hand.calY=avg(hand.stableYs);hand.calibrated=true;toast('PALM CALIBRATED — MOVE TO WALK',1600)}}
 hand.gesture=g.pinch?'PINCH':g.pointing?'POINT':g.fist?'FIST':g.open?'OPEN PALM':'HAND DETECTED';hand.pinched=g.pinch;$('gestureLabel').textContent=hand.gesture;$('cameraStatus').textContent=hand.calibrated?'Tracking locally · Camera active':'Hold still to calibrate';$('handMeterFill').style.width=(g.pinch?'95%':g.open?'72%':'47%');$('trackerModeLabel').textContent=mode==='debug'?'DEBUG MODE':'MOVE MODE';
 const dt=clamp((now-hand.lastDetection+45)/1000,.03,.08);
 if(mode==='explore'){
  if(g.pointing&&!g.pinch){heldGestureTime+=.05;if(heldGestureTime>.78&&now-lastToggle>1500){heldGestureTime=0;enterDebug()}}else heldGestureTime=0;
  if(g.open&&hand.calibrated&&!g.pinch){const dead=.08;const dx=(hand.palmX-hand.calX)*hand.sensitivity,dy=(hand.calY-hand.palmY)*hand.sensitivity;
   const scale=x=>Math.abs(x)<dead?0:Math.sign(x)*clamp((Math.abs(x)-dead)/.27,0,1);
   moveForward=lerp(moveForward,scale(dy),.44);moveTurn=lerp(moveTurn,scale(dx),.44);
  }else{moveForward=moveTurn=0}
  handCursor.style.display='none';
 }else if(mode==='debug'){
  moveForward=moveTurn=0;
  if(g.open&&!g.pinch){exitGestureTime+=.05;if(exitGestureTime>1.1&&now-lastToggle>1400){exitGestureTime=0;exitDebug()}}else exitGestureTime=0;
  const screenX=(mirror?1-pts[8].x:pts[8].x)*innerWidth,screenY=pts[8].y*innerHeight;hand.reticleX=lerp(hand.reticleX,screenX,.45);hand.reticleY=lerp(hand.reticleY,screenY,.45);
  handCursor.style.display='block';handCursor.style.left=hand.reticleX+'px';handCursor.style.top=hand.reticleY+'px';handCursor.style.borderColor=g.pinch?'#ffb77b':'#76f3e7';handCursor.style.width=(g.pinch?33:25)+'px';handCursor.style.height=(g.pinch?33:25)+'px';
  if(g.pinch&&!hand.pinchPrev)beginDrag(hand.reticleX,hand.reticleY);
  if(g.pinch&&drag)moveDrag(hand.reticleX,hand.reticleY);
  if(!g.pinch&&hand.pinchPrev&&drag)releaseDrag();
 }
 hand.pinchPrev=g.pinch;
}
function updateHUD(){const {a,d}=nearestAnomaly();$('coordText').textContent=`GRID ${Math.round(playerRoot.position.x)} / ${Math.round(playerRoot.position.z)}`;if(!a){$('nearby').textContent='✔ ALL INCIDENTS RESOLVED';$('objectiveName').textContent='World restored';$('objectiveHint').textContent='Mission complete.'}else{$('nearby').textContent=`${d<29?'◈ PRESS E TO DEBUG':'◇ NEAREST ANOMALY'} · ${Math.round(d)}m`;$('objectiveName').textContent=a.short;$('objectiveHint').textContent=d<29?'Press E or hold one index finger up to begin debugging.':`Get closer to the amber beacon (${Math.round(d)}m away).`}
 $('mapPlayer').style.left=(50+playerRoot.position.x/1.8)+'%';$('mapPlayer').style.top=(50+playerRoot.position.z/1.8)+'%';$('mapBeacons').innerHTML=anomalies.map(a=>`<span class="map-beacon ${a.done?'done':''}" style="left:${50+a.pos.x/1.8}%;top:${50+a.pos.z/1.8}%" title="${a.short}"></span>`).join('')}
function isWalkable(x,z){if(Math.abs(x)>176||Math.abs(z)>176)return false;for(const b of collisionBoxes){if(Math.abs(x-b.x)<b.w+.45&&Math.abs(z-b.z)<b.d+.45)return false}return true}
const tempCam=new THREE.Vector3();const clock=new THREE.Clock();let elapsed=0,hudTick=0;
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 if(started){
  if(mode==='explore'){
   const kbForward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
   const kbTurn=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
   const f=clamp(kbForward+moveForward,-1,1),t=clamp(kbTurn+moveTurn,-1,1);
   playerYaw+=t*dt*1.6;
   playerRoot.rotation.y=playerYaw;
   const speed=f>0?8.3:5.2;
   const nextX=playerRoot.position.x+Math.sin(playerYaw)*f*speed*dt,nextZ=playerRoot.position.z-Math.cos(playerYaw)*f*speed*dt;
   if(isWalkable(nextX,playerRoot.position.z))playerRoot.position.x=nextX;
   if(isWalkable(playerRoot.position.x,nextZ))playerRoot.position.z=nextZ;
   walking=lerp(walking,Math.abs(f),dt*9);cameraYaw=lerp(cameraYaw,0,dt*.4);
  }else walking=lerp(walking,0,dt*9);
  for(let k=0;k<2;k++){legs[k].rotation.x=Math.sin(elapsed*10+k*Math.PI)*walking*.65;arms[k].rotation.x=Math.sin(elapsed*10+k*Math.PI+Math.PI)*walking*.4}
  playerBody.position.y=Math.sin(elapsed*11)*walking*.05;
 }
 // dynamic traffic, without blocking the anomaly road
 for(const t of trafficCars){t.car.position.z+=t.sign*t.speed*dt;if(t.car.position.z>170)t.car.position.z=-170;if(t.car.position.z< -170)t.car.position.z=170}
 if(!anomalies[0].done&&anomalies[0].progress===0)glitchCarRoot.position.y=12+Math.sin(elapsed*2.2)*.7;
 for(let i=0;i<anomalyFx.length;i++){let f=anomalyFx[i];if(!anomalies[i].done){f.ring.rotation.z+=dt*.3;f.inner.rotation.z-=dt*.4;f.sphere.rotation.y+=dt*1.3;f.sphere.position.y=4+Math.sin(elapsed*2+i)*.6;f.beam.material.opacity=.12+Math.sin(elapsed*2.5+i)*.08}}
 if(!anomalies[1].done){for(const m of phantoms.children){m.position.y=m.userData.restY+Math.sin(elapsed*2+m.userData.restY)*2* (1-anomalies[1].progress)}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.vel.y-=dt*9;p.mesh.position.addScaledVector(p.vel,dt);p.mesh.material.opacity=clamp(p.life/1.25,0,1);if(p.life<=0){world.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();particles.splice(i,1)}}
 if(mode==='debug'&&focus){const height=focus.id==='building'?22:focus.id==='car'?8:3;targetLook.set(focus.pos.x,height,focus.pos.z);tempCam.set(focus.pos.x+18,height+12,focus.pos.z+27);camera.position.lerp(tempCam,clamp(dt*3.8,0,1));lastLook.lerp(targetLook,clamp(dt*4.1,0,1));camera.lookAt(lastLook);positionDebugNodes()}
 else{const dirX=Math.sin(playerYaw+cameraYaw),dirZ=-Math.cos(playerYaw+cameraYaw);const x=playerRoot.position.x-dirX*11,z=playerRoot.position.z-dirZ*11;tempCam.set(x,6.7+walking*.2,z);camera.position.lerp(tempCam,clamp(dt*3,0,1));targetLook.set(playerRoot.position.x,2.4,playerRoot.position.z);lastLook.lerp(targetLook,clamp(dt*4,0,1));camera.lookAt(lastLook)}
 if(elapsed-hudTick>.18){hudTick=elapsed;if(started)updateHUD()}
 renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
window.addEventListener('pagehide',()=>{hand.stream?.getTracks().forEach(t=>t.stop())});
// Display procedural 3D immediately even behind the title screen.
updateIntegrity();updateHUD();animate();
