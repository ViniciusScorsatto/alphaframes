import {openai} from './openai';

type FlowScenario =
  | 'sell_side_expansion'    // price down + high volume
  | 'upside_expansion'       // price up + high volume
  | 'supply_compression'     // price flat + high volume
  | 'low_conviction_decline' // price down + low volume
  | 'low_conviction_rally'   // price up + low volume
  | 'range_contraction';     // price flat + low volume

const FLOW_SCENARIO_CONTEXT: Record<FlowScenario, string> = {
  sell_side_expansion:
    'Context: Price declining with elevated turnover — consistent with broad selling activity rather than a passive fade. Do NOT use "absorption".',
  upside_expansion:
    'Context: Price advancing with elevated turnover — consistent with broad participation rather than a thin, low-conviction advance.',
  supply_compression:
    'Context: Price flat with elevated turnover — consistent with a balanced structure where activity is elevated but price has not yet responded directionally.',
  low_conviction_decline:
    'Context: Price lower on contained volume — consistent with a passive decline without signs of broad selling pressure.',
  low_conviction_rally:
    'Context: Price higher on contained volume — consistent with a thin advance without signs of broad participation.',
  range_contraction:
    'Context: Price and volume both compressed — consistent with a low-activity, range-bound structure.',
};

type MarketScenario = 'compression' | 'expansion' | 'rotation' | 'neutral';

const MARKET_SCENARIO_CONTEXT: Record<MarketScenario, string> = {
  compression:
    'Context: Low cross-asset dispersion and low average move — observed during periods of range-bound, low-activity structure.',
  expansion:
    'Context: High cross-asset dispersion and high average move — consistent with broad, active directional participation across assets.',
  rotation:
    'Context: High dispersion but contained average move — consistent with sectors moving in opposing directions without a unified market theme.',
  neutral:
    'Context: Moderate dispersion and average move — mixed activity without a clearly dominant directional or rotational theme.',
};

export function classifyMarketScenario(dispersion: number, avgMove: number): MarketScenario {
  const lowDispersion = dispersion < 3;
  const highDispersion = dispersion > 6;
  const lowMove = avgMove < 2;
  const highMove = avgMove > 4;

  if (lowDispersion && lowMove) return 'compression';
  if (highDispersion && highMove) return 'expansion';
  if (highDispersion && !highMove) return 'rotation';
  return 'neutral';
}

export function classifyFlowScenario(change24h: number, volumeToMcRatio: number): FlowScenario {
  const highVolume = volumeToMcRatio > 0.1;
  const flat = Math.abs(change24h) <= 2;
  const up = change24h > 2;

  if (flat && highVolume) return 'supply_compression';
  if (flat) return 'range_contraction';
  if (up && highVolume) return 'upside_expansion';
  if (up) return 'low_conviction_rally';
  if (highVolume) return 'sell_side_expansion';
  return 'low_conviction_decline';
}

type AnomalyScenario = 'extreme_anomaly' | 'moderate_anomaly' | 'normal';

const ANOMALY_SCENARIO_CONTEXT: Record<AnomalyScenario, string> = {
  extreme_anomaly:
    'Context: Both price move and volume are well outside normal ranges — consistent with a high-conviction structural event rather than routine activity.',
  moderate_anomaly:
    'Context: Either price move or volume is elevated, but not both — a notable deviation from baseline, falling short of a full structural break.',
  normal:
    'Context: Signal is at the boundary of normal ranges — describe the observable condition conservatively without overstating its significance.',
};

export function classifyAnomalyScenario(price24h: number, volumeToMc: number): AnomalyScenario {
  const largeMove = Math.abs(price24h) > 8;
  const extremeVolume = volumeToMc > 0.7;

  if (largeMove && extremeVolume) return 'extreme_anomaly';
  if (largeMove || extremeVolume) return 'moderate_anomaly';
  return 'normal';
}

type BreadthScenario =
  | 'btc_led_weakness'  // broad down + BTC lagging alts
  | 'broad_downside'    // broad down + BTC in line with alts
  | 'alt_led_rally'     // broad up + BTC lagging alts
  | 'broad_upside'      // broad up + BTC leading
  | 'neutral';

