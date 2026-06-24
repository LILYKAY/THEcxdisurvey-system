import { invokeLLM } from "./_core/openai-llm";

export interface AiAnalysisResult {
  themes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keyPhrases: Array<{
    phrase: string;
    frequency: number;
  }>;
  insights: string;
}

export async function analyzeSurveyResponses(
  responses: Array<{
    questionText: string;
    value: unknown;
  }>
): Promise<AiAnalysisResult | null> {
  if (responses.length === 0) {
    return null;
  }

  // Format responses for analysis
  const responseText = responses
    .map((r) => {
      const value = typeof r.value === "string" ? r.value : JSON.stringify(r.value);
      return `Q: ${r.questionText}\nA: ${value}`;
    })
    .join("\n\n");

  try {
    // Use structured JSON schema for consistent output
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert survey analyst. Analyze the provided open-ended survey responses and extract:
1. Key themes/topics (group similar responses)
2. Sentiment distribution (positive/negative/neutral percentages)
3. Key phrases and their frequency
4. Actionable insights and recommendations

Respond with a valid JSON object matching the specified schema.` as string,
        },
        {
          role: "user",
          content: `Please analyze these survey responses:\n\n${responseText}` as string,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "survey_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              themes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    theme: {
                      type: "string",
                      description: "The main theme or topic",
                    },
                    count: {
                      type: "integer",
                      description: "Number of responses mentioning this theme",
                    },
                    examples: {
                      type: "array",
                      items: { type: "string" },
                      description: "Example quotes from responses",
                    },
                  },
                  required: ["theme", "count", "examples"],
                  additionalProperties: false,
                },
                description: "Key themes extracted from responses",
              },
              sentimentBreakdown: {
                type: "object",
                properties: {
                  positive: {
                    type: "number",
                    description: "Percentage of positive sentiment (0-100)",
                  },
                  negative: {
                    type: "number",
                    description: "Percentage of negative sentiment (0-100)",
                  },
                  neutral: {
                    type: "number",
                    description: "Percentage of neutral sentiment (0-100)",
                  },
                },
                required: ["positive", "negative", "neutral"],
                additionalProperties: false,
              },
              keyPhrases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    phrase: {
                      type: "string",
                      description: "A frequently mentioned phrase",
                    },
                    frequency: {
                      type: "integer",
                      description: "Number of times this phrase appears",
                    },
                  },
                  required: ["phrase", "frequency"],
                  additionalProperties: false,
                },
                description: "Most common phrases in responses",
              },
              insights: {
                type: "string",
                description: "Actionable insights and recommendations based on the analysis",
              },
            },
            required: ["themes", "sentimentBreakdown", "keyPhrases", "insights"],
            additionalProperties: false,
          },
        },
      },
    });

    // Parse the response
    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") return null;

    const parsed = JSON.parse(content) as AiAnalysisResult;
    return parsed;
  } catch (error) {
    console.error("Error analyzing survey responses:", error);
    return null;
  }
}
