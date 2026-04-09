export const config = { maxDuration: 60 };

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/* =========================================================
   Shared constants & utilities
   ========================================================= */
const SPIRIT_LABELS = {
  swan: '天鹅', leopard: '猎豹', butterfly: '蝴蝶', cat: '猫咪',
  peacock: '孔雀', deer: '小鹿', fox: '狐狸', iris: '鸢尾',
  wolf: '狼', rose: '玫瑰', owl: '猫头鹰', tiger: '老虎',
  dolphin: '海豚', crane: '鹤', moon: '月亮', flame: '火焰',
  rabbit: '兔子', bear: '熊', panda: '熊猫', koala: '考拉',
  lion: '狮子', penguin: '企鹅', eagle: '鹰', flamingo: '火烈鸟',
  unicorn: '独角兽', dragon: '龙', horse: '马', elephant: '大象',
  whale: '鲸鱼', turtle: '海龟', frog: '青蛙', bee: '蜜蜂',
  ladybug: '瓢虫', snail: '蜗牛', hedgehog: '刺猬', otter: '水獭',
  bat: '蝙蝠', parrot: '鹦鹉', octopus: '章鱼', fish: '鱼',
  shell: '贝壳', mushroom: '蘑菇', sunflower: '向日葵', tulip: '郁金香',
  hibiscus: '芙蓉', sun: '太阳', cloud: '云朵', snowflake: '雪花',
  sparkles: '星光', star: '星星', heart: '爱心', diamond: '钻石',
  crown: '王冠', clover: '三叶草', cactus: '仙人掌', leaf: '叶子',
  feather: '羽毛', rainbow: '彩虹', wave: '海浪', snowman: '雪人',
};

const SEASON_ZH = {
  'bright-spring': '明亮春', 'warm-spring': '暖春', 'light-spring': '柔春',
  'light-summer': '柔夏', 'cool-summer': '冷夏', 'soft-summer': '优雅夏',
  'warm-autumn': '暖秋', 'deep-autumn': '深秋', 'soft-autumn': '柔秋',
  'deep-winter': '深冬', 'cool-winter': '冷冬', 'bright-winter': '明亮冬',
};

const ALL_SEASONS = [
  'bright-spring', 'warm-spring', 'light-spring',
  'light-summer', 'cool-summer', 'soft-summer',
  'warm-autumn', 'deep-autumn', 'soft-autumn',
  'deep-winter', 'cool-winter', 'bright-winter',
];

const QUIZ_QUESTIONS = [
  { q: '走进空屋，第一眼希望看到？', options: ['极简留白', '秩序画廊', '复古沙龙', '原始自然'] },
  { q: '哪种材质让你感到最"安全"？', options: ['清冷金属', '挺括羊毛', '温暖羊绒', '灵动绸缎'] },
  { q: '向往哪种"光影氛围"？', options: ['黎明晨雾', '高光对比', '落日熔金', '柔焦月光'] },
  { q: '朋友如何形容你的"气场"？', options: ['高山雪水', '建筑线条', '秋日壁炉', '春日繁花'] },
  { q: '挑一张唱片封面？', options: ['黑白主义', '波普艺术', '油画质感', '胶片写真'] },
];

function buildQuizContext(quizAnswers) {
  return quizAnswers.map((ans, i) => {
    const q = QUIZ_QUESTIONS[i];
    return `${i + 1}. ${q.q} → ${q.options[ans]}`;
  }).join('\n');
}