const BREADTH_SCENARIO_CONTEXT: Record<BreadthScenario, string> = {
  btc_led_weakness:
    'Context: Broad downside with BTC underperforming the alt proxy — the weakness is concentrated in BTC rather than uniform across alts.',
  broad_downside:
    'Context: Most assets declining together with BTC broadly in line — consistent with wide-market weakness rather than isolated sector pressure.',
  alt_led_rally:
    'Context: Broad upside with BTC lagging the alt proxy — the advance is concentrated in alts rather than BTC-led.',
  broad_upside:
    'Context: Most assets advancing with BTC leading — consistent with broad participation rather than isolated sector moves.',
  neutral:
    'Context: Mixed market internals without a clear directional or rotational theme.',
};

export function classifyBreadthScenario(data: {
  marketAvg: number;
  btc: number;
  altProxy: number;
  breadth: number; // 0–1
}): BreadthScenario {
  const broadDown = data.marketAvg < 0 && data.breadth > 0.7;
  const broadUp = data.marketAvg > 0 && data.breadth > 0.7;
  const btcLagging = data.btc < data.altProxy;

  if (broadDown && btcLagging) return 'btc_led_weakness';
  if (broadDown) return 'broad_downside';
  if (broadUp && btcLagging) return 'alt_led_rally';
  if (broadUp) return 'broad_upside';
  return 'neutral';
}

type AccumulationScenario = 'silent_accumulation' | 'volume_without_bias';

const ACCUMULATION_SCENARIO_CONTEXT: Record<AccumulationScenario, string> = {
  silent_accumulation:
    'Context: Price flat 24h, slight upward bias over 7 days, volume well above baseline — elevated activity without a visible price response, historically observed before directional moves.',
  volume_without_bias:
    'Context: Elevated volume with no directional bias over 7 days — consistent with a balanced structure rather than one-sided activity.',
};

export function classifyAccumulationScenario(price24h: number, price7d: number, volumeToMc: number): AccumulationScenario {
  const flat = Math.abs(price24h) < 2;
  const notDeclining = price24h >= 0;
  const slightUp = price7d > 0;
  const elevatedVolume = volumeToMc > 0.6;

  if (flat && notDeclining && slightUp && elevatedVolume) return 'silent_accumulation';
  return 'volume_without_bias';
}

type PatternScenario = 'momentum_expansion' | 'selloff_expansion' | 'compression' | 'no_clear_pattern';

const PATTERN_SCENARIO_CONTEXT: Record<PatternScenario, string> = {
  momentum_expansion:
    'Context: Price advancing with high turnover — consistent with broad participation rather than a thin, low-conviction advance.',
  selloff_expansion:
    'Context: Price declining with high turnover — consistent with broad selling activity rather than a passive, low-volume fade.',
  compression:
    'Context: Flat price with elevated turnover — consistent with a balanced structure; similar setups have historically resolved directionally.',
  no_clear_pattern:
    'Context: No dominant price/volume structure present — interpret conservatively based on the historical case data alone.',
};

export function classifyPatternScenario(price24h: number, volumeToMc: number): PatternScenario {
  const up = price24h > 0;
  const down = price24h < 0;
  const highVol = volumeToMc > 0.5;

  if (up && highVol) return 'momentum_expansion';
  if (down && highVol) return 'selloff_expansion';
  if (!up && !down && highVol) return 'compression';
  return 'no_clear_pattern';
}

export type ActiveNarrativeSystem = 'exhaustion' | 'anomaly' | 'accumulation' | 'divergence' | 'pattern' | 'standard';

const ACTIVE_NARRATIVE_CONTEXT: Record<ActiveNarrativeSystem, string> = {
  exhaustion:
    'Context: The dominant observable signal is a decelerating structure following a strong prior move. Describe the structural condition as observed — do not characterise what comes next.',
  anomaly:
    'Context: The dominant observable signal is activity well outside normal ranges. Describe what makes the current structure unusual relative to baseline.',
  accumulation:
    'Context: The dominant observable signal is elevated turnover without a directional price response. Describe the divergence between activity and price.',
  divergence:
    'Context: The dominant observable signal is a sector or asset moving differently from the broader market. Describe what the internal split looks like, not why it is happening.',
  pattern:
    'Context: The dominant observable signal is a historical pattern match. Describe what similar past conditions looked like and how they resolved — do not predict the outcome.',
  standard:
    'Context: No single dominant signal is present. Describe the most notable observable data point without overstating its significance.',
};

