'use client';

import {useEffect, useMemo, useState, useTransition} from 'react';
import {Player} from '@remotion/player';
import {ComparisonAssetVideo} from '@/video/comparison-asset-video';
import {FinancialAssetVideo} from '@/video/financial-asset-video';
import {MarketInsightVideo} from '@/video/market-insight-video';
import {DCA_CADENCE_OPTIONS, LOOKBACK_OPTIONS, VIDEO, TEMPLATE_OPTIONS} from '@/lib/constants';
import {appendSignalLog, getSignalBlocks, getSignalRecommendation, scoreMarketItem} from '@/lib/signal-quality';
import {Button, Input, Label, Select, Textarea} from '@/components/ui';
import {cn, formatCurrency, formatDisplayDate, formatPercent} from '@/lib/utils';
import type {
  AssetType,
  AnyGeneratedVideoData,
  DcaCadence,
  GenerateResponsePayload,
  LookbackWindow,
  MarketSignalQuality,
  RenderedVideoResult,
  TemplateId,
} from '@/types';

const HISTORY_KEY = 'financial-video-studio-history';
const MARKET_TEMPLATES: TemplateId[] = [
  'MARKET_SNAPSHOT',
  'NARRATIVE_DETECTOR',
  'ANOMALY_DETECTOR',
  'VOLATILITY_REGIME',
  'PATTERN_MATCH',
  'SILENT_ACCUMULATION',
  'EXHAUSTION_MOVE',
  'DIVERGENCE_DETECTOR',
];

function parseTickers(value: string, assetType: AssetType) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((ticker) => /^[A-Za-z0-9.\-]+$/.test(ticker))
    .map((ticker) => ({ticker, assetType}));
}

