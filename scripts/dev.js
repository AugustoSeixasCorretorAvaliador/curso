import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import portal from '../api/portal.js';
const assets = {'/curso/assets/portal.css':'text/css; charset=utf-8','/curso/assets/portal.js':'text/javascript; charset=utf-8'};
const server = createServer((req,res) => {
  if (req.url === '/') {
    res.writeHead(302,{Location:'/curso/'}).end();
    return;
  }
  const path = (req.url ?? '').split('?')[0];
  if (Object.hasOwn(assets,path)) {
    res.setHeader('Content-Type',assets[path]);
    createReadStream(new URL('../public'+path,import.meta.url)).pipe(res);
    return;
  }
  portal(req,res).catch(error=>{console.error(error);res.writeHead(500).end();});
});
server.listen(Number(process.env.PORT ?? 3000),'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port+'/curso/'));