export function selectNarrativeContext(signals: {
  anomaly: AnomalyScenario;
  pattern: PatternScenario;
  accumulation: AccumulationScenario;
  exhaustion: ExhaustionScenario;
  divergence: DivergenceScenario;
}): ActiveNarrativeSystem {
  if (signals.exhaustion !== 'none') return 'exhaustion';
  if (signals.anomaly !== 'normal') return 'anomaly';
  if (signals.accumulation !== 'volume_without_bias') return 'accumulation';
  if (signals.divergence !== 'no_divergence') return 'divergence';
  if (signals.pattern !== 'no_clear_pattern') return 'pattern';
  return 'standard';
}

type DivergenceScenario = 'btc_alt_divergence' | 'sector_outperformance' | 'no_divergence';

const DIVERGENCE_SCENARIO_CONTEXT: Record<DivergenceScenario, string> = {
  btc_alt_divergence:
    'Context: BTC and the alt proxy are moving in meaningfully different directions. Interpret the coin\'s move in the context of that internal market split.',
  sector_outperformance:
    'Context: The leading category is running well ahead of the broader market. Consider whether the coin\'s divergence is consistent with that sector move or separate from it.',
  no_divergence:
    'Context: No strong market-level divergence is present. Interpret the coin\'s move in the context of asset-specific conditions.',
};

export function classifyDivergenceScenario(data: {
  btc: number;
  altProxy: number;
  topCategoryChange24h: number;
}): DivergenceScenario {
  const btcVsAltGap = data.btc - data.altProxy;

  if (Math.abs(btcVsAltGap) > 1.5) return 'btc_alt_divergence';
  if (data.topCategoryChange24h > 20) return 'sector_outperformance';
  return 'no_divergence';
}

type ExhaustionScenario = 'exhaustion' | 'none';

const EXHAUSTION_SCENARIO_CONTEXT: Record<ExhaustionScenario, string> = {
  exhaustion:
    'Context: The prior move was extreme and volume is well above baseline — consistent with a late-stage structural extension. Describe the observable deceleration without characterising what follows.',
  none:
    'Context: The move does not meet exhaustion thresholds — describe this as deceleration within a normal range, not terminal exhaustion.',
};

export function classifyExhaustionScenario(price7d: number, volumeToMc: number): ExhaustionScenario {
  const extremeMove = Math.abs(price7d) > 10;
  const extremeVolume = volumeToMc > 0.75;

  if (extremeMove && extremeVolume) return 'exhaustion';
  return 'none';
}

const SYSTEM_PROMPT = `You are a market analyst writing short narrative captions for a crypto data video platform.
Your job is to interpret what the flow and structure of the data reveals — not advise what to do with it.

Rules:
- 1 to 3 short lines maximum — prefer 1-2, never exceed 3
- Every word must earn its place — cut anything that restates the data or adds no interpretation
- Use market structure language naturally: turnover, structure, compression, extension, exhaustion, rotation, breadth, dispersion
- One or two precise terms per sentence — do not stack jargon
- Never use: buy, sell, hold, invest, trade, entry, exit, long, short, position
- No hedging: avoid "might", "perhaps", "could", "may"
- No markdown, no lists
- Only interpret what the numbers show — no claims beyond the data
- Tone: measured, analytically confident — like a desk analyst, not a trading floor shout

Interpretation rules (critical):
- If price is falling AND volume is high:
  → interpret as sell-side pressure, distribution, or downside expansion
  → DO NOT use "absorption"

- Only use "absorption" if price is stable or slowing down while volume is high

- If price is rising AND volume is high:
  → interpret as upside expansion or aggressive bid-side participation

- If price is flat AND volume is rising:
  → interpret as positioning, accumulation, or compression

- Prefer precise structural terms over generic ones:
  → avoid "trend", "momentum shift", "sentiment"

- Avoid vague phrasing like "underlying weakness" or "market sentiment"
- Always tie interpretation directly to the relationship between price and volume

Data constraints (strict):
- If volume data is NOT provided:
  → DO NOT use flow-related terms such as: sell-side pressure, absorption, distribution, capitulation, turnover
  → Use structure-based language instead: alignment, dispersion, divergence, relative performance, participation
  → DO NOT infer causality or sentiment`;

