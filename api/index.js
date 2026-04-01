export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHTML());
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rows } = req.body;
  if (!rows || !rows.length) return res.status(400).json({ error: 'No rows provided' });

  const BANK = `הערות חיוביות (לציונים 70+):
11 - אתה ראוי לשבח על הישגיך המצויינים. [90+]
13 - לקחת חלק פעיל בשיעורים וגילית רצינות ואחריות.
23 - הנך מגלה מוטיבציה ורצון להתקדם בלימודים.
24 - שקדת על עבודתך ועבדת ברצינות מתוך אחריות ובגרות.
25 - גילית אחריות ללמידה, מוטיבציה ורצון להתקדם.
26 - אתה תלמיד רציני, מגלה עניין והבנה ובעל מוטיבציה להצלחה.
28 - אתה ראוי להערכה רבה על מאמציך הלימודיים. תרומתך לשיעורים מבורכת.
32 - גילית ידע רב והפגנת שליטה מלאה בנושאים שנלמדו.
33 - אתה מגלה עניין במקצוע, ועושה כמיטב יכולתך. [70-79]

הערות לשיפור (לציונים מתחת ל-70):
57 - עליך להקפיד להגיע לשיעורים ולהגיש את המטלות.
59 - מעורבות בשיעורים, הגשת כל המטלות והשקעת מאמצים לימודיים יקדמו אותך.
68 - עליך לגלות אחריות על למידתך, להגיע בזמן ולבצע משימות באופן עקבי.
80 - עליך לגלות יותר מוטיבציה ואחריות ללמידה.
87 - התנהגותך בשיעורים וחוסר הריכוז פגעו בהישגיך.
90 - למידה עקבית, השקעת מאמצים והתמקדות בחומר ישפרו את ידיעותיך.
92 - הפגנת שליטה חלקית בנושאים שנלמדו. חשוב שתקדיש זמן ומאמץ להשלמת הפערים.`;

  const tableText = rows.map((r, i) =>
    `שורה ${i+1}: תלמיד="${r.studentName||'?'}" מקצוע="${r.subject}" ציון=${r.grade} הערה="${r.comment}"`
  ).join('\n');

  const prompt = `אתה עוזר למחנכת לבדוק תעודות תלמידים.

${BANK}

כללי התאמה:
- ציון 90+: הערה חיובית חובה. הערה לשיפור בלבד = error
- ציון 75-89: הערה חיובית. הערה לשיפור בלבד = warning
- ציון מתחת ל-60: חייב הערה לשיפור. הערה חיובית בלבד = error
- "I believe you can do better" = הערה לשיפור
- "You did a great job" = הערה חיובית

${tableText}

החזר JSON בלבד:
{"results":[{"row":1,"isMatch":true,"severity":"ok","issue":"","suggestions":[]}]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    let text = data.content.map(c => c.text || '').join('').replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    return res.status(200).json(JSON.parse(text));
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

function getHTML() {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>בודק התאמת הערות לציונים</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"><\/script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;min-height:100vh;padding:20px;color:#1a202c}
.container{max-width:900px;margin:0 auto}
.header{text-align:center;margin-bottom:24px}
h1{font-size:1.8rem;color:#2b6cb0;margin-bottom:4px}
.header p{color:#718096;font-size:.9rem}
.section{background:white;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.07);padding:20px;margin-bottom:16px}
.upload-area{border:2.5px dashed #90cdf4;border-radius:12px;padding:40px 20px;text-align:center;cursor:pointer;transition:all .2s;background:#f7fafc}
.upload-area:hover,.drag-over{border-color:#3182ce;background:#ebf8ff}
.upload-icon{font-size:2.8rem;margin-bottom:8px}
.upload-area h3{color:#2d3748;margin-bottom:4px}
.upload-area p{color:#a0aec0;font-size:.85rem}
#fileInput{display:none}
.badge{display:none;background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:8px 14px;color:#2b6cb0;font-size:.88rem;margin-top:10px}
.btn{width:100%;padding:14px;border-radius:10px;border:none;cursor:pointer;font-size:1rem;font-weight:700;font-family:inherit;background:linear-gradient(135deg,#3182ce,#2b6cb0);color:white;transition:all .2s;margin-top:4px}
.btn:hover:not(:disabled){box-shadow:0 4px 14px rgba(49,130,206,.4);transform:translateY(-1px)}
.btn:disabled{background:#e2e8f0;color:#a0aec0;cursor:not-allowed;transform:none}
.prog{display:none;margin-top:14px}
.prog-bg{background:#e2e8f0;border-radius:8px;height:10px;overflow:hidden}
.prog-bar{height:100%;background:linear-gradient(90deg,#3182ce,#63b3ed);border-radius:8px;transition:width .4s;width:0%}
.prog-lbl{text-align:center;color:#4a5568;font-size:.85rem;margin-top:6px}
.err{display:none;background:#fff5f5;border:1px solid #fed7d7;border-radius:10px;padding:12px 16px;color:#c53030;font-size:.9rem;margin-top:10px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.stat{background:white;border-radius:12px;padding:18px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.stat-n{font-size:2.2rem;font-weight:800;line-height:1}
.stat-l{color:#718096;font-size:.82rem;margin-top:3px}
.sb .stat-n{color:#3182ce}.sg .stat-n{color:#38a169}.sr .stat-n{color:#e53e3e}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tab{padding:5px 12px;border-radius:20px;border:1.5px solid #e2e8f0;cursor:pointer;font-size:.82rem;font-weight:600;background:white;font-family:inherit}
.tab.on{background:#2b6cb0;color:white;border-color:#2b6cb0}
.card{background:white;border-radius:12px;padding:16px 18px;margin-bottom:10px;box-shadow:0 1px 5px rgba(0,0,0,.06);border-right:5px solid}
.card.ok{border-right-color:#38a169}.card.warn{border-right-color:#ed8936}.card.err2{border-right-color:#e53e3e}
.card.hide{display:none}
.ct{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:6px}
.sj{font-size:1.05rem;font-weight:700}.mt{font-size:.8rem;color:#718096;margin-top:2px}
.gp{padding:4px 14px;border-radius:20px;font-weight:800;font-size:1rem}
.ga{background:#c6f6d5;color:#22543d}.gb{background:#bee3f8;color:#1a365d}.gc{background:#fefcbf;color:#744210}.gd{background:#fbd38d;color:#7b341e}.gf{background:#fed7d7;color:#742a2a}
.fl{font-size:.72rem;font-weight:700;color:#a0aec0;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}
.cb{background:#f7fafc;border-radius:7px;padding:8px 12px;font-size:.88rem;color:#2d3748;line-height:1.5;margin-bottom:8px;border-right:3px solid #e2e8f0}
.ib{background:#fff5f5;border:1px solid #fed7d7;border-radius:7px;padding:7px 12px;color:#c53030;font-size:.85rem;margin-bottom:8px}
.sb2{background:#f0fff4;border:1px solid #c6f6d5;border-radius:7px;padding:8px 12px}
.si{font-size:.84rem;color:#276749;padding:4px 0;border-bottom:1px dashed #c6f6d5;line-height:1.4}
.si:last-child{border-bottom:none}.si::before{content:"💡 "}
.good{text-align:center;padding:36px;color:#38a169;font-size:1.2rem;font-weight:600;background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.exp{padding:8px 18px;border-radius:8px;border:1.5px solid #3182ce;background:white;color:#3182ce;cursor:pointer;font-size:.85rem;font-weight:600;font-family:inherit}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div style="font-size:2.5rem;margin-bottom:6px">🎓</div>
    <h1>בודק התאמת הערות לציונים</h1>
    <p>בית ספר אורט פסגות · בדיקה אוטומטית של תעודות מחצית</p>
  </div>
  <div class="section">
    <div class="upload-area" id="dz" onclick="document.getElementById('fi').click()">
      <div class="upload-icon">📄</div>
      <h3>גרירי קובץ תעודות לכאן, או לחצי לבחירה</h3>
      <p>קובץ Word (.docx) של כיתה שלמה</p>
    </div>
    <input type="file" id="fi" accept=".docx" multiple>
    <div id="badge" class="badge"></div>
  </div>
  <button class="btn" id="btn" disabled onclick="run()">🔍 בדוק התאמת הערות לציונים</button>
  <div class="prog" id="prog">
    <div class="prog-bg"><div class="prog-bar" id="pb"></div></div>
    <div class="prog-lbl" id="pl">מתחיל...</div>
  </div>
  <div class="err" id="er"></div>
  <div id="res"></div>
</div>
<script>
let rows=[];
const dz=document.getElementById('dz');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over')});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');go(e.dataTransfer.files)});
document.getElementById('fi').addEventListener('change',e=>go(e.target.files));

async function go(files){
  rows=[];setErr('');document.getElementById('res').innerHTML='';
  const names=[];
  for(const f of files){
    if(!f.name.endsWith('.docx'))continue;
    names.push(f.name);
    try{
      const ab=await f.arrayBuffer();
      const r=await mammoth.convertToHtml({arrayBuffer:ab});
      rows.push(...parse(r.value,f.name));
    }catch(e){setErr('שגיאה: '+e.message);return}
  }
  const badge=document.getElementById('badge');
  if(rows.length>0){
    badge.style.display='block';
    const st=new Set(rows.map(r=>r.s).filter(Boolean)).size;
    badge.textContent='📎 '+names.join(', ')+' | '+rows.length+' מקצועות | '+(st||'?')+' תלמידים';
    document.getElementById('btn').disabled=false;
  }else{
    badge.style.display='block';
    badge.textContent='לא נמצאו ציונים בקובץ';
    badge.style.background='#fff5f5';badge.style.color='#c53030';
    document.getElementById('btn').disabled=true;
  }
}

function parse(html,fn){
  const d=document.createElement('div');d.innerHTML=html;
  const out=[];
  for(const t of d.querySelectorAll('table')){
    const tr=t.querySelectorAll('tr');
    if(tr.length<3)continue;
    if(!tr[0].textContent.includes('מקצוע')&&!tr[0].textContent.includes('ציון'))continue;
    let sn='';
    let p=t.previousElementSibling;
    while(p){
      const tx=p.textContent;
      if(tx.includes('שם התלמיד')){
        sn=tx.replace(/שם התלמידה?[\\s:]*/,'').replace(/מס[׳'][\\s\\S]*/,'').replace(/כיתה[\\s\\S]*/,'').trim();
        break;
      }
      p=p.previousElementSibling;
    }
    for(let i=1;i<tr.length;i++){
      const c=tr[i].querySelectorAll('td');
      if(c.length<4)continue;
      const sub=c[0].textContent.trim().replace(/\\s+/g,'');
      const tch=c[1]?.textContent.trim().replace(/\\s+/g,' ')||'';
      const com=c[2]?.textContent.trim().replace(/\\s+/g,' ')||'';
      const gr=parseInt(c[3]?.textContent.trim()||'');
      if(!sub||!com||com.length<4||isNaN(gr)||gr<1||gr>100)continue;
      if(sub.includes('מקצוע'))continue;
      out.push({subject:sub,teacher:tch,comment:com,grade:gr,studentName:sn,fileName:fn});
    }
  }
  return out;
}

async function run(){
  document.getElementById('btn').disabled=true;
  document.getElementById('res').innerHTML='';setErr('');
  const B=15,bats=[];
  for(let i=0;i<rows.length;i+=B)bats.push(rows.slice(i,i+B));
  const prog=document.getElementById('prog');
  prog.style.display='block';
  let all=[];
  for(let b=0;b<bats.length;b++){
    document.getElementById('pl').textContent='בודק '+(b+1)+' מתוך '+bats.length+'...';
    document.getElementById('pb').style.width=Math.round(b/bats.length*100)+'%';
    try{
      const r=await fetch('/api/index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:bats[b]})});
      const d=await r.json();
      if(d.error)throw new Error(d.error);
      d.results.forEach((r,i)=>{
        const o=bats[b][i];
        all.push({...r,subject:o.subject,grade:o.grade,comment:o.comment,teacher:o.teacher,studentName:o.studentName});
      });
    }catch(e){prog.style.display='none';setErr('שגיאה: '+e.message);document.getElementById('btn').disabled=false;return}
  }
  document.getElementById('pb').style.width='100%';
  document.getElementById('pl').textContent='סיום! נבדקו '+all.length+' מקצועות.';
  setTimeout(()=>{prog.style.display='none'},1500);
  render(all);document.getElementById('btn').disabled=false;
}

function gc(g){return g>=90?'ga':g>=80?'gb':g>=70?'gc':g>=55?'gd':'gf'}
function setErr(m){const e=document.getElementById('er');e.style.display=m?'block':'none';e.textContent=m}

function render(all){
  const iss=all.filter(r=>!r.isMatch),ok=all.filter(r=>r.isMatch);
  let h='<div class="grid"><div class="stat sb"><div class="stat-n">'+all.length+'</div><div class="stat-l">סה"כ מקצועות</div></div><div class="stat sg"><div class="stat-n">'+ok.length+'</div><div class="stat-l">✅ תקין</div></div><div class="stat sr"><div class="stat-n">'+iss.length+'</div><div class="stat-l">⚠️ לא תואם</div></div></div>';
  h+='<div style="text-align:left;margin-bottom:12px"><button class="exp" onclick="csv(window._r)">⬇️ ייצא CSV</button></div>';
  h+='<div class="tabs"><button class="tab on" onclick="filt(\'a\',this)">הכל ('+all.length+')</button><button class="tab" onclick="filt(\'i\',this)">⚠️ בעיות ('+iss.length+')</button><button class="tab" onclick="filt(\'o\',this)">✅ תקין ('+ok.length+')</button></div>';
  if(!iss.length)h+='<div class="good">✅ כל ההערות תואמות!</div>';
  for(const r of all){
    const cl=r.isMatch?'ok':(r.severity==='error'?'err2':'warn');
    const fc=r.isMatch?'ro':'ri';
    h+='<div class="card '+cl+' '+fc+'"><div class="ct"><div><div class="sj">'+(r.subject||'—')+'</div><div class="mt">'+(r.studentName?'👤 '+r.studentName:'')+''+(r.teacher?' · 👨‍🏫 '+r.teacher:'')+'</div></div><span class="gp '+gc(r.grade)+'">ציון '+r.grade+'</span></div><div class="fl">הערה שנכתבה</div><div class="cb">'+r.comment+'</div>'+(!r.isMatch?'<div class="ib">⚠️ '+r.issue+'</div>'+(r.suggestions&&r.suggestions.length?'<div class="sb2"><div class="fl" style="color:#38a169;margin-bottom:4px">הצעות חלופיות</div>'+r.suggestions.map(s=>'<div class="si">'+s+'</div>').join('')+'</div>':''):'')+'</div>';
  }
  document.getElementById('res').innerHTML=h;window._r=all;
}

function filt(f,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));btn.classList.add('on');
  document.querySelectorAll('.card').forEach(c=>{
    if(f==='a')c.classList.remove('hide');
    else if(f==='i')c.classList.toggle('hide',c.classList.contains('ro'));
    else c.classList.toggle('hide',c.classList.contains('ri'));
  });
}

function csv(all){
  if(!all)return;
  const B='\\uFEFF',h=['תלמיד','מקצוע','מורה','ציון','הערה','תקין?','בעיה','הצעות'].join(',');
  const r=all.map(r=>[r.studentName||'',r.subject||'',r.teacher||'',r.grade,'"'+r.comment.replace(/"/g,'""')+'"',r.isMatch?'כן':'לא','"'+(r.issue||'').replace(/"/g,'""')+'"','"'+(r.suggestions||[]).join(' | ').replace(/"/g,'""')+'"'].join(','));
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([B+h+'\\n'+r.join('\\n')],{type:'text/csv;charset=utf-8'}));
  a.download='דוח_תעודות.csv';a.click();
}
<\/script>
</body>
</html>`;
}
