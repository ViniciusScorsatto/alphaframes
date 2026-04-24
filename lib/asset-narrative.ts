import type {ComparisonVideoData, GeneratedVideoData} from '@/types';
import {openai} from '@/lib/openai';

const SYSTEM_PROMPT = `You are an analyst writing a short commentary line for finance video overlays.

Rules:
- Output exactly 1-2 short sentences.
- Descriptive only, no advice.
- Do not use: buy, sell, recommend, should, opportunity, bullish, bearish.
- Keep tone measured and clear.
- Focus on observable price structure and relative performance.
- No markdown, no bullet points.`;

function fallbackSingle(data: GeneratedVideoData) {
  if (data.return >= 0) {
    return `${data.asset} held an upward structure across the window, with the closing value finishing above the starting base. The move stayed constructive into the latest print.`;
  }

  return `${data.asset} stayed under pressure across the selected window, with the closing value ending below the starting base. The structure reflects persistent downside follow-through.`;
}

function fallbackComparison(data: ComparisonVideoData) {
  const spread = Math.abs(data.primaryAsset.return - data.secondaryAsset.return).toFixed(2);
  return `${data.winnerTicker} led this window on relative performance, with a spread of ${spread}% versus the other asset. The performance gap stayed visible through the final part of the range.`;
}

async function generateNarrative(userPrompt: string, fallback: string) {
  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: userPrompt},
      ],
      max_tokens: 90,
      temperature: 0.35,
    });

    return response.choices[0]?.message?.content?.trim() ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateSingleAssetAnalystNote(data: GeneratedVideoData) {
  const fallback = fallbackSingle(data);
  return generateNarrative(
    `Asset: ${data.asset} (${data.assetName})
Template: ${data.template}
Range: ${data.startDate} to ${data.endDate}
Start price: ${data.startPrice}
Current price: ${data.currentPrice}
Return percent: ${data.return}
Investment value today: ${data.valueToday}

Write 1-2 concise sentences describing what the move structure shows.`,
    fallback,
  );
}

export async function generateComparisonAnalystNote(data: ComparisonVideoData) {
  const fallback = fallbackComparison(data);
  return generateNarrative(
    `Comparison: ${data.primaryAsset.ticker} (${data.primaryAsset.name}) vs ${data.secondaryAsset.ticker} (${data.secondaryAsset.name})
Range: ${data.startDate} to ${data.endDate}
Winner: ${data.winnerTicker}
Primary return: ${data.primaryAsset.return}
Secondary return: ${data.secondaryAsset.return}
Return spread: ${data.deltaReturn}

Write 1-2 concise sentences describing relative performance and structure.`,
    fallback,
  );
}
