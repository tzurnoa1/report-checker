export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Serve HTML for GET requests
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(getHTML());
  }

  // Handle API check for POST requests
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rows } = req.body;
  if (!rows || !rows.length) return res.status(400).json({ error: 'No rows provided' });

  const BANK = `
הערות חיוביות (לציונים 70+):
11 - אתה ראוי לשבח על הישגיך המצויינים. [90+]
12 - גילית הבנה מעמיקה בנושאים הנלמדים תוך שיתוף פעולה ועזרה לחברים.
13 - לקחת חלק פעיל בשיעורים וגילית רצינות ואחריות.
14 - התמודדת בהצלחה עם אתגרים ברמת חשיבה גבוהה.
20 - הנך מקפיד על נוכחות סדירה, שותף פעיל בשיעורים, תורם לשיח.
21 - הנך נוכח בשיעורים, מבצע את כל הנדרש בקביעות וביסודיות.
22 - אתה ראוי לשבח על התמדה בביצוע משימותיך.
23 - הנך מגלה מוטיבציה ורצון להתקדם בלימודים.
24 - שקדת על עבודתך ועבדת ברצינות מתוך אחריות ובגרות.
25 - גילית אחריות ללמידה, מוטיבציה ורצון להתקדם.
26 - אתה תלמיד רציני, מגלה עניין והבנה ובעל מוטיבציה להצלחה.
27 - הרבית להשתתף בשיעורים, תרמת לדיונים הכיתתיים.
28 - אתה ראוי להערכה רבה על מאמציך הלימודיים. תרומתך לשיעורים מבורכת.
29 - הנך מגלה אחריות ורצינות בלמידה, בנוכחות ובהשתתפות פעילה.
32 - גילית ידע רב והפגנת שליטה מלאה בנושאים שנלמדו.
33 - אתה מגלה עניין במקצוע, ועושה כמיטב יכולתך כדי לעמוד בדרישות. [70-79]
35 - הצבת לעצמך מטרות לימודיות ועמדת בהן.
38 - הרבית להשתתף בדיונים. אתה מבין היטב את החומר ומפגין ידע נרחב.
40 - מעורבותך בשיעורים תורמת רבות. ניכר כי אתה בקיא בחומר הלימוד.

הערות לשיפור (לציונים מתחת ל-70):
54 - עליך להקפיד על כתיבת תשובה במבנה תקין.
56 - עליך להקפיד על כתיבת תשובה מפורטת ומנומקת.
57 - עליך להקפיד להגיע לשיעורים ולהגיש את המטלות.
58 - עליך להקפיד להגיש את המטלות הנדרשות.
59 - מעורבות בשיעורים, הגשת כל המטלות והשקעת מאמצים לימודיים יקדמו אותך.
60 - ידיעותיך רבות והבנתך טובה, יש מקום להגיע לכל השיעורים ולקחת חלק פעיל. [65-74]
62 - אתה עדיין מתקשה בהבנת החומר. חשוב מאוד שתשאל כשאינך מבין.
68 - עליך לגלות אחריות על למידתך, להגיע בזמן ולבצע משימות באופן עקבי.
70 - עליך להקפיד ולבצע את המשימות בשיעורים.
72 - עליך להיות נוכח בשיעורים. נוכחות סדירה תשפר הישגיך!
80 - עליך לגלות יותר מוטיבציה ואחריות ללמידה.
83 - במהלך השיעורים, לא הפגנת רצינות ולא הבעת נכונות ללמידה.
86 - במידה שלא יחול שיפור בתפקודך, אתה עלול שלא לעמוד בדרישות הבגרות. [מתחת ל-55]
87 - התנהגותך בשיעורים וחוסר הריכוז פגעו בהישגיך ובהבנת החומר.
88 - הנך מגלה ידע בחומר הנלמד, אך עליך להתמיד בביצוע משימות השיעור. [60-69]
89 - לא השקעת מספיק בעבודות הבית, והדבר יצר פערים בהבנה ובידיעת החומר.
90 - למידה עקבית, השקעת מאמצים והתמקדות בחומר ישפרו את ידיעותיך.
92 - הפגנת שליטה חלקית בנושאים שנלמדו. חשוב שתקדיש זמן ומאמץ להשלמת הפערים.
97 - עליך להקפיד על הגשת עבודות, ולגלות מעורבות ואחריות ללמידתך.`;

  const tableText = rows.map((r, i) =>
    `שורה ${i+1}: תלמיד="${r.studentName||'?'}" מקצוע="${r.subject}" ציון=${r.grade} הערה="${r.comment}"`
  ).join('\n');

  const prompt = `אתה עוזר למחנכת לבדוק תעודות תלמידים.

${BANK}

כללי התאמה:
• ציון 90+: הערה חיובית חובה. הערה לשיפור בלבד = חוסר התאמה חמור (severity:error).
• ציון 75-89: הערה חיובית מתאימה. הערה לשיפור בלבד = חוסר התאמה (severity:warning).
• ציון 60-74: הערה מעורבת סבירה. הערה חיובית בלבד לציון מתחת ל-70 = חוסר התאמה קל.
• ציון מתחת ל-60: חייב הערה לשיפור. הערה חיובית בלבד = חוסר התאמה חמור (severity:error).
• "I believe you can do better" = הערה לשיפור.
• "You did a great job" = הערה חיובית.

שורות לבדיקה:
${tableText}

החזר JSON בלבד (ללא טקסט אחר):
{"results":[{"row":1,"isMatch":true,"severity":"ok","issue":"","suggestions":[]}]}
severity: ok/warning/error. issue: בעברית, ריק אם תקין. suggestions: 2-3 הצעות מהבנק אם לא תקין.`;

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
<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></scr` + `ipt>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;min-height:100vh;padding:20px;color:#1a202c}
.container{max-width:900px;margin:0 auto}
.header{text-align:center;margin-bottom:24px}
.header h1{font-size:1.8rem;color:#2b6cb0;margin-bottom:4px}
.header p{color:#718096;font-size:.9rem}
.section{background:white;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,.07);padding:20px;margin-bottom:16px}
.upload-area{border:2.5px dashed #90cdf4;border-radius:12px;padding:40px 20px;text-align:center;cursor:pointer;transition:all .2s;background:#f7fafc}
.upload-area:hover,.upload-area.drag-over{border-color:#3182ce;background:#ebf8ff}
.upload-icon{font-size:2.8rem;margin-bottom:8px}
.upload-area h3{color:#2d3748;margin-bottom:4px}
.upload-area p{color:#a0aec0;font-size:.85rem}
#fileInput{display:none}
.file-badge{display:none;background:#ebf8ff;border:1px solid #bee3f8;border-radius:8px;padding:8px 14px;color:#2b6cb0;font-size:.88rem;margin-top:10px}
.btn-check{width:100%;padding:14px;border-radius:10px;border:none;cursor:pointer;font-size:1rem;font-weight:700;font-family:inherit;background:linear-gradient(135deg,#3182ce,#2b6cb0);color:white;transition:all .2s;margin-top:4px}
.btn-check:hover:not(:disabled){box-shadow:0 4px 14px rgba(49,130,206,.4);transform:translateY(-1px)}
.btn-check:disabled{background:#e2e8f0;color:#a0aec0;cursor:not-allowed;transform:none}
.progress-wrap{display:none;margin-top:14px}
.progress-bar-bg{background:#e2e8f0;border-radius:8px;height:10px;overflow:hidden}
.progress-bar{height:100%;background:linear-gradient(90deg,#3182ce,#63b3ed);border-radius:8px;transition:width .4s;width:0%}
.progress-label{text-align:center;color:#4a5568;font-size:.85rem;margin-top:6px}
.error-msg{display:none;background:#fff5f5;border:1px solid #fed7d7;border-radius:10px;padding:12px 16px;color:#c53030;font-size:.9rem;margin-top:10px}
.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.stat{background:white;border-radius:12px;padding:18px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.stat-num{font-size:2.2rem;font-weight:800;line-height:1}
.stat-lbl{color:#718096;font-size:.82rem;margin-top:3px}
.s-blue .stat-num{color:#3182ce}.s-green .stat-num{color:#38a169}.s-red .stat-num{color:#e53e3e}
.filter-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.tab{padding:5px 12px;border-radius:20px;border:1.5px solid #e2e8f0;cursor:pointer;font-size:.82rem;font-weight:600;background:white;transition:all .15s;font-family:inherit}
.tab.active{background:#2b6cb0;color:white;border-color:#2b6cb0}
.rcard{background:white;border-radius:12px;padding:16px 18px;margin-bottom:10px;box-shadow:0 1px 5px rgba(0,0,0,.06);border-right:5px solid}
.rcard.c-ok{border-right-color:#38a169}.rcard.c-warn{border-right-color:#ed8936}.rcard.c-err{border-right-color:#e53e3e}
.rcard.hidden{display:none}
.card-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:6px}
.subj{font-size:1.05rem;font-weight:700}.meta{font-size:.8rem;color:#718096;margin-top:2px}
.gpill{padding:4px 14px;border-radius:20px;font-weight:800;font-size:1rem}
.ga{background:#c6f6d5;color:#22543d}.gb{background:#bee3f8;color:#1a365d}.gc{background:#fefcbf;color:#744210}.gd{background:#fbd38d;color:#7b341e}.gf{background:#fed7d7;color:#742a2a}
.flabel{font-size:.72rem;font-weight:700;color:#a0aec0;text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}
.cbox{background:#f7fafc;border-radius:7px;padding:8px 12px;font-size:.88rem;color:#2d3748;line-height:1.5;margin-bottom:8px;border-right:3px solid #e2e8f0}
.ibox{background:#fff5f5;border:1px solid #fed7d7;border-radius:7px;padding:7px 12px;color:#c53030;font-size:.85rem;margin-bottom:8px}
.sbox{background:#f0fff4;border:1px solid #c6f6d5;border-radius:7px;padding:8px 12px}
.sitem{font-size:.84rem;color:#276749;padding:4px 0;border-bottom:1px dashed #c6f6d5;line-height:1.4}
.sitem:last-child{border-bottom:none}.sitem::before{content:"💡 "}
.all-good{text-align:center;padding:36px;color:#38a169;font-size:1.2rem;font-weight:600;background:white;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.export-btn{padding:8px 18px;border-radius:8px;border:1.5px solid #3182ce;background:white;color:#3182ce;cursor:pointer;font-size:.85rem;font-weight:600;font-family:inherit}
.export-btn:hover{background:#ebf8ff}
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
    <div class="upload-area" id="dropZone" onclick="document.getElementById('fileInput').click()">
      <div class="upload-icon">📄</div>
      <h3>גרירי קובץ תעודות לכאן, או לחצי לבחירה</h3>
      <p>קובץ Word (.docx) של כיתה שלמה</p>
    </div>
    <input type="file" id="fileInput" accept=".docx" multiple>
    <div id="fileBadge" class="file-badge"></div>
  </div>
  <button class="btn-check" id="checkBtn" disabled onclick="runCheck()">🔍 בדוק התאמת הערות לציונים</button>
  <div class="progress-wrap" id="progressWrap">
    <div class="progress-bar-bg"><div class="progress-bar" id="progressBar"></div></div>
    <div class="progress-label" id="progressLabel">מתחיל...</div>
  </div>
  <div class="error-msg" id="errorMsg"></div>
  <div id="results"></div>
</div>
<script>
let allRows=[];
const dz=document.getElementById('dropZone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over')});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');handleFiles(e.dataTransfer.files)});
document.getElementById('fileInput').addEventListener('change',e=>handleFiles(e.target.files));
async function handleFiles(files){
  allRows=[];hideError();document.getElementById('results').innerHTML='';
  const names=[];
  for(const file of files){
    if(!file.name.endsWith('.docx'))continue;
    names.push(file.name);
    try{
      const ab=await file.arrayBuffer();
      const res=await mammoth.convertToHtml({arrayBuffer:ab});
      allRows.push(...parseHtml(res.value,file.name));
    }catch(e){showError('שגיאה: '+e.message)}
  }
  if(allRows.length>0){
    const b=document.getElementById('fileBadge');
    b.style.display='block';
    const students=new Set(allRows.map(r=>r.studentName).filter(Boolean)).size;
    b.textContent='📎 '+names.join(', ')+' | '+allRows.length+' מקצועות | '+(students||'?')+' תלמידים';
    document.getElementById('checkBtn').disabled=false;
  }
}
function parseHtml(html,fileName){
  const div=document.createElement('div');div.innerHTML=html;
  const rows=[];
  for(const table of div.querySelectorAll('table')){
    const trows=table.querySelectorAll('tr');
    if(trows.length<3)continue;
    if(!trows[0].textContent.includes('מקצוע')&&!trows[0].textContent.includes('ציון'))continue;
    let studentName='';
    let prev=table.previousElementSibling;
    while(prev){
      const t=prev.textContent;
      if(t.includes('שם התלמיד')){studentName=t.replace(/שם התלמידה?[\\s::]*/, '').replace(/מס['׳][\\s\\S]*/,'').replace(/כיתה[\\s\\S]*/,'').trim();break}
      prev=prev.previousElementSibling;
    }
    for(let i=1;i<trows.length;i++){
      const cells=trows[i].querySelectorAll('td');
      if(cells.length<4)continue;
      const subject=cells[0].textContent.trim().replace(/\\s+/g,'');
      const teacher=cells[1]?.textContent.trim().replace(/\\s+/g,' ')||'';
      const comment=cells[2]?.textContent.trim().replace(/\\s+/g,' ')||'';
      const grade=parseInt(cells[3]?.textContent.trim()||'');
      if(!subject||!comment||comment.length<4||isNaN(grade)||grade<1||grade>100)continue;
      if(subject.includes('מקצוע'))continue;
      rows.push({subject,teacher,comment,grade,studentName,fileName});
    }
  }
  return rows;
}
async function runCheck(){
  document.getElementById('checkBtn').disabled=true;
  document.getElementById('results').innerHTML='';hideError();
  const BATCH=15;const batches=[];
  for(let i=0;i<allRows.length;i+=BATCH)batches.push(allRows.slice(i,i+BATCH));
  const pw=document.getElementById('progressWrap');
  const pb=document.getElementById('progressBar');
  const pl=document.getElementById('progressLabel');
  pw.style.display='block';let allResults=[];
  for(let b=0;b<batches.length;b++){
    pl.textContent='בודק אצווה '+(b+1)+' מתוך '+batches.length+' ('+allResults.length+'/'+allRows.length+' מקצועות)...';
    pb.style.width=Math.round(b/batches.length*100)+'%';
    try{
      const res=await fetch('/api/index',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:batches[b]})});
      const data=await res.json();
      if(data.error)throw new Error(data.error);
      data.results.forEach((r,i)=>{
        const orig=batches[b][i];
        allResults.push({...r,subject:orig.subject,grade:orig.grade,comment:orig.comment,teacher:orig.teacher,studentName:orig.studentName});
      });
    }catch(e){pw.style.display='none';showError('שגיאה: '+e.message);document.getElementById('checkBtn').disabled=false;return}
  }
  pb.style.width='100%';pl.textContent='סיום! נבדקו '+allResults.length+' מקצועות.';
  setTimeout(()=>{pw.style.display='none'},1500);
  renderResults(allResults);document.getElementById('checkBtn').disabled=false;
}
function gradeClass(g){if(g>=90)return 'ga';if(g>=80)return 'gb';if(g>=70)return 'gc';if(g>=55)return 'gd';return 'gf'}
function showError(msg){const e=document.getElementById('errorMsg');e.style.display='block';e.textContent=msg}
function hideError(){document.getElementById('errorMsg').style.display='none'}
function renderResults(results){
  const issues=results.filter(r=>!r.isMatch);const ok=results.filter(r=>r.isMatch);
  let html='<div class="summary-grid"><div class="stat s-blue"><div class="stat-num">'+results.length+'</div><div class="stat-lbl">סה"כ מקצועות</div></div><div class="stat s-green"><div class="stat-num">'+ok.length+'</div><div class="stat-lbl">✅ תקין</div></div><div class="stat s-red"><div class="stat-num">'+issues.length+'</div><div class="stat-lbl">⚠️ לא תואם</div></div></div>';
  html+='<div style="text-align:left;margin-bottom:12px"><button class="export-btn" onclick="exportCSV(window._res)">⬇️ ייצא דוח CSV</button></div>';
  html+='<div class="filter-tabs"><button class="tab active" onclick="setFilter(\'all\',this)">הכל ('+results.length+')</button><button class="tab" onclick="setFilter(\'issues\',this)">⚠️ בעיות ('+issues.length+')</button><button class="tab" onclick="setFilter(\'ok\',this)">✅ תקין ('+ok.length+')</button></div>';
  if(issues.length===0)html+='<div class="all-good">✅ כל ההערות תואמות לציונים!<br><small style="font-size:.95rem;font-weight:400;color:#4a5568">לא נמצאו חוסרי התאמה</small></div>';
  for(const r of results){
    const cls=r.isMatch?'c-ok':(r.severity==='error'?'c-err':'c-warn');
    const fCls=r.isMatch?'r-ok':'r-issue';
    html+='<div class="rcard '+cls+' '+fCls+'"><div class="card-top"><div><div class="subj">'+(r.subject||'—')+'</div><div class="meta">'+(r.studentName?'👤 '+r.studentName:'')+''+(r.teacher?' · 👨\u200d🏫 '+r.teacher:'')+'</div></div><span class="gpill '+gradeClass(r.grade)+'">ציון '+r.grade+'</span></div><div class="flabel">הערה שנכתבה</div><div class="cbox">'+r.comment+'</div>'+((!r.isMatch)?'<div class="ibox">⚠️ '+r.issue+'</div>'+(r.suggestions&&r.suggestions.length?'<div class="sbox"><div class="flabel" style="color:#38a169;margin-bottom:4px">הצעות חלופיות מבנק ההערות</div>'+r.suggestions.map(s=>'<div class="sitem">'+s+'</div>').join('')+'</div>':''):'')+'</div>';
  }
  document.getElementById('results').innerHTML=html;window._res=results;
}
function setFilter(f,btn){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');
  document.querySelectorAll('.rcard').forEach(c=>{
    if(f==='all')c.classList.remove('hidden');
    else if(f==='issues')c.classList.toggle('hidden',c.classList.contains('r-ok'));
    else c.classList.toggle('hidden',c.classList.contains('r-issue'));
  });
}
function exportCSV(results){
  if(!results)return;
  const BOM='\\uFEFF';
  const hdr=['תלמיד','מקצוע','מורה','ציון','הערה','תקין?','בעיה','הצעות'].join(',');
  const rows=results.map(r=>[r.studentName||'',r.subject||'',r.teacher||'',r.grade,'"'+r.comment.replace(/"/g,'""')+'"',r.isMatch?'כן':'לא','"'+(r.issue||'').replace(/"/g,'""')+'"','"'+(r.suggestions||[]).join(' | ').replace(/"/g,'""')+'"'].join(','));
  const csv=BOM+hdr+'\\n'+rows.join('\\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download='דוח_תעודות.csv';a.click();
}
</scr` + `ipt>
</body>
</html>`;
}
