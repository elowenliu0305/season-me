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
  'bright-spring': '明亮春', 'warm-spring': '暖春', 'light-spring': '浅春',
  'light-summer': '浅夏', 'cool-summer': '冷夏', 'soft-summer': '柔夏',
  'warm-autumn': '暖秋', 'deep-autumn': '深秋', 'soft-autumn': '柔秋',
  'deep-winter': '深冬', 'cool-winter': '冷冬', 'bright-winter': '明亮冬',
};

const ALL_SEASONS = [
  'bright-spring', 'warm-spring', 'light-spring',
  'light-summer', 'cool-summer', 'soft-summer',
  'warm-autumn', 'deep-autumn', 'soft-autumn',
  'deep-winter', 'cool-winter', 'bright-winter',
];

const SEASON_COLOR_GUIDES = {
  'bright-spring': {
    bestColors: ['珊瑚粉', '亮桃色', '清亮黄绿', '明亮暖白'],
    goodColors: ['番茄红', '金盏橙', '鲜草绿'],
    cautionColors: ['灰紫色', '浊棕色', '暗酒红'],
  },
  'warm-spring': {
    bestColors: ['蜜桃色', '杏橙色', '暖象牙白', '嫩金色'],
    goodColors: ['珊瑚红', '浅驼色', '苔绿色'],
    cautionColors: ['冰蓝色', '冷灰色', '黑色'],
  },
  'light-spring': {
    bestColors: ['浅桃粉', '奶油黄', '浅杏色', '暖薄荷绿'],
    goodColors: ['象牙白', '浅珊瑚', '淡金色'],
    cautionColors: ['深棕色', '酒红色', '纯黑色'],
  },
  'light-summer': {
    bestColors: ['粉灰色', '薰衣草紫', '冰蓝色', '珍珠白'],
    goodColors: ['浅玫瑰粉', '雾蓝色', '银灰色'],
    cautionColors: ['橘黄色', '焦糖棕', '荧光色'],
  },
  'cool-summer': {
    bestColors: ['玫瑰灰', '烟蓝色', '冷粉色', '蓝紫色'],
    goodColors: ['石板蓝', '柔白色', '银色'],
    cautionColors: ['暖橙色', '土黄色', '金棕色'],
  },
  'soft-summer': {
    bestColors: ['雾玫瑰', '蓝灰色', '灰粉色', '柔紫色'],
    goodColors: ['鼠尾草绿', '浅茶灰', '柔海军蓝'],
    cautionColors: ['纯黑色', '高饱和红', '荧光黄'],
  },
  'warm-autumn': {
    bestColors: ['南瓜橙', '焦糖色', '橄榄绿', '暖砖红'],
    goodColors: ['咖啡棕', '芥末黄', '奶油白'],
    cautionColors: ['冰粉色', '冷蓝色', '银灰色'],
  },
  'deep-autumn': {
    bestColors: ['深咖啡', '酒红色', '墨绿色', '铜棕色'],
    goodColors: ['深橄榄', '铁锈红', '暖黑色'],
    cautionColors: ['浅粉色', '冰蓝色', '荧光白'],
  },
  'soft-autumn': {
    bestColors: ['驼色', '粉棕色', '鼠尾草绿', '柔橄榄绿'],
    goodColors: ['摩卡色', '杏仁色', '锈金色'],
    cautionColors: ['纯黑色', '冷玫红', '冰紫色'],
  },
  'deep-winter': {
    bestColors: ['纯黑色', '酒红色', '宝石蓝', '深紫色'],
    goodColors: ['墨绿色', '冷白色', '莓果色'],
    cautionColors: ['浅米色', '暖橙色', '粉蜡笔色'],
  },
  'cool-winter': {
    bestColors: ['冰蓝色', '纯白色', '钢灰色', '蓝红色'],
    goodColors: ['冷紫色', '海军蓝', '银色'],
    cautionColors: ['金黄色', '橘棕色', '暖驼色'],
  },
  'bright-winter': {
    bestColors: ['正红色', '宝蓝色', '翠绿色', '纯白色'],
    goodColors: ['品红色', '亮紫色', '黑色'],
    cautionColors: ['灰驼色', '雾粉色', '浊橄榄绿'],
  },
};

