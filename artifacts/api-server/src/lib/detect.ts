import OpenAI from "openai";
import { logger } from "./logger";

export interface DetectionResult {
  verdict: "real" | "fake" | "uncertain";
  confidence: number;
  explanation: string;
  indicators: string;
}

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.length < 20 || !apiKey.startsWith("sk-")) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// ── Rule-based fallback detector ──────────────────────────────────────────────

const FAKE_SIGNALS = [
  /\b(SHOCKING|BREAKING|EXCLUSIVE|BOMBSHELL|EXPLOSIVE|MUST\s*READ|SHARE\s*BEFORE\s*DELETE)\b/i,
  /!!+/,
  /\b(deep\s*state|new\s*world\s*order|illuminati|wake\s*up\s*people|they\s*don'?t\s*want\s*you\s*to\s*know)\b/i,
  /\b(miracle\s*cure|doctors\s*hate|big\s*pharma|mainstream\s*media\s*won'?t|censored)\b/i,
  /\b(anonymous\s*source|whistleblower|insider\s*reveals|leaked)\b/i,
  /\b(100%\s*natural|proven\s*to|guaranteed|you\s*won'?t\s*believe)\b/i,
];

const REAL_SIGNALS = [
  /\b(according\s*to|reported\s*by|published\s*in|peer.reviewed|journal|study|research)\b/i,
  /\b(university|institute|department|ministry|government|officials?|spokesperson)\b/i,
  /\b(confirmed|verified|official|statement|data|statistics|findings)\b/i,
  /\b(percent|million|billion|survey|analysis|investigation)\b/i,
];

const SENSATIONAL_WORDS = [
  /\ball\s*caps\b/i,
  /[A-Z]{5,}/,
];

function ruleBasedDetect(
  title: string,
  content: string,
  source?: string | null,
): DetectionResult {
  const text = `${title} ${content}`;
  let fakeScore = 0;
  let realScore = 0;
  const foundFake: string[] = [];
  const foundReal: string[] = [];

  for (const pattern of FAKE_SIGNALS) {
    if (pattern.test(text)) {
      fakeScore += 2;
      foundFake.push(pattern.source.replace(/\\b|\\s\*|\(\?:|\)/g, "").split("|")[0].slice(0, 20));
    }
  }

  for (const pattern of REAL_SIGNALS) {
    if (pattern.test(text)) {
      realScore += 1.5;
      foundReal.push(pattern.source.replace(/\\b|\\s\*|\(\?:|\)/g, "").split("|")[0].slice(0, 20));
    }
  }

  for (const pattern of SENSATIONAL_WORDS) {
    if (pattern.test(text)) fakeScore += 1;
  }

  if (source) {
    const knownCredible = /\b(reuters|ap news|bbc|nytimes|guardian|washington post|the hindu|indian express|ndtv|pti)\b/i;
    const knownSuspect = /\b(truth|alert|exposed|real\s*news|freedom|patriot|breaking|daily\s*buzz)\b/i;
    if (knownCredible.test(source)) realScore += 3;
    if (knownSuspect.test(source)) fakeScore += 3;
  }

  const total = fakeScore + realScore;
  const indicators: string[] = [];
  if (foundFake.length) indicators.push(...foundFake.map(s => `fake-signal: ${s}`));
  if (foundReal.length) indicators.push(...foundReal.map(s => `credibility: ${s}`));

  if (total === 0) {
    return {
      verdict: "uncertain",
      confidence: 40,
      explanation:
        "Rule-based analysis found no strong signals either way. The article uses neutral language with no clear credibility or misinformation markers. For a more accurate analysis, add a valid OPENAI_API_KEY.",
      indicators: "no-strong-signals",
    };
  }

  if (fakeScore > realScore * 1.5) {
    const conf = Math.min(85, 50 + fakeScore * 5);
    return {
      verdict: "fake",
      confidence: conf,
      explanation: `Rule-based analysis detected ${fakeScore.toFixed(0)} misinformation signals: sensational language, anonymous sources, or emotional manipulation patterns. This does not use AI — add a valid OPENAI_API_KEY for deeper analysis.`,
      indicators: indicators.join(", ") || "sensational-language",
    };
  }

  if (realScore > fakeScore * 1.2) {
    const conf = Math.min(82, 50 + realScore * 5);
    return {
      verdict: "real",
      confidence: conf,
      explanation: `Rule-based analysis found ${realScore.toFixed(0)} credibility signals: factual language, named institutions, or verifiable sources. This does not use AI — add a valid OPENAI_API_KEY for deeper analysis.`,
      indicators: indicators.join(", ") || "credible-language",
    };
  }

  return {
    verdict: "uncertain",
    confidence: 45,
    explanation:
      "Rule-based analysis found mixed signals — some credibility markers and some misinformation patterns. Add a valid OPENAI_API_KEY for accurate AI-powered analysis.",
    indicators: indicators.join(", ") || "mixed-signals",
  };
}

// ── Main detection entry point ─────────────────────────────────────────────────

const SYSTEM_PROMPT =
  "You are an expert misinformation analyst. Always respond with valid JSON only.";

const DETECTION_PROMPT = (
  title: string,
  content: string,
  source?: string | null,
) => `You are an expert fact-checker and misinformation analyst. Analyze the following news article and determine if it is real, fake, or uncertain.

Title: ${title}
Source: ${source || "Unknown"}
Content: ${content}

Respond with a JSON object with these exact fields:
- verdict: "real", "fake", or "uncertain"
- confidence: a number from 0 to 100 representing your confidence percentage
- explanation: a detailed 2-3 sentence explanation of your assessment
- indicators: a comma-separated list of key red flags or credibility signals you noticed

Base your analysis on:
1. Language patterns (sensationalism, emotional manipulation, exaggeration)
2. Source credibility and specificity
3. Logical consistency and factual plausibility
4. Writing quality and journalistic standards
5. Presence of verifiable claims vs vague assertions

Only respond with the JSON object, no additional text.`;

function parseDetectionJSON(raw: string): DetectionResult {
  const parsed = JSON.parse(raw) as Partial<DetectionResult>;
  return {
    verdict:
      parsed.verdict === "real" || parsed.verdict === "fake"
        ? parsed.verdict
        : "uncertain",
    confidence: Math.min(100, Math.max(0, parsed.confidence ?? 50)),
    explanation: parsed.explanation ?? "Analysis could not be completed.",
    indicators: parsed.indicators ?? "",
  };
}

export async function detectFakeNews(
  title: string,
  content: string,
  source?: string | null,
): Promise<DetectionResult> {
  const client = getClient();

  if (!client) {
    logger.warn("OPENAI_API_KEY not set or invalid — using rule-based fallback");
    return ruleBasedDetect(title, content, source);
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: DETECTION_PROMPT(title, content, source) },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    return parseDetectionJSON(raw);
  } catch (err) {
    logger.error({ err }, "OpenAI detection failed — falling back to rule-based");
    return ruleBasedDetect(title, content, source);
  }
}

export interface ImageExtractionResult {
  title: string;
  content: string;
  source?: string;
}

export async function extractAndDetectFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<{ extraction: ImageExtractionResult; detection: DetectionResult }> {
  const client = getClient();

  if (!client) {
    logger.warn("OPENAI_API_KEY not set — cannot process image");
    const extraction = { title: "Image upload", content: "", source: undefined };
    return {
      extraction,
      detection: ruleBasedDetect("Image upload", ""),
    };
  }

  try {
    const extractResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at reading news articles from images. Extract the article content and respond with valid JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: `Extract the news article from this image and respond with a JSON object with these fields:
- title: the headline or title of the news article (string)
- content: the full body text of the article (string)
- source: the news source/publication name if visible (string or null)

If no news article is visible, set title to "Unknown" and content to "No article content found in image".
Only respond with the JSON object.`,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const rawExtraction =
      extractResponse.choices[0]?.message?.content ?? "{}";
    const extraction = JSON.parse(rawExtraction) as ImageExtractionResult;
    const detection = await detectFakeNews(
      extraction.title ?? "Unknown",
      extraction.content ?? "",
      extraction.source,
    );
    return { extraction, detection };
  } catch (err) {
    logger.error({ err }, "Image extraction failed — falling back to rule-based");
    const extraction = { title: "Image upload", content: "", source: undefined };
    return { extraction, detection: ruleBasedDetect("Image upload", "") };
  }
}