async function callOpenRouter(messages, model = 'google/gemini-2.0-flash-001') {
  const apiKey = process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) throw new Error('API key not configured');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://season-me.vercel.app',
      'X-Title': 'Season Me',
    },
    body: JSON.stringify({ model, messages, max_tokens: 1000, temperature: 0.7 }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('OpenRouter error:', response.status, errBody);
    throw new Error(`OpenRouter ${response.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch {}
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
  throw new Error('Failed to parse AI response');
}

/* =========================================================
   SSE helper
   ========================================================= */
function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/* =========================================================
   STEP 1 — Personality Analysis (text)
   ========================================================= */
const PERSONALITY_SYSTEM = `你是一位善于洞察人格特质的审美心理学家，能从人的审美偏好中读懂其内心世界。

你必须严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "personalityType": "4个字的性格标签，如'清冷智性'、'温暖治愈'、'浪漫理想主义'",
  "coreTraits": ["特质1（3-4字）", "特质2", "特质3", "特质4"],
  "innerWorld": "描述用户内心世界的2-3句话。结合测验选择，描绘其审美底色和精神诉求。语气像写人物小传。80-120字",
  "strengths": "一句话概括用户最突出的审美优势。20-30字",
  "extroversion": "high/medium/low，基于审美选择的判断",
  "warmth": "high/medium/low，基于审美选择的判断",
  "styleDNA": [
    { "trait": "审美基因1（3-4字）", "description": "具体描述，20-30字" },
    { "trait": "审美基因2", "description": "具体描述" },
    { "trait": "审美基因3", "description": "具体描述" }
  ]
}`;

async function step1Personality({ quizAnswers, nickname, spirit }) {
  const spiritLabel = SPIRIT_LABELS[spirit] || spirit;
  const quizContext = buildQuizContext(quizAnswers);

  const userPrompt = `请根据以下用户的审美测验结果，分析其性格特质。

用户信息：
- 昵称：${nickname || '未知'}
- 审美灵兽：${spiritLabel}

审美测验结果：
${quizContext}

请从这些选择中解读用户的审美倾向、性格底色和内在精神诉求。`;

  const content = await callOpenRouter([
    { role: 'system', content: PERSONALITY_SYSTEM },
    { role: 'user', content: userPrompt },
  ]);

  return parseJSON(content);
}

/* =========================================================
   STEP 2 — Face & Skin Analysis (vision)
   ========================================================= */
const FACE_SYSTEM = `你是一位专业的个人色彩分析师，擅长基于人脸照片进行精准的色彩分析。

分析要求：
1. 观察发色（自然色，非染发色）
2. 观察瞳孔/虹膜颜色
3. 观察肤色底色（偏暖/偏冷/中性）
4. 判断肤色深浅
5. 想象在脸部周围放置同色系但不同明度的颜色（如浅桃粉 vs 玫瑰红 vs 酒红），观察哪种明度让肤色看起来最健康、最通透
6. 想象在脸部周围分别放置暖色系（如珊瑚橙）和冷色系（如冰蓝），观察哪种色温让肤色更提气

你必须严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "hairColor": "黑/深棕/浅棕/红棕/金/灰",
  "eyeColor": "深棕/浅棕/琥珀/绿/蓝/灰",
  "skinBaseTone": "偏暖/偏冷/中性",
  "skinDepth": "偏浅/中等/偏深",
  "skinValue": "高/中/低",
  "contrastLevel": "高对比（发色瞳色与肤色差异大）/ 中对比 / 低对比",
  "contrastResponse": "用同色系不同明度测试后，高明度色彩更显气色好 / 中明度色彩最和谐 / 低明度色彩更高级",
  "temperatureResponse": "暖色系更提气 / 冷色系更提气 / 无明显差异",
  "suggestedTemperature": "暖色系/冷色系/中性",
  "facialFeatures": "一句话描述面部特征和气质，15-25字",
  "avoidColors": ["应避免的颜色1", "应避免的颜色2", "应避免的颜色3"]
}`;

async function step2Face({ image }) {
  const content = await callOpenRouter([
    { role: 'system', content: FACE_SYSTEM },
    {
      role: 'user',
      content: [
        { type: 'text', text: '请仔细分析这张照片中人物的发色、瞳孔颜色、肤色及色彩特征。' },
        { type: 'image_url', image_url: { url: image, detail: 'low' } },
      ],
    },
  ], 'google/gemini-2.0-flash-001');

  return parseJSON(content);
}

/* =========================================================
   STEP 3 — Season Determination (rules + AI)
   ========================================================= */
function ruleBasedPreFilter(face, personality) {
  const warm = face.skinBaseTone === '偏暖' || face.suggestedTemperature === '暖色系';
  const cool = face.skinBaseTone === '偏冷' || face.suggestedTemperature === '冷色系';
  const bright = face.skinValue === '高' || face.contrastLevel === '高对比';
  const deep = face.skinDepth === '偏深' || face.skinValue === '低';
  const soft = !bright && !deep;
  const extroverted = personality.extroversion === 'high';
  const highWarmth = personality.warmth === 'high';

  const candidates = ALL_SEASONS.filter(s => {
    // Spring: warm + bright/soft
    if (s.includes('spring')) {
      if (!warm && !highWarmth) return false;
      if (s === 'bright-spring') return bright || extroverted;
      if (s === 'warm-spring') return warm || highWarmth;
      return soft; // light-spring
    }
    // Summer: cool + light/soft
    if (s.includes('summer')) {
      if (!cool && !soft) return false;
      if (s === 'light-summer') return bright || soft;
      if (s === 'cool-summer') return cool;
      return soft; // soft-summer
    }
    // Autumn: warm + deep/soft
    if (s.includes('autumn')) {
      if (!warm && !highWarmth) return false;
      if (s === 'deep-autumn') return deep;
      if (s === 'warm-autumn') return warm || highWarmth;
      return soft; // soft-autumn
    }
    // Winter: cool + deep/bright
    if (s.includes('winter')) {
      if (!cool && !deep) return false;
      if (s === 'deep-winter') return deep;
      if (s === 'cool-winter') return cool;
      return bright; // bright-winter
    }
    return false;
  });

  return candidates.length > 0 ? candidates : ALL_SEASONS.slice(0, 3);
}

const SEASON_CONFIRM_SYSTEM = `你是一位资深的个人色彩分析师，精通12季相理论。
你的任务是从给定的候选季相中，综合用户的脸部色彩特征和性格特质，选出最匹配的季相。