const QUIZ_QUESTIONS = [
  { q: '走进空屋，第一眼希望看到？', options: ['极简留白', '秩序画廊', '复古沙龙', '原始自然'] },
  { q: '哪种材质让你感到最"安全"？', options: ['清冷金属', '挺括羊毛', '温暖羊绒', '灵动绸缎'] },
  { q: '向往哪种"光影氛围"？', options: ['黎明晨雾', '高光对比', '落日熔金', '柔焦月光'] },
  { q: '朋友如何形容你的"气场"？', options: ['高山雪水', '建筑线条', '秋日壁炉', '春日繁花'] },
  { q: '挑一张唱片封面？', options: ['黑白主义', '波普艺术', '油画质感', '胶片写真'] },
];

const QUIZ_DIMS = [
  [{ E: 0.8, O: 0.8 }, { E: 0.6, O: 0.9 }, { E: 0.4, O: 0.3 }, { E: 0.2, O: 0.2 }],
  [{ T: -0.8, X: 0.8 }, { T: 0.2, X: 0.9 }, { T: 0.9, X: 0.3 }, { T: 0.4, X: -0.6 }],
  [{ T: -0.6, E: -0.4 }, { E: 0.9, O: 0.8 }, { T: 0.9, E: 0.6 }, { E: -0.5, T: 0.1 }],
  [{ T: -0.8, E: -0.4 }, { O: 0.9, E: 0.2 }, { T: 0.8, E: 0.5 }, { E: 0.7, T: 0.3 }],
  [{ O: 0.8, E: -0.4 }, { E: 0.9, T: 0.3 }, { T: 0.5, X: -0.4 }, { E: -0.3, T: -0.2 }],
];

function buildQuizContext(quizAnswers) {
  return quizAnswers.map((ans, i) => {
    const q = QUIZ_QUESTIONS[i];
    return `${i + 1}. ${q.q} → ${q.options[ans]}`;
  }).join('\n');
}

function getQuizProfile(quizAnswers) {
  const totals = { T: 0, E: 0, O: 0, X: 0 };
  let count = 0;

  (quizAnswers || []).forEach((answer, index) => {
    const dims = QUIZ_DIMS[index]?.[answer];
    if (!dims) return;
    count += 1;
    Object.entries(dims).forEach(([key, value]) => {
      totals[key] += value;
    });
  });

  if (!count) return { T: 0, E: 0, O: 0, X: 0, count: 0 };
  return {
    T: totals.T / count,
    E: totals.E / count,
    O: totals.O / count,
    X: totals.X / count,
    count,
  };
}

function seasonFromQuiz(quizAnswers) {
  const p = getQuizProfile(quizAnswers);
  if (!p.count) return 'soft-summer';

  const warm = p.T > 0.18;
  const cool = p.T < -0.18;
  const bright = p.E > 0.35 || p.O > 0.65;
  const deep = p.E < -0.15 || p.O > 0.72;
  const soft = p.X < -0.1 || (!bright && !deep);

  if (warm) {
    if (deep && p.O > 0.55) return 'deep-autumn';
    if (bright && p.E > 0.5) return 'bright-spring';
    if (soft) return 'soft-autumn';
    return 'warm-spring';
  }

  if (cool) {
    if (deep && p.O > 0.55) return 'deep-winter';
    if (bright && p.E > 0.45) return 'bright-winter';
    if (soft || p.X > 0.35) return 'soft-summer';
    return 'cool-winter';
  }

  if (bright) return p.E > 0.55 ? 'bright-spring' : 'bright-winter';
  if (deep) return p.T >= 0 ? 'deep-autumn' : 'deep-winter';
  return p.T >= 0 ? 'light-spring' : 'light-summer';
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
  const raw = String(text || '').trim();
  try { return JSON.parse(raw); } catch {}

  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim());

  const objectStart = raw.indexOf('{');
  const objectEnd = raw.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    return JSON.parse(raw.slice(objectStart, objectEnd + 1));
  }

  const arrayStart = raw.indexOf('[');
  const arrayEnd = raw.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return JSON.parse(raw.slice(arrayStart, arrayEnd + 1));
  }

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

