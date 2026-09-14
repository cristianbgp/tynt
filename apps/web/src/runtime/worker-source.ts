import { MAX_COMMANDS, MAX_FRAME_BYTES, MAX_TEXT_CODE_POINTS } from "./protocol";

export function createWorkerSource(compiledCode: string, token: string): string {
  const prefix = `"use strict";
const __token = ${JSON.stringify(token)};
const __post = self.postMessage.bind(self);
const __listen = self.addEventListener.bind(self);
const __stringify = JSON.stringify.bind(JSON);
const __encoder = new TextEncoder();
const __blocked = ["fetch","XMLHttpRequest","WebSocket","WebTransport","RTCPeerConnection","EventSource","importScripts","Worker","SharedWorker","BroadcastChannel","indexedDB","caches","localStorage","sessionStorage","navigator","postMessage","addEventListener","setTimeout","setInterval","Function","eval"];
for (const __name of __blocked) {
  try { Object.defineProperty(self, __name, { value: undefined, configurable: false, writable: false }); } catch {}
}
const fetch=undefined, XMLHttpRequest=undefined, WebSocket=undefined, WebTransport=undefined, RTCPeerConnection=undefined, EventSource=undefined, importScripts=undefined, Worker=undefined, SharedWorker=undefined, BroadcastChannel=undefined, indexedDB=undefined, caches=undefined, localStorage=undefined, sessionStorage=undefined, navigator=undefined, postMessage=undefined, setTimeout=undefined, setInterval=undefined, Function=undefined;
let __commands = [], __audioEvents = 0;
let __input = { held: [], pressed: [] };
let __phase = "init";
let __cameraX = 0, __cameraY = 0, __frame = 0, __seed = 1;
function __finite(value, name) { if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(name + " must be a finite number"); return value; }
function __color(value) { return __finite(value, "color"); }
function __append(command) { if (__commands.length >= ${MAX_COMMANDS}) throw new Error("Frame exceeds 32,768 drawing commands"); __commands.push(command); }
const clear = Object.freeze((color=0) => __append({op:"clear",color:__color(color)}));
function __x(value,name="x") { return __finite(value,name)-__cameraX; }
function __y(value,name="y") { return __finite(value,name)-__cameraY; }
function __numbers(value,name,maximum) { if(!Array.isArray(value)||value.length>maximum||value.some(item=>typeof item!=="number"||!Number.isFinite(item))) throw new Error(name+" must be a finite number array"); return value.slice(); }
const pixel = Object.freeze((x,y,color) => __append({op:"pixel",x:__x(x),y:__y(y),color:__color(color)}));
const line = Object.freeze((x0,y0,x1,y1,color) => __append({op:"line",x0:__x(x0,"x0"),y0:__y(y0,"y0"),x1:__x(x1,"x1"),y1:__y(y1,"y1"),color:__color(color)}));
const rect = Object.freeze((x,y,width,height,color,fill=false) => __append({op:"rect",x:__x(x),y:__y(y),width:__finite(width,"width"),height:__finite(height,"height"),color:__color(color),fill:Boolean(fill)}));
const circle = Object.freeze((x,y,radius,color,fill=false) => __append({op:"circle",x:__x(x),y:__y(y),radius:__finite(radius,"radius"),color:__color(color),fill:Boolean(fill)}));
const text = Object.freeze((value,x,y,color) => { value=String(value); if ([...value].length>${MAX_TEXT_CODE_POINTS}) throw new Error("text() accepts at most 1,024 characters"); __append({op:"text",value,x:__x(x),y:__y(y),color:__color(color)}); });
const camera = Object.freeze((x=0,y=0) => { __cameraX=__finite(x,"camera x"); __cameraY=__finite(y,"camera y"); });
const sprite = Object.freeze((pixels,width,height,x,y,transparent=0) => __append({op:"sprite",pixels:__numbers(pixels,"pixels",65536),width:__finite(width,"width"),height:__finite(height,"height"),x:__x(x),y:__y(y),transparent:__color(transparent)}));
const map = Object.freeze((tiles,columns,tileWidth,tileHeight,spritesheet,sheetColumns,x=0,y=0,transparent=0) => __append({op:"map",tiles:__numbers(tiles,"tiles",16384),columns:__finite(columns,"columns"),tileWidth:__finite(tileWidth,"tileWidth"),tileHeight:__finite(tileHeight,"tileHeight"),spritesheet:__numbers(spritesheet,"spritesheet",65536),sheetColumns:__finite(sheetColumns,"sheetColumns"),x:__x(x),y:__y(y),transparent:__color(transparent)}));
const seed = Object.freeze((value=1) => { __seed=__finite(value,"seed")>>>0; });
const random = Object.freeze((min=0,max=1) => { min=__finite(min,"min"); max=__finite(max,"max"); __seed=(Math.imul(1664525,__seed)+1013904223)>>>0; return min+(__seed/4294967296)*(max-min); });
const overlap = Object.freeze((ax,ay,aw,ah,bx,by,bw,bh) => [ax,ay,aw,ah,bx,by,bw,bh].every(Number.isFinite)&&aw>0&&ah>0&&bw>0&&bh>0&&ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by);
const pointInRect = Object.freeze((px,py,x,y,width,height) => [px,py,x,y,width,height].every(Number.isFinite)&&width>0&&height>0&&px>=x&&px<x+width&&py>=y&&py<y+height);
const frame = Object.freeze(() => __frame);
const every = Object.freeze((interval,offset=0) => { interval=Math.max(1,Math.floor(__finite(interval,"interval"))); offset=Math.floor(__finite(offset,"offset")); return __frame>=offset&&(__frame-offset)%interval===0; });
const after = Object.freeze((frames) => __frame>=Math.max(0,Math.floor(__finite(frames,"frames"))));
function __audio(frequency,duration=100,volume=0.15,wave="square",delay=0) { if(__audioEvents>=64)throw new Error("Frame exceeds 64 audio events"); frequency=Math.max(20,Math.min(20000,__finite(frequency,"frequency"))); duration=Math.max(1,Math.min(5000,__finite(duration,"duration"))); volume=Math.max(0,Math.min(1,__finite(volume,"volume"))); if(!["square","sine","triangle","sawtooth"].includes(wave)) throw new Error("wave is invalid"); __audioEvents++; __post({kind:"audio",token:__token,frequency,duration,volume,wave,delay}); }
const tone = Object.freeze((frequency,duration=100,volume=0.15,wave="square") => __audio(frequency,duration,volume,wave,0));
const sfx = Object.freeze((notes,step=80,volume=0.15,wave="square") => { notes=__numbers(notes,"notes",32); step=Math.max(1,Math.min(1000,__finite(step,"step"))); notes.forEach((note,index)=>__audio(note,Math.max(1,step-10),volume,wave,index*step)); });
const button = Object.freeze((input) => __input.held.includes(input));
const buttonPressed = Object.freeze((input) => __input.pressed.includes(input));
`;
  const compiledStartLine = prefix.split("\n").length;
  const suffix = `
function __location(error) {
  const match = typeof error?.stack === "string" ? error.stack.match(/cartridge-worker\\.js:(\\d+):(\\d+)/) : null;
  if (!match) return {};
  return { line: Math.max(1, Number(match[1]) - ${compiledStartLine} + 1), column: Number(match[2]) };
}
function __error(error) {
  const message = error instanceof Error ? error.message : String(error);
  __post({kind:"error",token:__token,phase:__phase,message:message.slice(0,4096),...__location(error)});
}
function __call(phase, fn) {
  __phase = phase;
  __post({kind:"phase",token:__token,phase,state:"begin"});
  fn();
  __post({kind:"phase",token:__token,phase,state:"complete"});
}
try {
  for (const name of ["init","update","draw"]) if (typeof __tyntCartridge?.[name] !== "function") throw new Error("Cartridge must export function " + name + "()");
  __call("init", __tyntCartridge.init);
  __post({kind:"heartbeat",token:__token});
  __post({kind:"ready",token:__token});
} catch (error) { __error(error); }
__listen("message", (event) => {
  const message = event.data;
  if (!message || message.token !== __token || message.kind !== "tick" || !message.input) return;
  try {
    __input = { held: Array.isArray(message.input.held) ? message.input.held.slice() : [], pressed: Array.isArray(message.input.pressed) ? message.input.pressed.slice() : [] };
    __frame++;
    __audioEvents = 0;
    __commands = [];
    __call("update", __tyntCartridge.update);
    __commands = [];
    __call("draw", __tyntCartridge.draw);
    const frame={kind:"frame",token:__token,commands:__commands};
    if (__encoder.encode(__stringify(frame)).byteLength > ${MAX_FRAME_BYTES}) throw new Error("Frame message exceeds 1 MiB");
    __post(frame);
    __post({kind:"heartbeat",token:__token});
  } catch (error) { __error(error); }
});
//# sourceURL=cartridge-worker.js`;
  const suffixId = token.slice(0, 24);
  const privateNames = [
    "__token", "__post", "__listen", "__stringify", "__encoder", "__blocked", "__name", "__commands", "__audioEvents", "__input", "__phase",
    "__finite", "__color", "__append", "__x", "__y", "__numbers", "__audio", "__location", "__error", "__call", "__cameraX", "__cameraY", "__frame", "__seed",
  ];
  const harden = (trusted: string) => privateNames.reduce(
    (value, name) => value.replaceAll(name, `${name}_${suffixId}`),
    trusted,
  );
  return `${harden(prefix)}${compiledCode}${harden(suffix)}`;
}