async function generateNarrative(
  userPrompt: string,
  fallback: string,
  scenarioContext?: string,
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const scenarioLine = scenarioContext ? `${scenarioContext}\n\n` : '';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: SYSTEM_PROMPT},
        {role: 'user', content: `${scenarioLine}${userPrompt}`},
      ],
      max_tokens: 80,
      temperature: 0.4,
    });

    return response.choices[0]?.message?.content?.trim() ?? fallback;
  } catch {
    return fallback;
  }
}

export async function generateMarketSnapshotNarrative(data: {
  marketAverage24h: number;
  btcChange24h: number;
  altAverage24h: number;
  breadthRatio: number;
  topCategory: string | null;
  topCategoryChange24h: number;
}): Promise<string> {
  const direction = data.marketAverage24h >= 0 ? 'positive' : 'negative';
  const btcRelation = data.btcChange24h >= data.altAverage24h ? 'outperforming' : 'underperforming';

  const fallback =
    data.marketAverage24h >= 0
      ? `Crypto market breadth is ${direction}, with BTC ${btcRelation} the alt proxy and ${data.topCategory ?? 'the leading category'} recording the strongest category gains.`
      : `Crypto market breadth is ${direction}, with BTC ${btcRelation} the alt proxy while ${data.topCategory ?? 'the leading category'} shows the narrowest losses across sectors.`;

  const scenario = classifyBreadthScenario({
    marketAvg: data.marketAverage24h,
    btc: data.btcChange24h,
    altProxy: data.altAverage24h,
    breadth: data.breadthRatio,
  });

  return generateNarrative(
    `Market snapshot data:
- Market average 24h: ${data.marketAverage24h.toFixed(2)}% (${direction})
- BTC 24h: ${data.btcChange24h.toFixed(2)}% (${btcRelation} alts)
- Alt proxy 24h: ${data.altAverage24h.toFixed(2)}%
- Breadth (share of coins moving with the market): ${(data.breadthRatio * 100).toFixed(0)}%
- Strongest category: ${data.topCategory ?? 'N/A'} at ${data.topCategoryChange24h.toFixed(2)}%

Describe in 1-2 sentences what the current market breadth and BTC/alt split reveal about market-wide conditions.`,
    fallback,
    BREADTH_SCENARIO_CONTEXT[scenario],
  );
}

export async function generateNarrativeDetectorNarrative(data: {
  strongestCategory: string | null;
  strongestCategoryChange24h: number;
  marketAverage24h: number;
  relativeStrength24h: number;
  activeNarrative: ActiveNarrativeSystem;
}): Promise<string> {
  const relStr = `${data.relativeStrength24h >= 0 ? '+' : ''}${data.relativeStrength24h.toFixed(2)}%`;
  const fallback = `${data.strongestCategory ?? 'The leading category'} is moving ${relStr} ahead of the broader market average, pointing to concentrated activity in that sector rather than broad-based movement.`;

  const marketScenario = classifyMarketScenario(
    Math.abs(data.strongestCategoryChange24h - data.marketAverage24h),
    Math.abs(data.marketAverage24h),
  );
  const scenarioContext = `${ACTIVE_NARRATIVE_CONTEXT[data.activeNarrative]}\n${MARKET_SCENARIO_CONTEXT[marketScenario]}`;

  return generateNarrative(
    `Category rotation data:
- Leading category: ${data.strongestCategory ?? 'Unknown'}
- Category 24h move: ${data.strongestCategoryChange24h.toFixed(2)}%
- Market average 24h: ${data.marketAverage24h.toFixed(2)}%
- Relative outperformance vs market: ${relStr}

Describe in 1-2 sentences what this category outperformance reveals about where market activity is concentrated and what narrative it reflects.`,
    fallback,
    scenarioContext,
  );
}