你必须严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "season": "候选季相ID之一",
  "reasoning": "一句话说明为什么选择这个季相，结合肤色和性格。20-40字",
  "confidence": "high/medium/low"
}`;

async function step3Season(face, personality) {
  const candidates = ruleBasedPreFilter(face, personality);
  const candidateZH = candidates.map(s => `${s}（${SEASON_ZH[s]}）`).join('、');

  const userPrompt = `请从以下候选季相中选出最匹配的一个。

候选季相：${candidateZH}

脸部色彩报告：
- 发色：${face.hairColor}
- 瞳孔颜色：${face.eyeColor}
- 肤色底色：${face.skinBaseTone}
- 肤色深浅：${face.skinDepth}
- 肤色明度：${face.skinValue}
- 对比度：${face.contrastLevel}
- 同色系明度反应：${face.contrastResponse}
- 色温反应：${face.temperatureResponse}

性格特征：
- 性格类型：${personality.personalityType}
- 核心特质：${(personality.coreTraits || []).join('、')}
- 外向程度：${personality.extroversion}
- 温暖程度：${personality.warmth}`;

  const content = await callOpenRouter([
    { role: 'system', content: SEASON_CONFIRM_SYSTEM },
    { role: 'user', content: userPrompt },
  ], 'google/gemini-2.0-flash-001');

  const result = parseJSON(content);
  result.candidates = candidates;
  return result;
}

/* =========================================================
   STEP 4 — Personalized Styling Recommendations
   ========================================================= */
const STYLING_SYSTEM = `你是一位顶尖的个人色彩穿搭顾问，精通12季相理论与个性化风格搭配。

请根据用户的色彩季相和性格特质，给出个性化穿搭建议。

