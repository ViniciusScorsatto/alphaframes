import {readFile} from 'fs/promises';
import path from 'path';
import {z} from 'zod';
import {openai} from '@/lib/openai';
import {TEMPLATE_OPTIONS} from '@/lib/constants';
import type {AnyGeneratedVideoData, PublishingDraft, PublishingDraftMetadata} from '@/types';

const TEMPLATE_PATH = path.join(process.cwd(), 'config', 'publishing', 'youtube-shorts-template.md');
const FOOTER_PATH = path.join(process.cwd(), 'config', 'publishing', 'youtube-description-footer.md');
const DEFAULT_PUBLISHING_MODEL = 'gpt-4.1-mini';
const TEMPLATE_NAME = 'youtube-shorts-template';

const publishingDraftSchema = z.object({
  summary: z.string().trim().min(1),
  platforms: z.object({
    youtube: z.object({
      title: z.string().trim().min(1).max(100),
      description: z.string().trim().min(1).max(3000),
      tags: z.array(z.string().trim().min(1).max(80)).min(20).max(35),
      hashtags: z.array(z.string().trim().min(1).max(50)).min(1).max(10),
      thumbnailNotes: z.string().trim().max(500).default(''),
    }),
  }),
});

const templateSectionsToKeep = new Set([
  'Goal',
  'Channel Profile',
  'Compliance And Accuracy Rules',
  'YouTube Title Rules',
  'YouTube Description Rules',
  'Tags Rules',
  'Hashtag Rules',
  'Thumbnail / Cover Notes',
  'Required JSON Shape',
]);

export async function loadPublishingTemplate() {
  return readFile(TEMPLATE_PATH, 'utf8');
}

export function compactPublishingTemplate(template: string) {
  const lines = template.split(/\r?\n/);
  const compacted: string[] = [];
  let keepSection = true;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      keepSection = templateSectionsToKeep.has(heading[1].trim());
    }

    if (keepSection || line.startsWith('# ')) {
      compacted.push(line);
    }
  }

  return compacted
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function loadYouTubeDescriptionFooter() {
  return readFile(FOOTER_PATH, 'utf8');
}

export function appendYouTubeDescriptionFooter({description, footer}: {description: string; footer: string}) {
  const cleanDescription = description.trim();
  const cleanFooter = footer.trim();

  if (!cleanFooter) {
    return cleanDescription;
  }

  return `${cleanDescription}\n\n${cleanFooter}`;
}

function templateLabel(template: string) {
  return TEMPLATE_OPTIONS.find((option) => option.value === template)?.label ?? template;
}

function compactTimeline(timeline?: Array<{date: string; price?: number; primaryValue?: number; secondaryValue?: number}>) {
  if (!timeline?.length) {
    return undefined;
  }

  const first = timeline[0];
  const last = timeline[timeline.length - 1];
  const midpoint = timeline[Math.floor(timeline.length / 2)];

  return {
    points: timeline.length,
    first,
    midpoint,
    last,
  };
}

