import {readFile} from 'fs/promises';
import path from 'path';
import {z} from 'zod';
import {openai} from '@/lib/openai';
import {TEMPLATE_OPTIONS} from '@/lib/constants';
import type {AnyGeneratedVideoData, PublishingDraft, PublishingDraftMetadata} from '@/types';

const PROMPT_PATH = path.join(process.cwd(), 'config', 'publishing', 'alphaframes-youtube-shorts-prompt.md');
const FOOTER_PATH = path.join(process.cwd(), 'config', 'publishing', 'youtube-description-footer.md');
const DEFAULT_PUBLISHING_MODEL = 'gpt-5.4-mini';
const TEMPLATE_NAME = 'alphaframes-youtube-shorts-prompt';

const publishingDraftSchema = z.object({
  summary: z.string().trim().min(1),
  platforms: z.object({
    youtube: z.object({
      title: z.string().trim().min(1).max(100),
      description: z.string().trim().min(1).max(700),
      tags: z.array(z.string().trim().min(1).max(80)).min(12).max(18),
      hashtags: z.array(z.string().trim().min(1).max(50)).min(1).max(10),
      thumbnailNotes: z.string().trim().max(500).default(''),
    }),
  }),
});

const publishingDraftJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'platforms'],
  properties: {
    summary: {type: 'string', minLength: 1},
    platforms: {
      type: 'object',
      additionalProperties: false,
      required: ['youtube'],
      properties: {
        youtube: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'description', 'tags', 'hashtags', 'thumbnailNotes'],
          properties: {
            title: {type: 'string', minLength: 1, maxLength: 100},
            description: {type: 'string', minLength: 1, maxLength: 700},
            tags: {
              type: 'array',
              minItems: 12,
              maxItems: 18,
              items: {type: 'string', minLength: 1, maxLength: 80},
            },
            hashtags: {
              type: 'array',
              minItems: 1,
              maxItems: 10,
              items: {type: 'string', minLength: 1, maxLength: 50},
            },
            thumbnailNotes: {type: 'string', maxLength: 500},
          },
        },
      },
    },
  },
} as const;

export async function loadPublishingPrompt() {
  return readFile(PROMPT_PATH, 'utf8');
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

export function extractResponseText(response: {output_text?: string}): string {
  return response.output_text?.trim() ?? '';
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

  const [prompt, footer] = await Promise.all([loadPublishingPrompt(), loadYouTubeDescriptionFooter()]);
  const metadata = buildPublishingMetadata({job, extraContext, outputRenderPath});
  const model = process.env.OPENAI_PUBLISHING_MODEL || DEFAULT_PUBLISHING_MODEL;

  const response = await openai.responses.create({
    model,
    instructions: [
      'You generate structured publishing drafts for AlphaFrames YouTube Shorts.',
      'Return only data that matches the requested JSON schema.',
      'Never invent facts, numbers, dates, rankings, catalysts, tickers, or company names not present in metadata.',
      prompt,
    ].join('\n\n'),
    input: [
      copyModelInstructions ? `\n\nAdditional operator instructions:\n${copyModelInstructions}` : '',
      `\n\nVideo metadata JSON:\n${JSON.stringify(metadata, null, 2)}`,
    ].join(''),
    text: {
      format: {
        type: 'json_schema',
        name: 'alphaframes_publishing_draft',
        strict: true,
        schema: publishingDraftJsonSchema,
      },
    },
    temperature: 0.45,
    max_output_tokens: 1200,
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