export function DashboardShell() {
  const [tickersInput, setTickersInput] = useState('BTC');
  const [assetType, setAssetType] = useState<AssetType>('crypto');
  const [comparisonPrimaryTicker, setComparisonPrimaryTicker] = useState('BTC');
  const [comparisonPrimaryType, setComparisonPrimaryType] = useState<AssetType>('crypto');
  const [comparisonSecondaryTicker, setComparisonSecondaryTicker] = useState('VOO');
  const [comparisonSecondaryType, setComparisonSecondaryType] = useState<AssetType>('etf');
  const [template, setTemplate] = useState<TemplateId>('LAST_30_DAYS');
  const [lookbackWindow, setLookbackWindow] = useState<LookbackWindow>(180);
  const [dcaCadence, setDcaCadence] = useState<DcaCadence>('weekly');
  const [investment, setInvestment] = useState(1000);
  const [generatedItems, setGeneratedItems] = useState<AnyGeneratedVideoData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<AnyGeneratedVideoData[]>([]);
  const [renderResults, setRenderResults] = useState<RenderedVideoResult[]>([]);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, startGenerating] = useTransition();
  const [isRendering, startRendering] = useTransition();
  const [isSuggesting, startSuggesting] = useTransition();

  useEffect(() => {
    const saved = window.localStorage.getItem(HISTORY_KEY);
    if (saved) {
      setHistory(JSON.parse(saved) as AnyGeneratedVideoData[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 24)));
  }, [history]);

  const selectedItem = generatedItems[selectedIndex] ?? null;
  const selectedMarketQuality =
    selectedItem?.kind === 'market' ? selectedItem.signal_quality ?? scoreMarketItem(selectedItem) : null;
  const tickerCount = useMemo(() => parseTickers(tickersInput, assetType).length, [tickersInput, assetType]);
  const isComparisonTemplate = template === 'COMPARE_ASSETS';
  const isMarketTemplate = MARKET_TEMPLATES.includes(template);
  const supportsLookback = ['BEST_DAY_TO_BUY', 'DCA_STRATEGY', 'THEN_VS_NOW', 'COMPARE_ASSETS'].includes(template);
  const isDcaTemplate = template === 'DCA_STRATEGY';

  const handleGenerate = () => {
    setError(null);
    setIdeas([]);
    if (isMarketTemplate) {
      startGenerating(async () => {
        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              tickers: [],
              template,
              investment,
            }),
          });
          const payload = (await response.json()) as GenerateResponsePayload & {error?: string};

          if (!response.ok) {
            throw new Error(payload.error ?? 'Failed to generate market insight.');
          }

          const dataset = payload.marketContext?.dataset ?? [];
          const scoredItems = payload.items.map((item) =>
            item.kind === 'market'
              ? {
                  ...item,
                  signal_quality: scoreMarketItem(item, dataset),
                }
              : item,
          );

          const anomalyLogEntries = scoredItems.flatMap((item) =>
            item.kind === 'market' && item.signal_metadata
              ? [
                  {
                    type: item.signal_metadata.type,
                    coinId: item.signal_metadata.coinId,
                  },
                ]
              : [],
          );

          appendSignalLog(anomalyLogEntries);
          setGeneratedItems(scoredItems);
          setSelectedIndex(0);
          setHistory((current) => [...scoredItems, ...current].slice(0, 24));
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to generate market insight.');
        }
      });
      return;
    }

    if (isComparisonTemplate) {
      if (!comparisonPrimaryTicker.trim() || !comparisonSecondaryTicker.trim()) {
        setError('Enter both assets to generate a comparison video.');
        return;
      }

      startGenerating(async () => {
        try {
          const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              tickers: [],
              template,
              investment,
              comparison: {
                primary: {ticker: comparisonPrimaryTicker.trim(), assetType: comparisonPrimaryType},
                secondary: {ticker: comparisonSecondaryTicker.trim(), assetType: comparisonSecondaryType},
              },
              lookbackWindow,
            }),
          });
          const payload = (await response.json()) as GenerateResponsePayload & {error?: string};

          if (!response.ok) {
            throw new Error(payload.error ?? 'Failed to generate comparison.');
          }

          setGeneratedItems(payload.items);
          setSelectedIndex(0);
          setHistory((current) => [...payload.items, ...current].slice(0, 24));
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : 'Failed to generate comparison.');
        }
      });
      return;
    }

    const parsedTickers = parseTickers(tickersInput, assetType);

    if (!parsedTickers.length) {
      setError('Enter at least one valid ticker. Use letters, numbers, dots, or dashes only.');
      return;
    }

    startGenerating(async () => {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            tickers: parsedTickers,
            template,
            investment,
            lookbackWindow: supportsLookback ? lookbackWindow : undefined,
            dcaCadence: isDcaTemplate ? dcaCadence : undefined,
          }),
        });
        const payload = (await response.json()) as GenerateResponsePayload & {error?: string};

        if (!response.ok) {
          throw new Error(payload.error ?? 'Failed to generate data.');
        }

        setGeneratedItems(payload.items);
        setSelectedIndex(0);
        setHistory((current) => [...payload.items, ...current].slice(0, 24));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to generate data.');
      }
    });
  };

  const handleRender = () => {
    if (!generatedItems.length) {
      return;
    }

    setError(null);
    startRendering(async () => {
      try {
        const response = await fetch('/api/render', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({items: generatedItems}),
        });
        const payload = (await response.json()) as {results?: RenderedVideoResult[]; error?: string};

        if (!response.ok || !payload.results) {
          throw new Error(payload.error ?? 'Failed to render videos.');
        }

        setRenderResults(payload.results);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to render videos.');
      }
    });
  };

  const handleSuggestIdeas = () => {
    if (!selectedItem) {
      return;
    }

    startSuggesting(async () => {
      try {
        const response = await fetch('/api/suggest', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({item: selectedItem}),
        });
        const payload = (await response.json()) as {ideas?: string[]; error?: string};

        if (!response.ok || !payload.ideas) {
          throw new Error(payload.error ?? 'Failed to suggest ideas.');
        }

        setIdeas(payload.ideas);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to suggest ideas.');
      }
    });
  };

  return (
    <main className="grid-bg min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
        <section className="glass-panel rounded-[32px] p-6 sm:p-8">
          <div className="mb-8">
            <div className="text-xs uppercase tracking-[0.32em] text-emerald-300">Financial Video Studio</div>
            <h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-white">Generate market-ready shorts.</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
              Pull live asset data, transform it into reusable JSON, preview vertical video compositions, and render
              MP4 batches locally.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label>{isMarketTemplate ? 'Data Source' : isComparisonTemplate ? 'Assets To Compare' : 'Tickers'}</Label>
              {isMarketTemplate ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-6 text-zinc-300">
                  CoinGecko market-wide analysis. This template uses batched crypto market data only and does not require ticker input.
                </div>
              ) : isComparisonTemplate ? (
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <Input value={comparisonPrimaryTicker} onChange={(event) => setComparisonPrimaryTicker(event.target.value)} placeholder="BTC" />
                    <Select value={comparisonPrimaryType} onChange={(event) => setComparisonPrimaryType(event.target.value as AssetType)}>
                      <option value="crypto">Crypto</option>
                      <option value="stock">Stock</option>
                      <option value="etf">ETF</option>
                    </Select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <Input value={comparisonSecondaryTicker} onChange={(event) => setComparisonSecondaryTicker(event.target.value)} placeholder="VOO" />
                    <Select value={comparisonSecondaryType} onChange={(event) => setComparisonSecondaryType(event.target.value as AssetType)}>
                      <option value="crypto">Crypto</option>
                      <option value="stock">Stock</option>
                      <option value="etf">ETF</option>
                    </Select>
                  </div>
                </div>
              ) : (
                <>
                  <Textarea
                    value={tickersInput}
                    onChange={(event) => setTickersInput(event.target.value)}
                    placeholder="BTC, ETH, TSLA, VOO"
                  />
                  <p className="mt-2 text-xs text-zinc-500">Use commas or new lines. Current batch size: {tickerCount}</p>
                </>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {!isComparisonTemplate && !isMarketTemplate ? (
                <div>
                  <Label>Asset Type</Label>
                  <Select value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)}>
                    <option value="crypto">Crypto</option>
                    <option value="stock">Stock</option>
                    <option value="etf">ETF</option>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Mode</Label>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                    Mixed asset comparison
                  </div>
                </div>
              )}
              {!isMarketTemplate ? (
                <div>
                  <Label>Investment</Label>
                  <Input
                    type="number"
                    min={1}
                    value={investment}
                    onChange={(event) => setInvestment(Number(event.target.value))}
                  />
                </div>
              ) : null}
            </div>

            {supportsLookback && !isMarketTemplate ? (
              <div>
                <Label>Graph Range</Label>
                <Select
                  value={String(lookbackWindow)}
                  onChange={(event) =>
                    setLookbackWindow(
                      event.target.value === 'max' ? 'max' : Number(event.target.value) as LookbackWindow,
                    )
                  }
                >
                  {LOOKBACK_OPTIONS.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-zinc-500">
                  Choose how much history the graph should use for this video.
                </p>
              </div>
            ) : null}

            {isDcaTemplate && !isMarketTemplate ? (
              <div>
                <Label>DCA Cadence</Label>
                <Select value={dcaCadence} onChange={(event) => setDcaCadence(event.target.value as DcaCadence)}>
                  {DCA_CADENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-zinc-500">
                  Choose how often the simulated DCA buys should happen.
                </p>
              </div>
            ) : null}

            <div>
              <Label>Template</Label>
              <Select value={template} onChange={(event) => setTemplate(event.target.value as TemplateId)}>
                {TEMPLATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <p className="mt-2 text-xs text-zinc-500">
                {TEMPLATE_OPTIONS.find((option) => option.value === template)?.description}
              </p>
            </div>

            {selectedItem?.kind === 'market' && selectedMarketQuality ? (
              <SignalQualityBlock quality={selectedMarketQuality} />
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleRender}
                disabled={isRendering || !generatedItems.length}
                className={selectedMarketQuality?.label === 'Skip' ? 'opacity-60' : undefined}
                title={
                  selectedMarketQuality?.label === 'Skip'
                    ? 'Signal scored too low to render. You can still proceed manually.'
                    : undefined
                }
              >
                {isRendering ? 'Rendering...' : 'Render Video'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSuggestIdeas}
                disabled={isSuggesting || !selectedItem || selectedItem.kind === 'market'}
              >
                {isSuggesting ? 'Thinking...' : 'Suggest Content Ideas'}
              </Button>
            </div>

            {error ? <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

            {renderResults.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Rendered Files</div>
                <div className="mt-3 space-y-2">
                  {renderResults.map((result) => (
                    <a
                      key={result.fileName}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/30 px-4 py-3 text-sm text-white transition hover:border-emerald-400/50"
                      href={result.url}
                      download
                    >
                      <span>
                        {result.asset} / {result.template}
                      </span>
                      <span className="text-emerald-300">Download MP4</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {ideas.length ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Content Ideas</div>
                <div className="mt-3 space-y-2">
                  {ideas.map((idea) => (
                    <div key={idea} className="rounded-2xl bg-black/30 px-4 py-3 text-sm text-zinc-200">
                      {idea}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6">
          <div className="glass-panel rounded-[32px] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Live Preview</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {selectedItem ? `${selectedItem.assetName} / ${selectedItem.template}` : 'No video generated yet'}
                </div>
              </div>
              {generatedItems.length > 1 ? (
                <div className="flex gap-2">
                  {generatedItems.map((item, index) => (
                    <Button
                      key={`${item.asset}-${index}`}
                      variant={index === selectedIndex ? 'primary' : 'secondary'}
                      className="px-3 py-2"
                      onClick={() => setSelectedIndex(index)}
                    >
                      {item.asset}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black">
              {selectedItem?.kind === 'market' && selectedMarketQuality ? (
                <SignalStrengthPreviewBar quality={selectedMarketQuality} />
              ) : null}
              <div className={selectedItem?.kind === 'market' && selectedMarketQuality ? 'pt-7' : undefined}>
                {selectedItem && selectedItem.kind === 'single' ? (
                  <Player
                    component={FinancialAssetVideo}
                    inputProps={{data: selectedItem}}
                    durationInFrames={VIDEO.durationInFrames}
                    compositionWidth={VIDEO.width}
                    compositionHeight={VIDEO.height}
                    fps={VIDEO.fps}
                    controls
                    loop
                    showVolumeControls
                    initiallyMuted={false}
                    initiallyShowControls
                    style={{width: '100%', aspectRatio: '9 / 16'}}
                  />
                ) : selectedItem && selectedItem.kind === 'comparison' ? (
                  <Player
                    component={ComparisonAssetVideo}
                    inputProps={{data: selectedItem}}
                    durationInFrames={VIDEO.durationInFrames}
                    compositionWidth={VIDEO.width}
                    compositionHeight={VIDEO.height}
                    fps={VIDEO.fps}
                    controls
                    loop
                    showVolumeControls
                    initiallyMuted={false}
                    initiallyShowControls
                    style={{width: '100%', aspectRatio: '9 / 16'}}
                  />
                ) : selectedItem && selectedItem.kind === 'market' ? (
                  <Player
                    component={MarketInsightVideo}
                    inputProps={{data: selectedItem}}
                    durationInFrames={VIDEO.durationInFrames}
                    compositionWidth={VIDEO.width}
                    compositionHeight={VIDEO.height}
                    fps={VIDEO.fps}
                    controls
                    loop
                    showVolumeControls
                    initiallyMuted={false}
                    initiallyShowControls
                    style={{width: '100%', aspectRatio: '9 / 16'}}
                  />
                ) : (
                  <div className="flex aspect-[9/16] items-center justify-center text-sm text-zinc-500">
                    Generate data to preview the vertical video.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
            <div className="glass-panel rounded-[32px] p-6">
              <div className="mb-4 text-xs uppercase tracking-[0.28em] text-zinc-500">Structured JSON Output</div>
              <pre className="max-h-[560px] overflow-auto rounded-[24px] border border-white/10 bg-black/60 p-4 text-xs leading-6 text-zinc-200">
                {selectedItem ? JSON.stringify(selectedItem, null, 2) : '// Generated JSON will appear here'}
              </pre>
            </div>

            <div className="glass-panel rounded-[32px] p-6">
              <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">Generation Summary</div>
              {selectedItem ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-zinc-400">Transformation</div>
                    <div className="mt-2 text-3xl font-bold tracking-[-0.05em] text-white">
                      {selectedItem.kind === 'market'
                        ? selectedItem.headline
                        : selectedItem.kind === 'comparison'
                        ? `${selectedItem.primaryAsset.ticker} ${formatCurrency(selectedItem.primaryAsset.valueToday, selectedItem.currency)} vs ${selectedItem.secondaryAsset.ticker} ${formatCurrency(selectedItem.secondaryAsset.valueToday, selectedItem.currency)}`
                        : `${formatCurrency(selectedItem.investment, selectedItem.currency)} -> ${formatCurrency(selectedItem.valueToday, selectedItem.currency)}`}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {selectedItem.kind === 'market' ? (
                      <>
                        <StatCard
                          label="Signal Strength"
                          value={selectedMarketQuality?.label ?? 'N/A'}
                          signalColor={selectedMarketQuality?.color}
                        />
                        <StatCard label="Confidence" value={`${Math.round(selectedItem.confidence * 100)}%`} />
                        <StatCard label="Risk" value={selectedItem.risk_label.toUpperCase()} gain={selectedItem.risk_label === 'low' ? true : selectedItem.risk_label === 'high' ? false : undefined} />
                        <StatCard label={selectedItem.supporting_stats[0]?.label ?? 'Supporting Stat'} value={selectedItem.supporting_stats[0]?.value ?? 'N/A'} />
                      </>
                    ) : selectedItem.kind === 'comparison' ? (
                      <>
                        <StatCard label={`${selectedItem.primaryAsset.ticker} Return`} value={formatPercent(selectedItem.primaryAsset.return)} gain={selectedItem.primaryAsset.return >= 0} />
                        <StatCard label={`${selectedItem.secondaryAsset.ticker} Return`} value={formatPercent(selectedItem.secondaryAsset.return)} gain={selectedItem.secondaryAsset.return >= 0} />
                        <StatCard label="Winner" value={selectedItem.winnerTicker} />
                      </>
                    ) : (
                      <>
                        <StatCard label="Return" value={formatPercent(selectedItem.return)} gain={selectedItem.return >= 0} />
                        <StatCard label="Start Price" value={formatCurrency(selectedItem.startPrice, selectedItem.currency)} />
                        <StatCard label="Current Price" value={formatCurrency(selectedItem.currentPrice, selectedItem.currency)} />
                      </>
                    )}
                    {selectedItem.kind === 'market' ? (
                      <>
                        <StatCard label="Generated" value={formatDisplayDate(selectedItem.generated_at)} />
                        <div className="rounded-3xl border border-white/10 bg-black/40 p-4 sm:col-span-2 xl:col-span-1">
                          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Signal Read</div>
                          <div className="mt-2 text-sm leading-6 text-zinc-300">
                            {selectedMarketQuality?.reasons[0] ?? 'Signal strength will appear here for market templates.'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <StatCard
                        label="Date Range"
                        value={`${formatDisplayDate(selectedItem.startDate)} -> ${formatDisplayDate(selectedItem.endDate)}`}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-zinc-500">Select a ticker and generate a template to see the summary.</p>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <div className="mb-4 text-xs uppercase tracking-[0.28em] text-zinc-500">Saved History</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {history.length ? (
                history.map((item, index) => (
                  <button
                    key={`${item.asset}-${item.template}-${index}`}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-emerald-400/40 hover:bg-white/8"
                    onClick={() => {
                      setGeneratedItems([item]);
                      setSelectedIndex(0);
                    }}
                  >
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{item.template}</div>
                    <div className="mt-2 text-xl font-semibold text-white">{item.assetName}</div>
                    <div className={`mt-3 text-sm ${item.kind === 'market' ? 'text-zinc-300' : item.kind === 'comparison' ? 'text-sky-300' : item.return >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {item.kind === 'market'
                        ? item.headline
                        : item.kind === 'comparison'
                          ? `${item.winnerTicker} wins ${formatPercent(item.deltaReturn)}`
                          : formatPercent(item.return)}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {item.kind === 'market'
                        ? `Generated ${formatDisplayDate(item.generated_at)}`
                        : `${formatDisplayDate(item.startDate)} -> ${formatDisplayDate(item.endDate)}`}
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-zinc-500">History is saved locally after each generation.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  gain,
  signalColor,
}: {
  label: string;
  value: string;
  gain?: boolean;
  signalColor?: 'green' | 'amber' | 'red';
}) {
  let textClass = 'text-white';

  if (gain != null) {
    textClass = gain ? 'text-emerald-300' : 'text-red-300';
  } else if (signalColor === 'green') {
    textClass = 'text-emerald-300';
  } else if (signalColor === 'amber') {
    textClass = 'text-amber-200';
  } else if (signalColor === 'red') {
    textClass = 'text-red-300';
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${textClass}`}>
        {value}
      </div>
    </div>
  );
}

function SignalQualityBlock({quality}: {quality: MarketSignalQuality}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">Signal Quality</div>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              quality.color === 'green'
                ? 'bg-emerald-300'
                : quality.color === 'amber'
                  ? 'bg-amber-200'
                  : 'bg-red-300',
            )}
          />
          <span
            className={cn(
              'text-sm font-semibold',
              quality.color === 'green'
                ? 'text-emerald-300'
                : quality.color === 'amber'
                  ? 'text-amber-200'
                  : 'text-red-300',
            )}
          >
            {quality.label}
          </span>
        </div>
        <span className="text-sm text-zinc-500">{quality.total}/8</span>
      </div>
      <div className="mt-3 space-y-1 text-[12px] leading-5 text-zinc-400">
        {quality.reasons.map((reason) => (
          <div key={reason}>{reason}</div>
        ))}
      </div>
      <div
        className={cn(
          'mt-4 rounded-2xl border border-white/10 border-l-[3px] px-3 py-2 text-sm text-zinc-200',
          quality.color === 'green'
            ? 'border-l-emerald-300 bg-white/6'
            : quality.color === 'amber'
              ? 'border-l-amber-200 bg-white/6'
              : 'border-l-red-300 bg-white/6',
        )}
      >
        {getSignalRecommendation(quality.label)}
      </div>
    </div>
  );
}

function SignalStrengthPreviewBar({quality}: {quality: MarketSignalQuality}) {
  const filledBlocks = getSignalBlocks(quality.label);

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-3 border-b border-white/15 bg-[#060806] px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
      <span>Signal Strength</span>
      <div className="flex items-center gap-[3px]">
        {Array.from({length: 5}, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-2 w-2 rounded-[2px]',
              index < filledBlocks
                ? quality.color === 'green'
                  ? 'bg-emerald-300'
                  : quality.color === 'amber'
                    ? 'bg-amber-200'
                    : 'bg-red-300'
                : 'bg-zinc-800',
            )}
          />
        ))}
      </div>
      <span className="truncate">
        {quality.label} · {quality.reasons[0]}
      </span>
    </div>
  );
}