export async function generateAnomalyDetectorNarrative(data: {
  coinName: string | null;
  change24h: number;
  change7d: number;
  volumeToMarketCapRatio: number;
}): Promise<string> {
  const isDown = data.change24h < 0;
  const volPct = (data.volumeToMarketCapRatio * 100).toFixed(2);

  const fallback = isDown
    ? `${data.coinName ?? 'This asset'} recorded a ${Math.abs(data.change24h).toFixed(2)}% decline accompanied by volume reaching ${volPct}% of its market cap — consistent with broad sell-side pressure rather than a passive, low-volume fade.`
    : `${data.coinName ?? 'This asset'} posted a ${data.change24h.toFixed(2)}% gain with volume reaching ${volPct}% of its market cap — consistent with active bid-side participation rather than a thin, low-conviction advance.`;

  const priceContext = isDown ? 'declining price and elevated volume' : 'rising price and elevated volume';

  const flowScenario = classifyFlowScenario(data.change24h, data.volumeToMarketCapRatio);
  const anomalyScenario = classifyAnomalyScenario(data.change24h, data.volumeToMarketCapRatio);
  const scenarioContext = `${ANOMALY_SCENARIO_CONTEXT[anomalyScenario]}\n${FLOW_SCENARIO_CONTEXT[flowScenario]}`;

  return generateNarrative(
    `Anomaly detection data:
- Coin: ${data.coinName ?? 'Unknown'}
- 24h price change: ${data.change24h.toFixed(2)}%
- 7d price change: ${data.change7d.toFixed(2)}%
- Volume as % of market cap: ${volPct}%
- Signal pattern: ${priceContext}

Describe in 1-2 sentences what this unusual combination of price and volume activity reveals about current market conditions for this asset.`,
    fallback,
    scenarioContext,
  );
}

export async function generateVolatilityRegimeNarrative(data: {
  dispersion24h: number;
  absoluteAverageMove: number;
  marketAverage24h: number;
  volatilityLabel: 'low' | 'medium' | 'high';
}): Promise<string> {
  const fallback =
    data.volatilityLabel === 'high'
      ? `Cross-asset dispersion has reached ${data.dispersion24h.toFixed(2)}, a level historically associated with broad price instability and accelerated rotation across sectors.`
      : data.volatilityLabel === 'low'
        ? `Cross-asset dispersion has compressed to ${data.dispersion24h.toFixed(2)}, reflecting a period of narrow price ranges and slow sector rotation.`
        : `Cross-asset dispersion sits at ${data.dispersion24h.toFixed(2)}, reflecting an active but not dislocated market where moves are selective rather than broad.`;

  const scenario = classifyMarketScenario(data.dispersion24h, data.absoluteAverageMove);

  return generateNarrative(
    `Volatility regime data:
- Cross-asset dispersion (std dev of 24h moves): ${data.dispersion24h.toFixed(2)}
- Average absolute move across top coins: ${data.absoluteAverageMove.toFixed(2)}%
- Market average 24h: ${data.marketAverage24h.toFixed(2)}%
- Regime classification: ${data.volatilityLabel.toUpperCase()}

Describe in 1-2 sentences what the current dispersion level reveals about the volatility environment and what similar historical regimes have looked like.`,
    fallback,
    MARKET_SCENARIO_CONTEXT[scenario],
  );
}

export async function generatePatternMatchNarrative(data: {
  coinName: string | null;
  currentChange24h: number;
  volumeToMarketCapRatio: number;
  similarCases: number;
  averageForward7d: number;
}): Promise<string> {
  const outcome =
    data.averageForward7d >= 0
      ? `stayed positive at +${data.averageForward7d.toFixed(2)}%`
      : `faded by ${Math.abs(data.averageForward7d).toFixed(2)}%`;

  const fallback =
    data.similarCases > 0
      ? `${data.coinName ?? 'This asset'} is echoing a spike pattern that appeared ${data.similarCases} times in its own history, where the average 7-day follow-through ${outcome}.`
      : `${data.coinName ?? 'The current move'} is notable, but the recent price history does not contain enough matching spike instances to support a reliable pattern read.`;

  if (data.similarCases === 0) {
    return fallback;
  }

  const scenario = classifyPatternScenario(data.currentChange24h, data.volumeToMarketCapRatio);

  return generateNarrative(
    `Historical pattern match data:
- Coin: ${data.coinName ?? 'Unknown'}
- Current 24h move: ${data.currentChange24h.toFixed(2)}%
- Volume as % of market cap: ${(data.volumeToMarketCapRatio * 100).toFixed(2)}%
- Similar historical spike cases found: ${data.similarCases}
- Average 7-day return following those spikes: ${data.averageForward7d >= 0 ? '+' : ''}${data.averageForward7d.toFixed(2)}%

Describe in 1-2 sentences what the price and volume structure of those historical cases looked like and how the 7-day follow-through data is distributed — do not characterise what the current asset will do.`,
    fallback,
    PATTERN_SCENARIO_CONTEXT[scenario],
  );
}