function buildFallbackPersonality({ quizAnswers, nickname, spirit }) {
  const spiritLabel = SPIRIT_LABELS[spirit] || spirit || '自我图腾';
  const answered = Array.isArray(quizAnswers) ? quizAnswers.filter(Boolean).length : 0;
  const nameHint = nickname ? `${nickname}的` : '';

  return {
    personalityType: '审美探索者',
    coreTraits: ['敏感', '直觉', '自洽', '开放'],
    innerWorld: `${nameHint}审美选择呈现出一种正在向内观看的状态。${spiritLabel}像一个精神线索，说明你更在意气质的完整性，而不只是单个流行元素。当前已读取${answered}组测验选择，适合用更细腻的色彩与廓形继续确认个人风格。`,
    strengths: '能从细节中感知氛围，并把外在风格和内在状态连接起来。',
    extroversion: 'medium',
    warmth: 'medium',
    styleDNA: [
      { trait: '直觉审美', description: '更相信整体氛围带来的第一感受。' },
      { trait: '自我观看', description: '会在风格中寻找与内在状态一致的表达。' },
      { trait: '柔性调整', description: '适合在稳定基调上逐步尝试变化。' },
    ],
  };
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
        { type: 'image_url', image_url: { url: image, detail: 'high' } },
      ],
    },
  ], 'anthropic/claude-sonnet-4');

  return parseJSON(content);
}

/* =========================================================
   STEP 3 — Season Determination (rules + AI)
   ========================================================= */
function hasText(value, pattern) {
  return String(value || '').includes(pattern);
}

function ruleBasedPreFilter(face) {
  const warm = hasText(face.skinBaseTone, '暖') || hasText(face.suggestedTemperature, '暖') || hasText(face.temperatureResponse, '暖');
  const cool = hasText(face.skinBaseTone, '冷') || hasText(face.suggestedTemperature, '冷') || hasText(face.temperatureResponse, '冷');
  const bright = hasText(face.skinValue, '高') || hasText(face.contrastLevel, '高对比') || hasText(face.contrastResponse, '高明度');
  const deep = hasText(face.skinDepth, '偏深') || hasText(face.skinValue, '低') || hasText(face.contrastResponse, '低明度');
  const soft = !bright && !deep;
  const neutral = !warm && !cool;

  const candidates = ALL_SEASONS.filter(s => {
    // Spring: warm + bright/soft
    if (s.includes('spring')) {
      if (!warm && !neutral) return false;
      if (s === 'bright-spring') return bright;
      if (s === 'warm-spring') return warm;
      return soft; // light-spring
    }
    // Summer: cool + light/soft
    if (s.includes('summer')) {
      if (!cool && !neutral) return false;
      if (s === 'light-summer') return bright || soft;
      if (s === 'cool-summer') return cool;
      return soft; // soft-summer
    }
    // Autumn: warm + deep/soft
    if (s.includes('autumn')) {
      if (!warm && !neutral) return false;
      if (s === 'deep-autumn') return deep;
      if (s === 'warm-autumn') return warm;
      return soft; // soft-autumn
    }
    // Winter: cool + deep/bright
    if (s.includes('winter')) {
      if (!cool && !neutral) return false;
      if (s === 'deep-winter') return deep;
      if (s === 'cool-winter') return cool;
      return bright; // bright-winter
    }
    return false;
  });

  return candidates.length > 0 ? candidates : ALL_SEASONS.slice(0, 3);
}

