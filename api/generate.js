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

아래 검증된 템플릿 구조를 반드시 지키되, {제품명}, {대세감}, {혜택}만 입력값으로 채워주세요.

[직원실수형 고정 템플릿]
---
[내부 공지]
{제품명} 가격 실수 안내

{대세감 — 2-3문장, 스토리처럼 자연스럽게 흘러가야 함}
연일 품절대란이 이어지고 있습니다.

그런데 금일 가격 설정 과정에서 직원 실수로
역대급 최저가 99% 할인으로 적용된 상태입니다.

오늘까지만 {혜택} 판매 유지 후
내일 즉시 정상가로 복구될 예정입니다.
---

[판매중단형 고정 템플릿]
---
{제품명} 판매 중단 안내

안녕하십니까, 라라스윗 운영본부입니다.

{대세감 — 2-3문장, 스토리처럼}
연일 품절대란이 이어지고 있습니다.

{중단 명분 — 원재료/원물수급/원가인상 중 하나, 2문장}
이에 따라 판매 중단을 결정하게 되었습니다.

저렴한 원재료로 대체하거나 품질과 타협하는 대신,
그동안 찾아주셨던 분들의 사과의 마음으로
오늘까지만 {혜택}에 드립니다.

감사합니다.
---

[가격인상형 고정 템플릿]
---
{제품명} 가격 인상 안내

안녕하세요, 라라스윗입니다.

{대세감 — 2-3문장, 스토리처럼}
연일 품절대란이 이어지고 있습니다.

{인상 명분 — 원재료/폭염/원가인상 중 하나, 2문장}
이에 따라 가격 인상을 결정하게 되었습니다.

그동안의 성원에 보답하는 의미로 본사 손해를 감수하고
오늘까지만 {혜택}으로 구매하실 수 있도록 준비했습니다.

내일 즉시 정상가로 복귀 예정입니다.
감사합니다.
---

[대세감 작성 원칙 — 반드시 지킬 것]
- SP와 대세감을 하나의 단락으로 자연스럽게 이어서 작성
- SP(맛 묘사) → 대세감 스토리 → "연일 품절대란이 이어지고 있습니다." 순서
- 제품명을 따옴표나 꺾쇠로 다시 언급하지 말 것
- 문장은 짧고 끊어서 읽히게, 너무 길게 이어붙이지 말 것
- p1 필드는 반드시 빈 문자열 ""

[p2 작성 예시 — 이 톤과 길이를 따라할 것]
입력: SP="SNS에서 난리난 노을멜론처럼, 주황빛 멜론 과육 가득이라 쫀득해서 더 맛있다" / 대세감="출시 즉시 품절, 인플루언서 샤라웃"
올바른 p2: "SNS에서 난리난 노을멜론처럼 찐하고 고급진 맛으로 대형 편의점에 단독 입점 했는데 인플루언서들까지 사라웃 해 연일 품절대란이 이어지고 있습니다."
잘못된 p2: "SNS에서 난리난 노을멜론처럼, 주황빛 멜론 과육 가득이라 쫀득해서 더 맛있는 '멜론 쫀득바'가 출시 즉시 품절이 되며 인플루언서들까지 사라웃해 SNS 조회수가 터진 이후 수요가 급증하고 있습니다. 연일 품절대란이 이어지고 있습니다."

[절대 금지]
- 템플릿 구조 변경 금지
- "이 링크에서 챙겨가세요", "지금 바로 구매하세요", "서둘러주세요" 등 직접적 구매 유도
- 임의로 정가나 수치를 만들어내는 것 (입력값에 있는 것만 사용)
- 광고성 클리셰
- p2에서 제품명을 따옴표/꺾쇠로 다시 언급하는 것
- 문장을 너무 길게 이어붙이는 것

시나리오 3개를 대세감 조합을 달리해서 작성하세요:
- 시나리오 A: 입력된 대세감 키워드 그대로 활용
- 시나리오 B: 입력된 키워드 + 물량부족 각도 추가
- 시나리오 C: 입력된 키워드 + 바이럴 각도 추가

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
[
  {
    "scenario": "시나리오 A",
    "headline": "헤드라인 (예: [내부 공지]\\n{제품명} 가격 실수 안내)",
    "greeting": "인사말 또는 빈 문자열",
    "p1": "",
    "p2": "SP와 대세감을 하나의 자연스러운 단락으로 통합. SP(맛 묘사)로 시작해서 대세감 스토리로 흘러가고 '연일 품절대란이 이어지고 있습니다.'로 끝. 예: 'SNS에서 난리난 노을멜론처럼 찐하고 고급진 맛으로 대형 편의점에 단독 입점 했는데 인플루언서들까지 사라웃 해 연일 품절대란이 이어지고 있습니다.'",
    "p3": "상황/명분 2문장",
    "p4": "혜택/긴급성",
    "closing": "감사 인사 또는 빈 문자열"
  },
  { "scenario": "시나리오 B", "headline": "", "greeting": "", "p1": "", "p2": "", "p3": "", "p4": "", "closing": "" },
  { "scenario": "시나리오 C", "headline": "", "greeting": "", "p1": "", "p2": "", "p3": "", "p4": "", "closing": "" }
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
