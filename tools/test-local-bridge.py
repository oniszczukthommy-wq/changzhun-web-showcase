"""Integration checks against a running local helper; no mic or music capture."""
import json, re, urllib.request, urllib.error, socket
BASE='http://127.0.0.1:47322'
def request(path, data=None, headers=None):
 req=urllib.request.Request(BASE+path, data=None if data is None else json.dumps(data).encode(),headers=headers or {})
 try:
  with urllib.request.urlopen(req,timeout=8) as r:return r.status,r.read()
 except urllib.error.HTTPError as e:return e.code,e.read()
code,html=request('/');assert code==200
token=re.search(rb'window.__CHANGZHUN_WEB__=\{token:"([a-f0-9]+)"\}',html)[1].decode()
headers={'Origin':BASE,'Content-Type':'application/json','X-Changzhun-Token':token}
def invoke(command,args=None):
 code,body=request('/api/invoke',{'command':command,'args':args or {}},headers)
 assert code==200,(command,code,body)
 return json.loads(body)['result']
for path in ['/','/discover','/settings','/library','/history','/song','/take','/licences']:
 assert request(path)[0]==200,path
for cmd in ['settings_now','setup_status','mics','output_timing','library','takes','qqmusic_status']:
 value=invoke(cmd)
 if cmd=='setup_status':print('Permission state:',json.dumps(value,ensure_ascii=False))
print('PASS: pages and seven native read commands')
s=invoke('settings_now');before=s.get('show_lyrics',True)
try:
 invoke('set_setting',{'key':'show_lyrics','on':not before})
 assert invoke('settings_now')['show_lyrics']==(not before)
finally:invoke('set_setting',{'key':'show_lyrics','on':before})
print('PASS: native setting roundtrip and restore')
assert request('/api/invoke',{'command':'qqmusic_open','args':{'target':'https://evil.example'}},headers)[0]==400
assert request('/api/invoke',{'command':'set_qqmusic_browser','args':{'browser':'untrusted'}},headers)[0]==400
assert invoke('settings_now').get('qqmusic_browser') in ['chrome','safari','edge','brave','ego']
print('PASS: QQ browser selection validation')
assert request('/api/invoke',{'command':'settings_now'},{'Origin':BASE,'Content-Type':'application/json'})[0]==403
assert request('/api/invoke',{'command':'settings_now'},{**headers,'Origin':'https://evil.example'})[0]==403
assert request('/api/health',headers={'Host':'evil.example:47322'})[0]==403
assert request('/events')[0]==403
assert request('/api/audio?id=../settings.json')[0]==403
assert request('/api/invoke',{'command':'unknown','args':{}},headers)[0]==400
assert request('/%2e%2e/settings.json')[0]==400
print('PASS: token, Origin, Host, allowlist and path protections')
with urllib.request.urlopen(BASE+'/events?token='+token,timeout=8) as r:
 got=[]
 for _ in range(150):
  line=r.readline().decode()
  if line.startswith('data: '):got.append(json.loads(line[6:]))
  if any(x.get('caught_up') for x in got):break
 assert got and any(x.get('caught_up') for x in got)
 print('PASS: SSE initial state and catch-up marker')
