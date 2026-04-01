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

  const tableText = rows.map((r, i) =>
    'שורה ' + (i+1) + ': תלמיד="' + (r.studentName||'?') + '" מקצוע="' + r.subject + '" ציון=' + r.grade + ' הערה="' + r.comment + '"'
  ).join('\n');

  const prompt = 'אתה עוזר למחנכת לבדוק תעודות.\n\nכללי התאמה:\n- ציון 90+: הערה חיובית חובה. הערה לשיפור בלבד = error\n- ציון 75-89: הערה חיובית. הערה לשיפור בלבד = warning\n- ציון מתחת ל-60: חייב הערה לשיפור. הערה חיובית בלבד = error\n- "I believe you can do better" = הערה לשיפור\n- "You did a great job" = הערה חיובית\n\n' + tableText + '\n\nהחזר JSON בלבד:\n{"results":[{"row":1,"isMatch":true,"severity":"ok","issue":"","suggestions":[]}]}';

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
    let text = data.content.map(function(c) { return c.text || ''; }).join('').replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    return res.status(200).json(JSON.parse(text));
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}

function getHTML() {
  var html = '<!DOCTYPE html>\n';
  html += '<html lang="he" dir="rtl">\n';
  html += '<head>\n';
  html += '<meta charset="UTF-8">\n';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += '<title>בודק הערות לציונים</title>\n';
  html += '<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"><';
  html += '/script>\n';
  html += '<style>\n';
  html += '*{box-sizing:border-box;margin:0;padding:0}\n';
  html += 'body{font-family:Arial,sans-serif;background:#f0f4f8;min-height:100vh;padding:20px;color:#1a202c}\n';
  html += '.box{max-width:900px;margin:0 auto}\n';
  html += 'h1{text-align:center;color:#2b6cb0;margin-bottom:4px;font-size:1.8rem}\n';
  html += '.sub{text-align:center;color:#718096;font-size:.9rem;margin-bottom:20px}\n';
  html += '.card{background:white;border-radius:14px;padding:20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,.07)}\n';
  html += '.drop{border:2.5px dashed #90cdf4;border-radius:12px;padding:40px 20px;text-align:center;cursor:pointer;background:#f7fafc}\n';
  html += '.drop h3{color:#2d3748;margin:10px 0 4px}\n';
  html += '.drop p{color:#a0aec0;font-size:.85rem}\n';
  html += '.icon{font-size:2.8rem}\n';
  html += '#fi{display:none}\n';
  html += '.msg{display:none;border-radius:8px;padding:10px 14px;font-size:.9rem;margin-top:10px}\n';
  html += '.msg.ok{background:#ebf8ff;border:1px solid #bee3f8;color:#2b6cb0}\n';
  html += '.msg.bad{background:#fff5f5;border:1px solid #fed7d7;color:#c53030}\n';
  html += '.btn{width:100%;padding:14px;border-radius:10px;border:none;cursor:pointer;font-size:1rem;font-weight:700;background:#3182ce;color:white;margin-top:4px}\n';
  html += '.btn:disabled{background:#e2e8f0;color:#a0aec0;cursor:not-allowed}\n';
  html += '.prog{display:none;margin-top:14px}\n';
  html += '.pgb{background:#e2e8f0;border-radius:8px;height:10px;overflow:hidden}\n';
  html += '.pgi{height:100%;background:#3182ce;border-radius:8px;transition:width .4s;width:0%}\n';
  html += '.pgl{text-align:center;color:#4a5568;font-size:.85rem;margin-top:6px}\n';
  html += '.err{display:none;background:#fff5f5;border:1px solid #fed7d7;border-radius:10px;padding:12px;color:#c53030;margin-top:10px}\n';
  html += '.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}\n';
  html += '.st{background:white;border-radius:12px;padding:18px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}\n';
  html += '.sn{font-size:2.2rem;font-weight:800}\n';
  html += '.sl{color:#718096;font-size:.82rem;margin-top:3px}\n';
  html += '.sb .sn{color:#3182ce}.sg .sn{color:#38a169}.sr .sn{color:#e53e3e}\n';
  html += '.tabs{display:flex;gap:6px;margin-bottom:12px}\n';
  html += '.tab{padding:5px 12px;border-radius:20px;border:1.5px solid #e2e8f0;cursor:pointer;font-size:.82rem;font-weight:600;background:white}\n';
  html += '.tab.on{background:#2b6cb0;color:white;border-color:#2b6cb0}\n';
  html += '.rc{background:white;border-radius:12px;padding:16px;margin-bottom:10px;box-shadow:0 1px 5px rgba(0,0,0,.06);border-right:5px solid}\n';
  html += '.rc.cok{border-right-color:#38a169}.rc.cwn{border-right-color:#ed8936}.rc.cer{border-right-color:#e53e3e}\n';
  html += '.rc.hid{display:none}\n';
  html += '.rh{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;flex-wrap:wrap;gap:6px}\n';
  html += '.rn{font-size:1.05rem;font-weight:700}.rm{font-size:.8rem;color:#718096;margin-top:2px}\n';
  html += '.gp{padding:4px 14px;border-radius:20px;font-weight:800;font-size:1rem}\n';
  html += '.ga{background:#c6f6d5;color:#22543d}.gb{background:#bee3f8;color:#1a365d}.gc{background:#fefcbf;color:#744210}.gd{background:#fbd38d;color:#7b341e}.gf{background:#fed7d7;color:#742a2a}\n';
  html += '.lb{font-size:.72rem;font-weight:700;color:#a0aec0;text-transform:uppercase;margin-bottom:3px}\n';
  html += '.cm{background:#f7fafc;border-radius:7px;padding:8px 12px;font-size:.88rem;color:#2d3748;line-height:1.5;margin-bottom:8px;border-right:3px solid #e2e8f0}\n';
  html += '.ib{background:#fff5f5;border:1px solid #fed7d7;border-radius:7px;padding:7px 12px;color:#c53030;font-size:.85rem;margin-bottom:8px}\n';
  html += '.sb2{background:#f0fff4;border:1px solid #c6f6d5;border-radius:7px;padding:8px 12px}\n';
  html += '.si{font-size:.84rem;color:#276749;padding:4px 0;border-bottom:1px dashed #c6f6d5;line-height:1.4}\n';
  html += '.si:last-child{border-bottom:none}.si::before{content:"💡 "}\n';
  html += '.good{text-align:center;padding:36px;color:#38a169;font-size:1.2rem;font-weight:600;background:white;border-radius:14px}\n';
  html += '.exp{padding:8px 18px;border-radius:8px;border:1.5px solid #3182ce;background:white;color:#3182ce;cursor:pointer;font-size:.85rem;font-weight:600}\n';
  html += '</style>\n';
  html += '</head>\n';
  html += '<body>\n';
  html += '<div class="box">\n';
  html += '<h1>🎓 בודק התאמת הערות לציונים</h1>\n';
  html += '<p class="sub">בית ספר אורט פסגות · בדיקה אוטומטית של תעודות מחצית</p>\n';
  html += '<div class="card">\n';
  html += '<div class="drop" onclick="document.getElementById(\'fi\').click()">\n';
  html += '<div class="icon">📄</div>\n';
  html += '<h3>גרירי קובץ תעודות לכאן, או לחצי לבחירה</h3>\n';
  html += '<p>קובץ Word (.docx) של כיתה שלמה</p>\n';
  html += '</div>\n';
  html += '<input type="file" id="fi" accept=".docx" multiple onchange="go(this.files)">\n';
  html += '<div id="msg" class="msg"></div>\n';
  html += '</div>\n';
  html += '<button class="btn" id="btn" disabled onclick="run()">🔍 בדוק התאמת הערות לציונים</button>\n';
  html += '<div class="prog" id="prog"><div class="pgb"><div class="pgi" id="pb"></div></div><div class="pgl" id="pl"></div></div>\n';
  html += '<div class="err" id="er"></div>\n';
  html += '<div id="res"></div>\n';
  html += '</div>\n';
  html += '<script>\n';
  html += 'var rows=[];\n';
  html += 'var drop=document.querySelector(".drop");\n';
  html += 'drop.addEventListener("dragover",function(e){e.preventDefault();drop.style.background="#ebf8ff";});\n';
  html += 'drop.addEventListener("dragleave",function(){drop.style.background="";});\n';
  html += 'drop.addEventListener("drop",function(e){e.preventDefault();drop.style.background="";go(e.dataTransfer.files);});\n';
  html += 'async function go(files){\n';
  html += '  rows=[];setErr("");document.getElementById("res").innerHTML="";\n';
  html += '  var names=[];\n';
  html += '  for(var i=0;i<files.length;i++){\n';
  html += '    var f=files[i];\n';
  html += '    if(!f.name.endsWith(".docx"))continue;\n';
  html += '    names.push(f.name);\n';
  html += '    try{\n';
  html += '      var ab=await f.arrayBuffer();\n';
  html += '      var r=await mammoth.convertToHtml({arrayBuffer:ab});\n';
  html += '      var parsed=parse(r.value,f.name);\n';
  html += '      rows=rows.concat(parsed);\n';
  html += '    }catch(e){setErr("שגיאה: "+e.message);return;}\n';
  html += '  }\n';
  html += '  var msg=document.getElementById("msg");\n';
  html += '  msg.style.display="block";\n';
  html += '  if(rows.length>0){\n';
  html += '    msg.className="msg ok";\n';
  html += '    var st=new Set(rows.map(function(r){return r.studentName;}).filter(Boolean)).size;\n';
  html += '    msg.textContent="נטען: "+rows.length+" מקצועות, "+(st||"?")+" תלמידים";\n';
  html += '    document.getElementById("btn").disabled=false;\n';
  html += '  }else{\n';
  html += '    msg.className="msg bad";\n';
  html += '    msg.textContent="לא נמצאו ציונים בקובץ";\n';
  html += '  }\n';
  html += '}\n';
  html += 'function parse(html,fn){\n';
  html += '  var d=document.createElement("div");\n';
  html += '  d.innerHTML=html;\n';
  html += '  var out=[];\n';
  html += '  var tables=d.querySelectorAll("table");\n';
  html += '  for(var t=0;t<tables.length;t++){\n';
  html += '    var tbl=tables[t];\n';
  html += '    var tr=tbl.querySelectorAll("tr");\n';
  html += '    if(tr.length<2)continue;\n';
  html += '    var hdr=tr[0].textContent;\n';
  html += '    if(hdr.indexOf("מקצוע")<0&&hdr.indexOf("ציון")<0&&hdr.indexOf("הערכה")<0)continue;\n';
  html += '    var sn="";\n';
  html += '    var prev=tbl.previousElementSibling;\n';
  html += '    for(var k=0;k<10&&prev;k++){\n';
  html += '      var tx=prev.textContent||"";\n';
  html += '      if(tx.indexOf("שם התלמיד")>=0){\n';
  html += '        sn=tx.replace(/שם התלמידה?\\s*[:：]?\\s*/,"").replace(/\\s*מס[׳\'].*$/,"").replace(/\\s*כיתה.*$/,"").trim();\n';
  html += '        break;\n';
  html += '      }\n';
  html += '      prev=prev.previousElementSibling;\n';
  html += '    }\n';
  html += '    for(var i=1;i<tr.length;i++){\n';
  html += '      var cells=tr[i].querySelectorAll("td,th");\n';
  html += '      if(cells.length<4)continue;\n';
  html += '      var c0=cells[0].textContent.trim().replace(/\\s+/g," ");\n';
  html += '      var c1=cells[1].textContent.trim().replace(/\\s+/g," ");\n';
  html += '      var c2=cells[2].textContent.trim().replace(/\\s+/g," ");\n';
  html += '      var c3=cells[3].textContent.trim();\n';
  html += '      var grade=parseInt(c3);\n';
  html += '      if(isNaN(grade)||grade<1||grade>100)continue;\n';
  html += '      if(!c0||c0.length<1||!c2||c2.length<3)continue;\n';
  html += '      if(c0.indexOf("מקצוע")>=0)continue;\n';
  html += '      out.push({subject:c0.replace(/\\s+/g,""),teacher:c1,comment:c2,grade:grade,studentName:sn,fileName:fn});\n';
  html += '    }\n';
  html += '  }\n';
  html += '  return out;\n';
  html += '}\n';
  html += 'async function run(){\n';
  html += '  document.getElementById("btn").disabled=true;\n';
  html += '  document.getElementById("res").innerHTML="";\n';
  html += '  setErr("");\n';
  html += '  var B=15,bats=[];\n';
  html += '  for(var i=0;i<rows.length;i+=B)bats.push(rows.slice(i,i+B));\n';
  html += '  var prog=document.getElementById("prog");\n';
  html += '  prog.style.display="block";\n';
  html += '  var all=[];\n';
  html += '  for(var b=0;b<bats.length;b++){\n';
  html += '    document.getElementById("pl").textContent="בודק "+(b+1)+" מתוך "+bats.length+"...";\n';
  html += '    document.getElementById("pb").style.width=Math.round(b/bats.length*100)+"%";\n';
  html += '    try{\n';
  html += '      var resp=await fetch("/api/index",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({rows:bats[b]})});\n';
  html += '      var data=await resp.json();\n';
  html += '      if(data.error)throw new Error(data.error);\n';
  html += '      for(var i=0;i<data.results.length;i++){\n';
  html += '        var rr=data.results[i];\n';
  html += '        var o=bats[b][i];\n';
  html += '        all.push({isMatch:rr.isMatch,severity:rr.severity,issue:rr.issue,suggestions:rr.suggestions,subject:o.subject,grade:o.grade,comment:o.comment,teacher:o.teacher,studentName:o.studentName});\n';
  html += '      }\n';
  html += '    }catch(e){prog.style.display="none";setErr("שגיאה: "+e.message);document.getElementById("btn").disabled=false;return;}\n';
  html += '  }\n';
  html += '  document.getElementById("pb").style.width="100%";\n';
  html += '  document.getElementById("pl").textContent="סיום! נבדקו "+all.length+" מקצועות.";\n';
  html += '  setTimeout(function(){prog.style.display="none";},1500);\n';
  html += '  render(all);\n';
  html += '  document.getElementById("btn").disabled=false;\n';
  html += '}\n';
  html += 'function gc(g){return g>=90?"ga":g>=80?"gb":g>=70?"gc":g>=55?"gd":"gf";}\n';
  html += 'function setErr(m){var e=document.getElementById("er");e.style.display=m?"block":"none";e.textContent=m;}\n';
  html += 'function render(all){\n';
  html += '  var iss=all.filter(function(r){return !r.isMatch;});\n';
  html += '  var ok=all.filter(function(r){return r.isMatch;});\n';
  html += '  var h=\'<div class="grid"><div class="st sb"><div class="sn">\'+all.length+\'</div><div class="sl">מקצועות</div></div><div class="st sg"><div class="sn">\'+ok.length+\'</div><div class="sl">תקין</div></div><div class="st sr"><div class="sn">\'+iss.length+\'</div><div class="sl">לא תואם</div></div></div>\';\n';
  html += '  h+=\'<div style="text-align:left;margin-bottom:12px"><button class="exp" onclick="doCSV()">ייצא CSV</button></div>\';\n';
  html += '  h+=\'<div class="tabs"><button class="tab on" onclick="filt(\\\'a\\\',this)">הכל (\'+all.length+\')</button><button class="tab" onclick="filt(\\\'i\\\',this)">בעיות (\'+iss.length+\')</button><button class="tab" onclick="filt(\\\'o\\\',this)">תקין (\'+ok.length+\')</button></div>\';\n';
  html += '  if(!iss.length)h+=\'<div class="good">כל ההערות תואמות!</div>\';\n';
  html += '  for(var i=0;i<all.length;i++){\n';
  html += '    var r=all[i];\n';
  html += '    var cl=r.isMatch?"cok":(r.severity==="error"?"cer":"cwn");\n';
  html += '    var fc=r.isMatch?"ro":"ri";\n';
  html += '    h+=\'<div class="rc \'+cl+\' \'+fc+\'">\'+\n';
  html += '      \'<div class="rh"><div><div class="rn">\'+( r.subject||"—")+\'</div><div class="rm">\'+( r.studentName?"👤 "+r.studentName:"")+( r.teacher?" · "+r.teacher:"")+\'</div></div><span class="gp \'+gc(r.grade)+\'">ציון \'+r.grade+\'</span></div>\'+\n';
  html += '      \'<div class="lb">הערה</div><div class="cm">\'+r.comment+\'</div>\'+\n';
  html += '      (!r.isMatch?\'<div class="ib">⚠️ \'+r.issue+\'</div>\'+( r.suggestions&&r.suggestions.length?\'<div class="sb2"><div class="lb" style="color:#38a169">הצעות</div>\'+r.suggestions.map(function(s){return \'<div class="si">\'+s+\'</div>\';}).join("")+\'</div>\':"")+\n';
  html += '      "")+"</div>";\n';
  html += '  }\n';
  html += '  document.getElementById("res").innerHTML=h;\n';
  html += '  window._r=all;\n';
  html += '}\n';
  html += 'function filt(f,btn){\n';
  html += '  var tabs=document.querySelectorAll(".tab");\n';
  html += '  for(var i=0;i<tabs.length;i++)tabs[i].classList.remove("on");\n';
  html += '  btn.classList.add("on");\n';
  html += '  var cards=document.querySelectorAll(".rc");\n';
  html += '  for(var i=0;i<cards.length;i++){\n';
  html += '    var c=cards[i];\n';
  html += '    if(f==="a")c.classList.remove("hid");\n';
  html += '    else if(f==="i")c.classList.toggle("hid",c.classList.contains("ro"));\n';
  html += '    else c.classList.toggle("hid",c.classList.contains("ri"));\n';
  html += '  }\n';
  html += '}\n';
  html += 'function doCSV(){\n';
  html += '  if(!window._r)return;\n';
  html += '  var BOM="\\uFEFF";\n';
  html += '  var h="תלמיד,מקצוע,מורה,ציון,הערה,תקין?,בעיה,הצעות";\n';
  html += '  var lines=window._r.map(function(r){\n';
  html += '    return [r.studentName||"",r.subject||"",r.teacher||"",r.grade,\'"\'+r.comment.replace(/"/g,\'""\')+\'"\',r.isMatch?"כן":"לא",\'"\'+( r.issue||"").replace(/"/g,\'""\')+\'"\',\'"\'+(r.suggestions||[]).join(" | ").replace(/"/g,\'""\')+\'"\'  ].join(",");\n';
  html += '  });\n';
  html += '  var csv=BOM+h+"\\n"+lines.join("\\n");\n';
  html += '  var a=document.createElement("a");\n';
  html += '  a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));\n';
  html += '  a.download="דוח_תעודות.csv";\n';
  html += '  a.click();\n';
  html += '}\n';
  html += '<\/script>\n';
  html += '</body>\n';
  html += '</html>';
  return html;
}
