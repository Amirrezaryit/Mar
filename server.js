'use strict';
const http=require('http');
const {WebSocketServer,WebSocket}=require('ws');
const PORT=process.env.PORT||3000, W=32,H=24, MAX=5, MIN=2, WAIT=30000, STEP=50;
const colors=['#62f6b0','#ffbd59','#f578c6','#7bc9ff','#b59aff'];
let nextId=1, rooms=[];
const rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function send(ws,obj){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(obj))}
function newRoom(){let r={players:[],phase:'waiting',deadline:0,food:{x:rand(2,W-2),y:rand(2,H-2)},endedAt:0};rooms.push(r);return r}
function snapshot(r){return {type:'state',phase:r.phase,remaining:r.deadline?Math.max(0,Math.ceil((r.deadline-Date.now())/1000)):30,food:r.food,players:r.players.map(p=>({id:p.id,color:p.color,alive:p.alive,body:p.body}))}}
function broadcast(r,msg){r.players.forEach(p=>send(p.ws,msg))}
function spawn(p,i){let positions=[[5,5],[26,18],[26,5],[5,18],[16,12]];let [x,y]=positions[i];p.body=[{x,y},{x:x-.45,y}];p.angle=0;p.target=0;p.alive=true;p.speed=3.9;p.score=0}
function join(ws){let r=rooms.find(r=>r.phase==='waiting'&&r.players.length<MAX)||newRoom();let p={ws,id:String(nextId++),color:colors[r.players.length],alive:true,body:[],angle:0,target:0,speed:3.9,score:0};r.players.push(p);spawn(p,r.players.length-1);ws.player=p;ws.room=r;send(ws,{type:'joined',id:p.id});if(r.players.length>=MIN&&!r.deadline)r.deadline=Date.now()+WAIT;broadcast(r,snapshot(r))}
function remove(ws){const r=ws.room;if(!r)return;r.players=r.players.filter(p=>p!==ws.player);ws.room=null;if(r.phase==='waiting'&&r.players.length<MIN)r.deadline=0;if(r.phase==='running')checkWinner(r);if(!r.players.length)rooms=rooms.filter(v=>v!==r)}
function checkWinner(r){if(r.phase!=='running')return;let alive=r.players.filter(p=>p.alive);if(alive.length<=1){r.phase='finished';r.endedAt=Date.now();if(alive.length)broadcast(r,{type:'winner',id:alive[0].id});if(alive.length)send(alive[0].ws,{type:'victory'});broadcast(r,snapshot(r))}}
function start(r){if(r.players.length<MIN){r.deadline=0;return}r.phase='running';r.players.forEach((p,i)=>spawn(p,i));broadcast(r,{type:'start'})}
function tick(){const now=Date.now();for(const r of rooms){if(r.phase==='waiting'&&r.deadline&&now>=r.deadline)start(r);if(r.phase==='finished'){if(now-r.endedAt>9000){r.phase='waiting';r.deadline=r.players.length>=MIN?now+WAIT:0;r.players.forEach((p,i)=>spawn(p,i))}continue}if(r.phase!=='running')continue;
for(const p of r.players){if(!p.alive)continue;let h=p.body[0];let diff=Math.atan2(Math.sin(p.target-p.angle),Math.cos(p.target-p.angle));p.angle+=Math.max(-.17,Math.min(.17,diff));let n={x:h.x+Math.cos(p.angle)*p.speed*STEP/1000,y:h.y+Math.sin(p.angle)*p.speed*STEP/1000};if(n.x<.35||n.x>W-.35||n.y<.35||n.y>H-.35){p.alive=false;continue}let collided=false;for(const other of r.players){if(!other.alive)continue;for(let j=other===p?7:2;j<other.body.length;j++){if(dist(n,other.body[j])<.40){collided=true;break}}if(collided)break}if(collided){p.alive=false;continue}p.body.unshift(n);const maxLen=20+p.score*4;while(p.body.length>maxLen)p.body.pop();if(dist(n,r.food)<.75){p.score++;r.food={x:rand(1,W-1),y:rand(1,H-1)}}}
checkWinner(r)} }
setInterval(tick,STEP);setInterval(()=>{for(const r of rooms)broadcast(r,snapshot(r))},100);
const server=http.createServer((req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({ok:true,name:'Snake 6 Online Server',rooms:rooms.length,players:rooms.reduce((a,r)=>a+r.players.length,0)}))});
const wss=new WebSocketServer({server,path:'/online'});wss.on('connection',ws=>{join(ws);ws.on('message',raw=>{if(raw.length>512)return;let m;try{m=JSON.parse(raw)}catch{return}let p=ws.player;if(!p||!ws.room||ws.room.phase!=='running')return;if(m.type==='steer'&&typeof m.angle==='number'&&Number.isFinite(m.angle))p.target=m.angle;if(m.type==='turn'){const dirs={up:-Math.PI/2,down:Math.PI/2,left:Math.PI,right:0};if(Object.hasOwn(dirs,m.dir))p.target=dirs[m.dir]}});ws.on('close',()=>remove(ws));ws.on('error',()=>remove(ws))});
server.listen(PORT,'0.0.0.0',()=>console.log('Snake 6 server listening on '+PORT));
