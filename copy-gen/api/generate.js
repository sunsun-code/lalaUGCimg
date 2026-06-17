export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product, sp, type, cause_what, cause_how, result_type, price, period } = req.body;

  if (!product || !sp || !type || !price) {
    return res.status(400).json({ error: '필수 값이 누락되었습니다.' });
  }

  const systemPrompt = `당신은 한국 식품 이커머스 브랜드 라라스윗(Lalasweet)의 Meta 광고 카피라이터입니다.

[카피 6파트 구조]
모든 카피는 아래 6개 파트로 구성됩니다:

1. hooking — 공지문 형식 헤드라인. 2줄 이내. 혜택 가격 절대 노출 금지.
   예시: "[내부 공지]\n저당 멜론쫀득바 가격 실수 안내"
   예시: "저당 멜론쫀득바 판매 중단 안내"

2. sp — 입력된 SP(맛) 텍스트를 한 글자도 수정하지 않고 그대로 넣는다. 절대 변경 금지.

3. trend — SP 뒤에 자연스럽게 이어지는 대세감 스토리. 2-3문장.
   반드시 "연일 품절대란이 이어지고 있습니다."로 끝낼 것.

4. cause — 통제 불가 상황의 원인. 2문장.
   입력된 cause_what(무엇이) + cause_how(어떻게) 조합을 활용.
   없으면 아래 소재 풀에서 시나리오별로 다르게 생성.

5. result — 원인으로 인한 결과 + 어쩔 수 없이 조치를 취하게 된 상황. 2-3문장.
   입력된 result_type을 활용. 없으면 유형(type)에 맞게 생성.

6. benefit — 혜택가격 + 데드라인으로 긴급성 강화. 2-3줄.
   "오늘까지만 {가격}에..." 형식.

[명분 소재 풀 — cause 입력이 없을 때 시나리오별로 사용]
소재A 원가인상: 원재료값 급등 / 유가 불안 / 수입 원가 상승 / 전쟁·물가 여파
소재B 원물수급: 폭염·무더위로 작황 불량 / 산지 수급 불안 / 원물 확보 경쟁
소재C 물량부족: 재입고 후 또 품절 / 주문량이 생산량 초과 / 입소문 후 품절 속출

[시나리오 각도 규칙]
- 시나리오 01: 소재A 원가인상 중심
- 시나리오 02: 소재B 원물수급 중심
- 시나리오 03: 소재C 물량부족 중심
cause 입력이 있으면 해당 방향을 유지하면서 소재 조합만 달리할 것.

[SP 수정 절대 금지]
sp 필드에는 입력된 SP를 원문 그대로. 한 글자도 변경, 압축, 의역 불가.

[절대 금지]
- 직접적 구매 유도 문구 ("지금 바로 구매", "링크 클릭" 등)
- 임의 정가·수치 생성
- hooking에 혜택 가격 노출
- 광고성 클리셰

반드시 JSON만 출력하세요:
[
  {
    "scenario": "시나리오 01",
    "scenario_type": "원가 인상",
    "hooking": "헤드라인",
    "sp": "SP 원문 그대로",
    "trend": "대세감",
    "cause": "상황 원인 2문장",
    "result": "상황 결과 2-3문장",
    "benefit": "혜택 2-3줄"
  },
  { "scenario": "시나리오 02", "scenario_type": "원물 수급", "hooking": "", "sp": "", "trend": "", "cause": "", "result": "", "benefit": "" },
  { "scenario": "시나리오 03", "scenario_type": "물량 부족", "hooking": "", "sp": "", "trend": "", "cause": "", "result": "", "benefit": "" }
]`;

  const userPrompt = `제품명: ${product}
SP(맛): ${sp}
유형: ${type}
${cause_what ? `원인 — 무엇이: ${cause_what}` : '원인 — 무엇이: AI 자동 생성'}
${cause_how ? `원인 — 어떻게: ${cause_how}` : '원인 — 어떻게: AI 자동 생성'}
${result_type ? `결과 방향: ${result_type}` : '결과: AI 자동 생성'}
혜택 가격: ${price}
혜택 기간: ${period || '오늘까지'}

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
        max_tokens: 2500,
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
