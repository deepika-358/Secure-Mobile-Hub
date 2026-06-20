import OpenAI from "openai";
import { logger } from "./logger";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required. Add it in the Secrets panel.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DetectionResult {
  verdict: "real" | "fake" | "uncertain";
  confidence: number;
  explanation: string;
  indicators: string;
}

export async function detectFakeNews(
  title: string,
  content: string,
  source?: string | null,
): Promise<DetectionResult> {
  const prompt = `You are an expert fact-checker and misinformation analyst. Analyze the following news article and determine if it is real, fake, or uncertain.

Title: ${title}
Source: ${source || "Unknown"}
Content: ${content}

Respond with a JSON object with these exact fields:
- verdict: "real", "fake", or "uncertain"
- confidence: a number from 0 to 100 representing your confidence percentage
- explanation: a detailed 2-3 sentence explanation of your assessment
- indicators: a comma-separated list of key red flags or credibility signals you noticed (e.g., "sensational headline, anonymous sources, no verifiable facts" or "credible sources cited, factual language, corroborated by known events")

Base your analysis on:
1. Language patterns (sensationalism, emotional manipulation, exaggeration)
2. Source credibility and specificity
3. Logical consistency and factual plausibility
4. Writing quality and journalistic standards
5. Presence of verifiable claims vs vague assertions

Only respond with the JSON object, no additional text.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert misinformation analyst. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
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
  } catch (err) {
    logger.error({ err }, "OpenAI detection failed");
    return {
      verdict: "uncertain",
      confidence: 0,
      explanation:
        "Automated analysis failed. Please try again or review manually.",
      indicators: "analysis-error",
    };
  }
}
