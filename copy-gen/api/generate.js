export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product, sp, hype, reason, price, period, narrativeType, situation } = req.body;

  if (!product || !sp || !narrativeType || !price) {
    return res.status(400).json({ error: '필수 값이 누락되었습니다.' });
  }

  const typeMap = { mistake: '직원실수형', discontinue: '판매중단형', price_up: '가격인상형' };
  const typeLabel = typeMap[narrativeType] || narrativeType;

  const systemPrompt = `당신은 한국 식품 이커머스 브랜드 라라스윗(Lalasweet)의 Meta 광고 카피라이터입니다.
실제 성과가 검증된 공지문 패턴을 기반으로 카피 3개를 작성합니다.

[공지문 파트 구조]
- 파트1 (제품/맛): 이 제품이 왜 특별한지 — SP 묘사
- 파트2 (대세감): 얼마나 잘 팔리는지 — 사회적 증거
- 파트3 (상황/명분): 왜 이 가격인지 — 실수/중단/인상 경위
- 파트4 (긴급성): 오늘까지만 — 손실회피 마무리

[유형별 헤드라인 패턴]
직원실수형: [내부 공지] {제품명} 가격 실수 안내
판매중단형: {제품명} 판매 중단 안내
가격인상형: {제품명} 가격 인상 안내

[스타일 가이드]
- 진짜 사내 공지문처럼. 광고가 아니라 사실 전달이 목적인 것처럼 느껴져야 함
- 자연스럽고 인간적인 브랜드 목소리 (공문 느낌이지만 따뜻함)
- 각 파트는 1-3문장 내외로 간결하게
- 인사말은 파트1 앞에 한 줄 ("안녕하세요, 라라스윗입니다." 등)
- 감사 인사는 파트4 뒤에 한 줄

[절대 금지]
- "이 링크에서 챙겨가세요", "지금 바로 구매하세요" 같은 직접적인 구매 유도 문구
- "놓치지 마세요", "지금이 기회입니다" 같은 광고성 클리셰
- 사실 전달 범위를 벗어나는 과장된 감탄 표현

시나리오 3개를 각도를 달리해서 작성하세요:
- 시나리오 A: 담백하고 공식적인 톤
- 시나리오 B: 조금 더 인간적이고 솔직한 톤  
- 시나리오 C: 제품 매력을 좀 더 앞세운 톤

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
[
  {
    "scenario": "시나리오 A — 공식 톤",
    "headline": "헤드라인",
    "greeting": "인사말",
    "p1": "파트1 제품/맛 묘사",
    "p2": "파트2 대세감",
    "p3": "파트3 상황/명분",
    "p4": "파트4 긴급성",
    "closing": "감사 인사"
  },
  { ... 시나리오 B ... },
  { ... 시나리오 C ... }
]`;

  const userPrompt = `유형: ${typeLabel}
제품명: ${product}
맛 (SP): ${sp}
${hype ? `대세감: ${hype}` : ''}
${reason ? `명분: ${reason}` : ''}
혜택 가격: ${price}
혜택 기간: ${period || '오늘까지'}
${situation ? `상황 설명: ${situation}` : ''}

3개 시나리오를 JSON으로 작성해주세요.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'API 오류' });
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || '';
    text = text.replace(/```json|```/g, '').trim();
    const scenarios = JSON.parse(text);
    return res.status(200).json({ scenarios });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
