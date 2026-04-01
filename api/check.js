export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { rows } = req.body;
  if (!rows || !rows.length) return res.status(400).json({ error: 'No rows provided' });

  const tableText = rows.map((r, i) =>
    'שורה ' + (i+1) + ': תלמיד="' + (r.studentName||'?') + '" מקצוע="' + r.subject + '" ציון=' + r.grade + ' הערה="' + r.comment + '"'
  ).join('\n');

  const prompt = 'אתה עוזר למחנכת לבדוק תעודות תלמידים.\n\nכללי התאמה:\n- ציון 90+: הערה חיובית חובה. הערה לשיפור בלבד = error\n- ציון 75-89: הערה חיובית. הערה לשיפור בלבד = warning\n- ציון מתחת ל-60: חייב הערה לשיפור. הערה חיובית בלבד = error\n- "I believe you can do better" = הערה לשיפור\n- "You did a great job" = הערה חיובית\n\nהצעות חלופיות מהבנק:\nלציון גבוה: "לקחת חלק פעיל בשיעורים וגילית רצינות ואחריות" / "גילית ידע רב והפגנת שליטה מלאה בנושאים שנלמדו"\nלציון נמוך: "עליך לגלות יותר מוטיבציה ואחריות ללמידה" / "למידה עקבית, השקעת מאמצים והתמקדות בחומר ישפרו את ידיעותיך"\n\n' + tableText + '\n\nהחזר JSON בלבד ללא טקסט אחר:\n{"results":[{"row":1,"isMatch":true,"severity":"ok","issue":"","suggestions":[]}]}';

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