你必须严格按照以下JSON格式回复，不要添加任何其他文字：
{
  "summary": "一句话总结该季相+性格的穿搭风格方向，15-25字",
  "recommendations": [
    {
      "scene": "场景名称，如'职场通勤'、'周末约会'、'日常休闲'",
      "pieces": ["推荐单品1", "推荐单品2", "推荐单品3"],
      "colorScheme": {
        "primary": "主色，如'海军蓝'",
        "secondary": "辅色，如'珍珠白'",
        "accent": "点缀色，如'珊瑚粉'"
      },
      "tip": "一句穿搭技巧建议，20-40字",
      "why": "为什么适合这个人，结合季相和性格。20-40字"
    }
  ],
  "colorGuide": {
    "bestColors": ["最佳颜色1", "最佳颜色2", "最佳颜色3", "最佳颜色4"],
    "goodColors": ["不错颜色1", "不错颜色2", "不错颜色3"],
    "cautionColors": ["需谨慎颜色1", "需谨慎颜色2"]
  },
  "signatureLook": "该用户的标志性穿搭风格描述，30-50字"
}`;

async function step4Styling(season, personality) {
  const seasonZH = SEASON_ZH[season] || season;
  const userPrompt = `请为以下用户定制穿搭方案：

色彩季相：${season}（${seasonZH}）
性格类型：${personality.personalityType}
核心特质：${(personality.coreTraits || []).join('、')}
审美优势：${personality.strengths || '未知'}
风格基因：${(personality.styleDNA || []).map(d => d.trait).join('、') || '未知'}

请给出 4-6 条覆盖不同场景的穿搭建议，每条要具体到单品和颜色。`;

  const content = await callOpenRouter([
    { role: 'system', content: STYLING_SYSTEM },
    { role: 'user', content: userPrompt },
  ], 'anthropic/claude-sonnet-4-20250514');

  return parseJSON(content);
}

/* =========================================================
   Main Handler — SSE Pipeline
   ========================================================= */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const { quizAnswers, nickname, spirit, image } = req.body || {};
  let personality, face, seasonResult, styling;
  let hasError = false;

  try {
    // --- Steps 1+2 in parallel ---
    sse(res, 'progress', { step: 1, status: 'analyzing', message: '分析你的审美密码...' });
    sse(res, 'progress', { step: 2, status: 'analyzing', message: '读取你的色彩信息...' });

    const [p1, p2] = await Promise.allSettled([
      step1Personality({ quizAnswers, nickname, spirit }),
      step2Face({ image }),
    ]);

    if (p1.status === 'fulfilled') {
      personality = p1.value;
      sse(res, 'step_result', { step: 1, data: personality });
    } else {
      console.error('Step 1 failed:', p1.reason?.message);
      sse(res, 'step_error', { step: 1, error: p1.reason?.message });
    }

    if (p2.status === 'fulfilled') {
      face = p2.value;
      sse(res, 'step_result', { step: 2, data: face });
    } else {
      console.error('Step 2 failed:', p2.reason?.message);
      sse(res, 'step_error', { step: 2, error: p2.reason?.message });
    }

    // --- Step 3: Season determination ---
    if (personality && face) {
      sse(res, 'progress', { step: 3, status: 'narrowing', message: '锁定你的色彩季相...' });
      seasonResult = await step3Season(face, personality);
      sse(res, 'step_result', { step: 3, data: seasonResult });
    } else {
      // Fallback: use quiz dims only
      console.warn('Step 3 skipped: missing personality or face data');
      const seasonId = 'cool-summer'; // safe default
      seasonResult = { season: seasonId, reasoning: '分析数据不完整，使用默认季相', confidence: 'low', candidates: [seasonId] };
      sse(res, 'step_result', { step: 3, data: seasonResult });
    }

    // --- Step 4: Styling recommendations ---
    if (personality && seasonResult) {
      sse(res, 'progress', { step: 4, status: 'recommending', message: '为你定制穿搭方案...' });
      try {
        styling = await step4Styling(seasonResult.season, personality);
        sse(res, 'step_result', { step: 4, data: styling });
      } catch (err) {
        console.error('Step 4 failed:', err.message);
        sse(res, 'step_error', { step: 4, error: err.message });
      }
    }

    // --- Done ---
    sse(res, 'done', {
      season: seasonResult?.season,
      personality: personality || null,
      faceReport: face || null,
      seasonReasoning: seasonResult || null,
      styling: styling || null,
    });
  } catch (err) {
    console.error('Pipeline error:', err);
    sse(res, 'error', { error: err.message });
    hasError = true;
  }

  res.end();
}