export async function generateSilentAccumulationNarrative(data: {
  coinName: string;
  change24h: number;
  change7d: number;
  volumeRatio: number;
  signalThreshold: number;
}): Promise<string> {
  const volPct = (data.volumeRatio * 100).toFixed(2);
  const fallback = `${data.coinName} is recording elevated volume at ${volPct}% of market cap while price holds nearly flat — a divergence between activity and price without a visible directional response.`;

  const accumulationScenario = classifyAccumulationScenario(data.change24h, data.change7d, data.volumeRatio);
  const flowScenario = classifyFlowScenario(data.change24h, data.volumeRatio);
  const scenarioContext = `${ACCUMULATION_SCENARIO_CONTEXT[accumulationScenario]}\n${FLOW_SCENARIO_CONTEXT[flowScenario]}`;

  return generateNarrative(
    `Silent accumulation signal:
- Coin: ${data.coinName}
- 24h price change: ${data.change24h.toFixed(2)}% (near flat)
- 7d price change: ${data.change7d.toFixed(2)}%
- Volume as % of market cap: ${volPct}%
- Signal threshold: ${(data.signalThreshold * 100).toFixed(2)}%

Describe in 1-2 sentences what this volume and price structure reflects in market terms.`,
    fallback,
    scenarioContext,
  );
}

export async function generateExhaustionMoveNarrative(data: {
  coinName: string;
  change7d: number;
  change24h: number;
  volumeToMarketCapRatio: number;
}): Promise<string> {
  const fallback = `${data.coinName} gained ${data.change7d.toFixed(2)}% over seven days while 24-hour momentum has flattened to ${data.change24h.toFixed(2)}% — consistent with decelerating short-term structure following an extended weekly move.`;

  const exhaustionScenario = classifyExhaustionScenario(data.change7d, data.volumeToMarketCapRatio);
  const scenarioContext = `${EXHAUSTION_SCENARIO_CONTEXT[exhaustionScenario]}\n${FLOW_SCENARIO_CONTEXT['range_contraction']}`;

  return generateNarrative(
    `Exhaustion move signal:
- Coin: ${data.coinName}
- 7d price move: +${data.change7d.toFixed(2)}%
- 24h price move: ${data.change24h.toFixed(2)}% (momentum stalling)
- Volume as % of market cap: ${(data.volumeToMarketCapRatio * 100).toFixed(2)}%

Describe in 1-2 sentences what this deceleration in short-term momentum following a strong weekly extension typically reveals about near-term structure.`,
    fallback,
    scenarioContext,
  );
}

export async function generateDivergenceNarrative(data: {
  coinName: string;
  change24h: number;
  marketAvg24h: number;
  divergence: number;
  btcChange24h: number;
  altAverage24h: number;
  topCategoryChange24h: number;
}): Promise<string> {
  const direction = data.divergence >= 0 ? 'outperforming' : 'underperforming';
  const divStr = `${data.divergence >= 0 ? '+' : ''}${data.divergence.toFixed(2)}%`;

  const fallback = `${data.coinName} is ${direction} the market average by ${divStr}, a degree of divergence that points to idiosyncratic price drivers rather than broad market movement.`;

  const scenario = classifyDivergenceScenario({
    btc: data.btcChange24h,
    altProxy: data.altAverage24h,
    topCategoryChange24h: data.topCategoryChange24h,
  });

  return generateNarrative(
    `Divergence signal:
- Coin: ${data.coinName}
- Coin 24h move: ${data.change24h.toFixed(2)}%
- Market average 24h: ${data.marketAvg24h.toFixed(2)}%
- Divergence from market: ${divStr} (${direction})
- BTC 24h: ${data.btcChange24h.toFixed(2)}% | Alt proxy 24h: ${data.altAverage24h.toFixed(2)}%

Describe in 1-2 sentences what this divergence reveals about whether the move is idiosyncratic or part of a broader internal market split.`,
    fallback,
    DIVERGENCE_SCENARIO_CONTEXT[scenario],
  );
}
