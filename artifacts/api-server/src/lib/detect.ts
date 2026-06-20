import OpenAI from "openai";
import { logger } from "./logger";

export interface DetectionResult {
  verdict: "real" | "fake" | "uncertain";
  confidence: number;
  explanation: string;
  indicators: string;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it in the Secrets panel.",
    );
  }
  return new OpenAI({ apiKey });
}

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
  try {
    const client = getClient();
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
    logger.error({ err }, "OpenAI detection failed");
    return {
      verdict: "uncertain",
      confidence: 0,
      explanation:
        "Automated analysis failed. Please add your OPENAI_API_KEY in the Secrets panel.",
      indicators: "analysis-error",
    };
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
  try {
    const client = getClient();

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
    logger.error({ err }, "Image extraction/detection failed");
    return {
      extraction: { title: "Unknown", content: "", source: undefined },
      detection: {
        verdict: "uncertain",
        confidence: 0,
        explanation:
          "Image analysis failed. Please add your OPENAI_API_KEY in the Secrets panel.",
        indicators: "analysis-error",
      },
    };
  }
}
