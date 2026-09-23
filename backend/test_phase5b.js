const base='http://localhost:5000';
let cookies='';
async function login(){
  const res=await fetch(`${base}/api/v1/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@crm.local',password:'Password@123'})});
  const json=await res.json();
  cookies=res.headers.get('set-cookie')||'';
  return json.data.accessToken;
}
let token=await login();
console.log('login ok',token.slice(0,20), 'cookie',cookies.slice(0,30));
function authHeaders(){
  return { 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json', 'Cookie':cookies.split(';')[0] };
}
async function api(method,path,body){
  const opts={method,headers:authHeaders()};
  if(body) opts.body=JSON.stringify(body);
  const res=await fetch(`${base}${path}`,opts);
  const json=await res.json();
  console.log(method,path, res.status, JSON.stringify(json).slice(0,800));
  return json;
}
let r=await api('GET','/api/v1/pipelines');
let pid=r.data[0].id;
let sid=r.data[0].stages[0].id;
let sid2=r.data[0].stages[1].id;
console.log('pid',pid);
let r2=await api('POST','/api/v1/pipelines',{name:'Test Pipeline 5b',isDefault:false});
console.log('create pipeline success',r2.success, r2.data?.id);
let r3=await api('POST','/api/v1/deals',{name:'Phase5 Test Deal',pipelineId:pid,stageId:sid,amount:75000});
console.log('create deal',r3.success, r3.data?.id);
let did=r3.data.id;
let r4=await api('POST',`/api/v1/deals/${did}/move-stage`,{stageId:sid2});
console.log('move',r4.success, r4.data?.stageId);
let r5=await api('POST',`/api/v1/deals/${did}/close`,{status:'WON'});
console.log('close',r5.success, r5.data?.status);
let r6=await api('GET','/api/v1/dashboard');
console.log('dashboard totals',JSON.stringify(r6.data?.totals));
console.log('DONE');
