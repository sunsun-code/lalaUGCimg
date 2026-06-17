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

{중단 명분 — 아래 명분 생성 규칙 참고, 2문장}
이에 따라 판매 중단을 결정하게 되었습니다.

저렴한 원재료로 대체하거나 품질과 타협하는 대신,
그동안 찾아주셨던 분들께 사과의 마음으로
오늘까지만 {혜택}에 드립니다.

감사합니다.
---

[가격인상형 고정 템플릿]
---
{제품명} 가격 인상 안내

안녕하세요, 라라스윗입니다.

{대세감 — 2-3문장, 스토리처럼}
연일 품절대란이 이어지고 있습니다.

{인상 명분 — 아래 명분 생성 규칙 참고, 2문장}
이에 따라 가격 인상을 결정하게 되었습니다.

그동안의 성원에 보답하는 의미로 본사 손해를 감수하고
오늘까지만 {혜택}으로 구매하실 수 있도록 준비했습니다.

내일 즉시 정상가로 복귀 예정입니다.
감사합니다.
---

[명분 생성 규칙 — 판매중단형 / 가격인상형에만 해당]
입력된 명분 키워드가 있으면 그것을 기반으로 활용하고, 없으면 아래 3가지 소재 풀에서 조합하여 창의적으로 생성합니다.

소재 풀:
- 원가인상: 원재료값 급등, 유가 불안, 수입 원가 상승, 전쟁/물가 여파
- 원물수급: 폭염·무더위로 작황 불량, 산지 수급 불안정, 높은 인기로 원물 확보 경쟁
- 물량부족: 재입고 후 또 품절 반복, 주문량이 생산량 초과, SNS 입소문 후 물량 한계

시나리오별 명분 조합 규칙 (명분 입력값이 없을 때):
- 시나리오 A: 원가인상 소재 중심으로 조합
- 시나리오 B: 원물수급 소재 중심으로 조합
- 시나리오 C: 물량부족 소재 중심으로 조합

명분 문장 작성 원칙:
- 브랜드가 어쩔 수 없는 상황임을 자연스럽게 전달
- 억울하지만 진짜 통제 불가능한 느낌
- 2문장, 구체적이고 신뢰감 있게 작성

[SP 사용 규칙 — 절대 준수]
- 입력된 SP(맛) 텍스트는 단 한 글자도 수정하거나 재해석하지 않습니다
- p2 필드에서 SP 원문을 그대로 인용한 뒤, 대세감 스토리로 자연스럽게 이어갑니다
- 예시: 입력 SP가 "딸기 씨가 톡톡 씹혀 상큼달달 그 자체"라면
  → p2는 "딸기 씨가 톡톡 씹혀 상큼달달 그 자체라는 입소문이 퍼지면서..." 처럼 시작
- SP 텍스트를 압축·요약·의역하는 것 모두 금지

[대세감 작성 원칙]
- SP 원문 그대로 인용하여 시작
- 스토리처럼 자연스럽게 흘러야 함: SP 원문 → 인기/바이럴 → 품절
- 마지막은 항상 "연일 품절대란이 이어지고 있습니다."로 끝
- p1 필드는 항상 빈 문자열로 둘 것

[절대 금지]
- 템플릿 구조 변경 금지
- SP 텍스트 임의 수정 금지 (원문 그대로만 사용)
- "이 링크에서 챙겨가세요", "지금 바로 구매하세요" 등 직접적 구매 유도 문구
- 임의로 정가나 수치를 만들어내는 것 (입력값에 있는 것만 사용)
- 광고성 클리셰

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
[
  {
    "scenario": "시나리오 A",
    "headline": "헤드라인 (예: [내부 공지]\\n{제품명} 가격 실수 안내)",
    "greeting": "인사말 또는 빈 문자열",
    "p1": "",
    "p2": "SP 원문 그대로 인용하여 시작하는 대세감 단락. 마지막은 '연일 품절대란이 이어지고 있습니다.'로 끝.",
    "p3": "명분 2문장 (시나리오별로 다른 소재 조합)",
    "p4": "혜택/긴급성 문장",
    "closing": "감사 인사 또는 빈 문자열"
  },
  { "scenario": "시나리오 B", "headline": "", "greeting": "", "p1": "", "p2": "", "p3": "", "p4": "", "closing": "" },
  { "scenario": "시나리오 C", "headline": "", "greeting": "", "p1": "", "p2": "", "p3": "", "p4": "", "closing": "" }
]`;

  const userPrompt = `유형: ${typeLabel}
제품명: ${product}
맛 (SP): ${sp}
${hype ? `대세감: ${hype}` : ''}
${reason ? `명분 힌트: ${reason}` : '명분: 없음 — 시나리오별로 원가인상/원물수급/물량부족 소재 조합하여 자동 생성'}
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
