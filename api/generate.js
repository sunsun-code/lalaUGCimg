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

[공지문의 핵심 원리]
이 공지문은 "판매자도 어쩔 수 없는 상황이 발생해 손해를 감수하고 판매를 잠시 중단하거나 가격을 조정한다"는 구조입니다.
핵심 심리: 통제 불가 상황 → FOMO 극대화 → 지금 사지 않으면 안 될 것 같은 불안감 자극

[공지문 작동 구조]
누가: 당사 사정을 제일 잘 알고 있는 직원이
어떻게: 내부에서만 통용되는 정보를 유출하는데
왜: 회사가 통제하지 못할 만큼 급한 or 중대한 상황이라
무엇을: 다른 사람이 알기 전에 급박하게 종료

[고정 요소]
- 선언: 판매중단 / 가격실수 / 가격인상
- 혜택: 0원~100원 (언제 마감될지 모르니까, 싸게 준다 할 때 사야지)

[변수 — 명분 조합]
원가 인상: 전쟁 여파로 원재료 값이 폭등해 퀄리티 유지가 어렵다 / 국제 유가 통제 불능 상태라 수입산 원재료 수급이 어렵다 / 원래도 비싼 원재료인데 이번에 값이 대폭 올라 더 이상 수급이 어렵다
원물 수급: 전쟁 여파로 원물 가격까지 올라 구하기 어렵다 / 역대급 폭염으로 낙과 피해가 심해 원재료 가격 상승 / 날씨(무더위, 폭염)로 인기 많은 계절 수급 불안정
물량 부족: 재입고임에도 또 품절이라 성원에 보답하는 의미로 최저가 / 주문량을 감당하기 어려운 상황이라 인당 구매 수량 제한 / 연예인·인플루언서 샤라웃 후 수요 폭증

[파트 구조 — 반드시 이 순서]
1. 헤드라인: 후킹 — 관심 가질만한 내용을 서두로 강하게
2. 맛(SP): 이 제품이 왜 특별한지 제품 메리트 강화 (입력값 있으면 활용)
3. 대세감: 얼마나 잘 팔리는지 인기도 부각해 제품 소진 속도 강화 (FOMO)
4. 상황/명분: 당사가 처한 상황을 강조하면서 가격이 조정된 사유를 통해 긴급성 강화
5. 혜택: 오늘, 내일 등 데드라인 통한 기회 한정성 강화

[검증된 배너 예시 — 이 구조를 참고]
헤드: [내부 공지] 저당 멜론쫀득바 가격 실수 안내
대세감: SNS에서 난리난 노을멜론처럼 찐하고 고급진 맛으로 대형 편의점에 단독 입점 했는데 인플루언서들까지 사라웃 해 연일 품절대란이 이어지고 있습니다.
상황: 그런데 금일 가격 설정 과정에서 직원 실수로 정가 18,000원짜리 저당멜론쫀득바를 한 박스 0원에 담을 수 있도록 적용된 상태입니다.
혜택: 오늘까지만 한박스 0원 판매 유지 후 내일 즉시 정상가로 복구될 예정입니다.

[스타일 가이드]
- 진짜 사내 공지문처럼. 광고가 아니라 사실 전달이 목적인 것처럼 느껴져야 함
- 브랜드 인사("안녕하세요, 라라스윗입니다." 등)로 시작
- 각 파트는 1-3문장으로 간결하게
- 대세감은 스토리처럼 자연스럽게 흘러가야 함 (단순 나열 금지)
- 맛(SP) 입력값 없으면 생략 가능, 대세감이 대체

[절대 금지]
- "이 링크에서 챙겨가세요", "지금 바로 구매하세요" 등 직접적 구매 유도
- "놓치지 마세요", "지금이 기회입니다" 등 광고성 클리셰
- 사실 전달 범위를 벗어나는 과장 표현
- 임의로 정가나 수치를 만들어내는 것 (입력값에 있는 것만 사용)

시나리오 3개를 명분 조합을 달리해서 작성하세요:
- 시나리오 A: 직원실수/가격실수형 → 물량부족+인기 명분
- 시나리오 B: 직원실수/가격실수형 → 원물수급 명분
- 시나리오 C: 유형에 맞게 → 원가인상 명분

단, narrativeType이 discontinue(판매중단형)이면 모두 판매중단 선언 구조로,
narrativeType이 price_up(가격인상형)이면 모두 가격인상 선언 구조로 작성.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만:
[
  {
    "scenario": "시나리오 A",
    "headline": "헤드라인",
    "greeting": "인사말",
    "p1": "맛(SP) — 없으면 빈 문자열",
    "p2": "대세감",
    "p3": "상황/명분",
    "p4": "혜택/긴급성",
    "closing": "감사 인사"
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
