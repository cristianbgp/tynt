export function createIframeDocument(token: string): string {
  const safeToken = token.replace(/[^0-9a-f]/g, "");
  const script = `"use strict";
const token=${JSON.stringify(safeToken)};
let worker=null;
let workerUrl=null;
let phaseTimer=null;
let heartbeatTimer=null;
let currentPhase="init";
let phaseActive=false;
let awaitingResponse=false;
let suspended=false;
function send(message){ parent.postMessage(message,"*"); }
function clearTimers(){ if(phaseTimer!==null)clearTimeout(phaseTimer); if(heartbeatTimer!==null)clearTimeout(heartbeatTimer); phaseTimer=null; heartbeatTimer=null; }
function clearHeartbeat(){ if(heartbeatTimer!==null)clearTimeout(heartbeatTimer); heartbeatTimer=null; }
function dispose(){ clearTimers(); if(worker)worker.terminate(); worker=null; if(workerUrl)URL.revokeObjectURL(workerUrl); workerUrl=null; }
function fail(phase,message){ dispose(); send({kind:"error",token,phase,message}); }
function heartbeat(){ if(suspended)return; if(heartbeatTimer!==null)clearTimeout(heartbeatTimer); heartbeatTimer=setTimeout(()=>fail(currentPhase,"Worker stopped responding for 2 seconds"),2000); }
function phaseWatchdog(){ if(suspended)return; if(phaseTimer!==null)clearTimeout(phaseTimer); phaseTimer=setTimeout(()=>fail(currentPhase,currentPhase+" exceeded 100 ms"),100); }
function start(source){
  if(worker)return;
  workerUrl=URL.createObjectURL(new Blob([source],{type:"text/javascript"}));
  worker=new Worker(workerUrl);
  awaitingResponse=true;
  heartbeat();
  worker.onmessage=(event)=>{
    const message=event.data;
    if(!message||message.token!==token||typeof message.kind!=="string")return fail("protocol","Worker sent an invalid message");
    heartbeat();
    if(message.kind==="phase"){
      currentPhase=message.phase;
      if(message.state==="begin"){
        phaseActive=true;
        phaseWatchdog();
      } else if(message.state==="complete"){ phaseActive=false; if(phaseTimer!==null)clearTimeout(phaseTimer); phaseTimer=null; }
    }
    if(message.kind==="ready"||message.kind==="frame"){ awaitingResponse=false; clearHeartbeat(); }
    send(message);
    if(message.kind==="error")dispose();
  };
  worker.onerror=(event)=>fail(currentPhase,event.message||"Worker failed");
}
window.addEventListener("message",(event)=>{
  const message=event.data;
  if(event.source!==parent||!message||message.token!==token||typeof message.kind!=="string")return;
  if(message.kind==="boot"&&typeof message.workerSource==="string")start(message.workerSource);
  else if(message.kind==="tick"&&worker){ awaitingResponse=true; if(heartbeatTimer===null)heartbeat(); worker.postMessage(message); }
  else if(message.kind==="suspend"&&worker){ suspended=true; clearTimers(); }
  else if(message.kind==="resume"&&worker){ suspended=false; if(awaitingResponse)heartbeat(); if(phaseActive)phaseWatchdog(); }
  else if(message.kind==="stop")dispose();
});`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${safeToken}'; worker-src blob:; connect-src 'none'; img-src 'none'; style-src 'none'; frame-src 'none'; child-src 'none'; object-src 'none'; form-action 'none'; base-uri 'none'"></head><body><script nonce="${safeToken}">${script}</script></body></html>`;
}
