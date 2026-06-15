export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { product, sp, hype, price, period, narrativeType, situation } = req.body;

  if (!product || !sp || !narrativeType || !price) {
    return res.status(400).json({ error: '필수 값이 누락되었습니다.' });
  }

  const typeMap = {
    mistake: '직원실수형',
    discontinue: '판매중단형',
    price_up: '가격인상형',
  };
  const typeLabel = typeMap[narrativeType] || narrativeType;

  const systemPrompt = `당신은 한국 식품 이커머스 브랜드 라라스윗(Lalasweet)의 Meta 광고 카피라이터입니다.
실제 성과가 검증된 공지문 패턴을 기반으로 카피를 작성합니다.

[직원실수형 구조]
헤드: [내부 공지] {제품명} 가격 실수 안내
인사: 안녕하세요, 라라스윗입니다.
제품 SP 한 문단 (맛 묘사 + 대세감)
실수 경위: 가격 설정 과정에서 직원 실수로 {가격}이 적용된 상태
혜택: {기간}까지만 해당 가격 유지, 내일 즉시 정상가 복귀
감사 인사

[판매중단형 구조]
헤드: {제품명} 판매 중단 안내
인사: 안녕하십니까, 라라스윗 운영본부입니다.
제품 SP 한 문단 (맛 묘사 + 대세감)
중단 이유: 원재료 수급 불안정 (전쟁/폭염/원가 폭등 등 구체적으로)
품질 타협 거부 문단
마지막 물량을 {가격}에 제공, {기간}까지 또는 물량 소진 시 조기 종료
감사 인사

[가격인상형 구조]
헤드: {제품명} 가격 인상 안내
인사: 안녕하세요, 라라스윗입니다.
제품 SP 한 문단 (맛 묘사 + 대세감)
인상 이유: 원재료 수급 어려움 (구체적 이유)
본사 손해 감수, {기간}까지만 현재 가격 유지
내일부터 정가 적용
감사 인사

[스타일 가이드]
- 자연스럽고 인간적인 브랜드 목소리 (공문 느낌이지만 따뜻함)
- 제품 SP는 반드시 구체적이고 생생하게
- 대세감은 반드시 포함 (입력값 있으면 활용, 없으면 AI가 자연스럽게 작성)
- 오늘까지의 긴급성 필수
- 총 길이: 200-350자 내외
- 출력: 완성된 카피 텍스트만. 설명이나 부연 없이.`;

  const userPrompt = `유형: ${typeLabel}
제품명: ${product}
맛 (SP): ${sp}
대세감: ${hype || '(AI가 자연스럽게 작성)'}
혜택 가격: ${price}
혜택 기간: ${period || '오늘까지'}
${situation ? `상황 설명: ${situation}` : ''}

공지문 카피를 작성해주세요.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'API 오류' });
    }

    const data = await response.json();
    const text = data.content?.map((b) => b.text || '').join('') || '';
    return res.status(200).json({ result: text });
  } catch (e) {
    return res.status(500).json({ error: e.message || '서버 오류' });
  }
}
