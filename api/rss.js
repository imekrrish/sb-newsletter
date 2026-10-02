// RSS proxy shared by Node and Vercel. Publication hosts only; bounded streaming.
const MAX_BYTES = 5 * 1024 * 1024;
const HOSTS = new Set(['bessnews.com','www.bessnews.com','solarbytes.info','www.solarbytes.info']);
function allowed(target) {
  try { const u = new URL(target); return u.protocol === 'https:' && !u.username && !u.password && (!u.port || u.port==='443') && HOSTS.has(u.hostname); } catch { return false; }
}
function send(res,status,body,type='text/plain; charset=utf-8') {
  res.statusCode=status; res.setHeader('Content-Type',type);
  res.setHeader('Cache-Control',status===200?'s-maxage=300, stale-while-revalidate=600':'no-store'); res.end(body);
}
async function handler(req,res) {
  if(req.method && req.method!=='GET') return send(res,405,'Use GET');
  let target=new URL(req.url,'http://localhost').searchParams.get('url') || 'https://solarbytes.info/rss';
  if(!allowed(target)) return send(res,400,'Use an HTTPS feed on bessnews.com, solarbytes.info. Other feeds can be uploaded as RSS files.');
  try {
    const signal=AbortSignal.timeout(20000);
    let response;
    for(let i=0;i<5;i++) {
      response=await fetch(target,{headers:{'User-Agent':'Mozilla/5.0 (Newsletter Studio)',Accept:'application/rss+xml, application/xml, text/xml'},redirect:'manual',signal});
      if(![301,302,303,307,308].includes(response.status)) break;
      const location=response.headers.get('location');
      await response.body?.cancel();
      if(!location)throw new Error('Invalid upstream redirect');
      target=new URL(location,target).href;
      if(!allowed(target))throw new Error('Upstream redirected outside the publication hosts');
      if(i===4)throw new Error('Too many redirects');
    }
    if(!response.ok)return send(res,502,`Upstream responded ${response.status}`);
    if(+response.headers.get('content-length')>MAX_BYTES){await response.body?.cancel();throw new Error('Feed is too large');}
    let bytes=0; const parts=[];
    for await(const chunk of response.body){bytes+=chunk.byteLength;if(bytes>MAX_BYTES)throw new Error('Feed is too large');parts.push(Buffer.from(chunk));}
    const body=Buffer.concat(parts).toString('utf8');
    if(!/<rss[\s>]/i.test(body.slice(0,4000))) return send(res,502,'That URL did not return an RSS feed');
    return send(res,200,body,'application/xml; charset=utf-8');
  } catch(err){return send(res,502,'Could not fetch RSS: '+err.message);}
}
module.exports=handler;
module.exports.allowed=allowed;