function seasonFromFace(face, quizAnswers) {
  if (!face) return seasonFromQuiz(quizAnswers);

  const warm = hasText(face.skinBaseTone, '暖') || hasText(face.suggestedTemperature, '暖') || hasText(face.temperatureResponse, '暖');
  const cool = hasText(face.skinBaseTone, '冷') || hasText(face.suggestedTemperature, '冷') || hasText(face.temperatureResponse, '冷');
  const bright = hasText(face.skinValue, '高') || hasText(face.contrastLevel, '高对比') || hasText(face.contrastResponse, '高明度');
  const deep = hasText(face.skinDepth, '偏深') || hasText(face.skinValue, '低') || hasText(face.contrastResponse, '低明度');
  const soft = !bright && !deep;
  const quizSeason = seasonFromQuiz(quizAnswers);

  if (warm) {
    if (deep) return 'deep-autumn';
    if (bright) return 'bright-spring';
    if (soft) return quizSeason.includes('spring') ? 'light-spring' : 'soft-autumn';
    return 'warm-spring';
  }

  if (cool) {
    if (deep) return 'deep-winter';
    if (bright) return 'bright-winter';
    if (soft) return quizSeason.includes('winter') ? 'cool-winter' : 'soft-summer';
    return 'cool-summer';
  }

  return quizSeason;
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
  const candidates = ruleBasedPreFilter(face);
  const candidateZH = candidates.map(s => `${s}（${SEASON_ZH[s]}）`).join('、');

  const userPrompt = `请从以下候选季相中选出最匹配的一个。

重要：季相判断必须主要依据脸部色彩特征（肤色底色、明度、深浅、对比度、冷暖反应）。性格特质只能作为同等色彩证据下的微弱参考，不能推翻肤色冷暖与明度证据。

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
  if (!candidates.includes(result.season)) {
    result.season = candidates[0];
    result.confidence = 'low';
    result.reasoning = 'AI返回不在候选范围内，已按色彩规则选择最接近季相';
  }
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

async function step4Styling(season, personality, face) {
  const seasonZH = SEASON_ZH[season] || season;
  const guide = SEASON_COLOR_GUIDES[season] || SEASON_COLOR_GUIDES['cool-summer'];
  const userPrompt = `请为以下用户定制穿搭方案：

色彩季相：${season}（${seasonZH}）
固定色彩边界：
- 最佳颜色：${guide.bestColors.join('、')}
- 可用颜色：${guide.goodColors.join('、')}
- 谨慎颜色：${guide.cautionColors.join('、')}
脸部色彩证据：
- 肤色底色：${face?.skinBaseTone || '未知'}
- 肤色明度：${face?.skinValue || '未知'}
- 对比度：${face?.contrastLevel || '未知'}
性格类型：${personality.personalityType}
核心特质：${(personality.coreTraits || []).join('、')}
审美优势：${personality.strengths || '未知'}
风格基因：${(personality.styleDNA || []).map(d => d.trait).join('、') || '未知'}

请给出 4-6 条覆盖不同场景的穿搭建议，每条要具体到单品和颜色。颜色建议必须严格围绕上面的固定色彩边界，不要推荐谨慎颜色作为主色。`;

  const content = await callOpenRouter([
    { role: 'system', content: STYLING_SYSTEM },
    { role: 'user', content: userPrompt },
  ], 'anthropic/claude-sonnet-4');

  const result = parseJSON(content);
  result.colorGuide = guide;
  return result;
}

/* =========================================================
   Main Handler — SSE Pipeline
   ========================================================= */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
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
      personality = buildFallbackPersonality({ quizAnswers, nickname, spirit });
      sse(res, 'step_result', { step: 1, data: personality });
    }

    if (p2.status === 'fulfilled') {
      face = p2.value;
      sse(res, 'step_result', { step: 2, data: face });
    } else {
      console.error('Step 2 failed:', p2.reason?.message);
      sse(res, 'step_error', { step: 2, error: p2.reason?.message });
    }

    // --- Step 3: Season determination ---
    if (face) {
      sse(res, 'progress', { step: 3, status: 'narrowing', message: '锁定你的色彩季相...' });
      try {
        seasonResult = await step3Season(face, personality);
      } catch (err) {
        console.error('Step 3 failed:', err.message);
        const seasonId = seasonFromFace(face, quizAnswers);
        seasonResult = {
          season: seasonId,
          reasoning: 'AI季相确认暂时失败，已根据照片色彩特征和测验选择生成备用判断',
          confidence: face ? 'medium' : 'low',
          candidates: ruleBasedPreFilter(face),
        };
      }
      const canonicalGuide = SEASON_COLOR_GUIDES[seasonResult.season];
      if (canonicalGuide && face) {
        face.avoidColors = canonicalGuide.cautionColors;
      }
      sse(res, 'step_result', { step: 3, data: seasonResult });
    } else {
      // Fallback: use quiz dims only
      console.warn('Step 3 skipped: missing face data');
      const seasonId = seasonFromQuiz(quizAnswers);
      seasonResult = {
        season: seasonId,
        reasoning: '照片色彩数据暂时不可用，已根据测验选择生成备用季相',
        confidence: 'low',
        candidates: [seasonId],
      };
      sse(res, 'step_result', { step: 3, data: seasonResult });
    }

    // --- Step 4: Styling recommendations ---
    if (personality && seasonResult) {
      sse(res, 'progress', { step: 4, status: 'recommending', message: '为你定制穿搭方案...' });
      try {
        styling = await step4Styling(seasonResult.season, personality, face);
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