export function buildPublishingMetadata({
  job,
  extraContext,
  outputRenderPath,
}: {
  job: AnyGeneratedVideoData;
  extraContext?: string;
  outputRenderPath?: string;
}): PublishingDraftMetadata {
  const shared = {
    type: job.kind,
    template: job.template,
    templateLabel: templateLabel(job.template),
    titleLabel: job.kind === 'market' ? job.headline : job.hookLabel,
    asset: job.asset,
    assetName: job.assetName,
    currency: job.currency,
    voiceoverText: job.voiceoverText,
    musicTrack: job.musicTrack,
    outputRenderPath,
  };

  let video: Record<string, unknown>;

  if (job.kind === 'comparison') {
    video = {
      ...shared,
      assetClass: 'comparison',
      tickers: [job.primaryAsset.ticker, job.secondaryAsset.ticker],
      insights: job.insights,
      analystNote: job.analystNote,
      assets: [
        {
          ticker: job.primaryAsset.ticker,
          name: job.primaryAsset.name,
          assetType: job.primaryAsset.assetType,
          startPrice: job.primaryAsset.startPrice,
          currentPrice: job.primaryAsset.currentPrice,
          return: job.primaryAsset.return,
          valueToday: job.primaryAsset.valueToday,
        },
        {
          ticker: job.secondaryAsset.ticker,
          name: job.secondaryAsset.name,
          assetType: job.secondaryAsset.assetType,
          startPrice: job.secondaryAsset.startPrice,
          currentPrice: job.secondaryAsset.currentPrice,
          return: job.secondaryAsset.return,
          valueToday: job.secondaryAsset.valueToday,
        },
      ],
      period: {startDate: job.startDate, endDate: job.endDate},
      investment: job.investment,
      comparison: `${job.primaryAsset.ticker} vs ${job.secondaryAsset.ticker}`,
      winnerTicker: job.winnerTicker,
      performance: {
        primaryReturn: job.primaryAsset.return,
        secondaryReturn: job.secondaryAsset.return,
        deltaReturn: job.deltaReturn,
      },
      timeline: compactTimeline(job.comparisonTimeline),
    };
  } else if (job.kind === 'market') {
    video = {
      ...shared,
      assetClass: 'crypto market',
      tickers: job.signal_metadata ? [job.signal_metadata.coinTicker] : undefined,
      assets: job.signal_metadata
        ? [{ticker: job.signal_metadata.coinTicker, name: job.signal_metadata.coinName, assetType: 'crypto'}]
        : undefined,
      generatedAt: job.generated_at,
      metrics: job.supporting_stats,
      narrativeText: job.narrative_text,
      confidence: job.confidence,
      risk: job.risk_label,
      volatilityOrRisk: job.risk_label,
      dataPoints: job.data_points,
      signalMetadata: job.signal_metadata,
      signalQuality: job.signal_quality,
    };
  } else {
    video = {
      ...shared,
      assetClass: job.assetType,
      tickers: [job.asset],
      insights: job.insights,
      analystNote: job.analystNote,
      assets: [{ticker: job.asset, name: job.assetName, assetType: job.assetType}],
      period: {startDate: job.startDate, endDate: job.endDate},
      investment: job.investment,
      metrics: {
        startPrice: job.startPrice,
        currentPrice: job.currentPrice,
        return: job.return,
        valueToday: job.valueToday,
        bestBuyDate: job.bestBuyDate,
        bestBuyPrice: job.bestBuyPrice,
        sharesAccumulated: job.sharesAccumulated,
      },
      performance: {
        return: job.return,
        valueToday: job.valueToday,
      },
      timeline: compactTimeline(job.timeline),
    };
  }

  return {
    channel: {
      profile: 'AlphaFrames finance shorts',
      language: 'English',
      platform: 'youtube-shorts',
    },
    video,
    sourceJob: job,
    extraContext: extraContext?.trim() || undefined,
    outputRenderPath,
  };
}

export function extractResponseText(response: {choices?: Array<{message?: {content?: string | null}}>}): string {
  return response.choices?.[0]?.message?.content?.trim() ?? '';
}

function parseDraftJson(responseText: string): PublishingDraft {
  const parsed = JSON.parse(responseText) as unknown;
  const draft = publishingDraftSchema.parse(parsed);

  return {
    ...draft,
    platforms: {
      youtube: {
        ...draft.platforms.youtube,
        tags: draft.platforms.youtube.tags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean),
        hashtags: draft.platforms.youtube.hashtags
          .map((hashtag) => hashtag.trim())
          .filter(Boolean)
          .map((hashtag) => (hashtag.startsWith('#') ? hashtag : `#${hashtag}`)),
      },
    },
  };
}

export async function generatePublishingDraft({
  job,
  extraContext,
  copyModelInstructions,
  outputRenderPath,
}: {
  job: AnyGeneratedVideoData;
  extraContext?: string;
  copyModelInstructions?: string;
  outputRenderPath?: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate publishing drafts.');
  }

  const [template, footer] = await Promise.all([loadPublishingTemplate(), loadYouTubeDescriptionFooter()]);
  const compactTemplate = compactPublishingTemplate(template);
  const metadata = buildPublishingMetadata({job, extraContext, outputRenderPath});
  const model = process.env.OPENAI_PUBLISHING_MODEL || DEFAULT_PUBLISHING_MODEL;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You generate structured JSON publishing drafts for YouTube Shorts. Return JSON only and never invent facts not present in metadata.',
      },
      {
        role: 'user',
        content: [
          compactTemplate,
          copyModelInstructions ? `\n\nAdditional operator instructions:\n${copyModelInstructions}` : '',
          `\n\nVideo metadata JSON:\n${JSON.stringify(metadata, null, 2)}`,
        ].join(''),
      },
    ],
    response_format: {type: 'json_object'},
    temperature: 0.45,
    max_tokens: 900,
  });

  const draft = parseDraftJson(extractResponseText(response));
  const youtube = draft.platforms.youtube;

  return {
    draft: {
      ...draft,
      platforms: {
        youtube: {
          ...youtube,
          description: appendYouTubeDescriptionFooter({description: youtube.description, footer}),
        },
      },
    },
    metadata,
    model,
    templateName: TEMPLATE_NAME,
  };
}
