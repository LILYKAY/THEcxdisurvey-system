import { describe, expect, it, vi } from "vitest";
import { analyzeSurveyResponses, type AiAnalysisResult } from "./ai-analysis";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async (params: any) => {
    // Return a mock analysis result
    const mockResult: AiAnalysisResult = {
      themes: [
        {
          theme: "Product Quality",
          count: 5,
          examples: ["Great quality", "Excellent product"],
        },
        {
          theme: "Customer Service",
          count: 3,
          examples: ["Helpful support", "Quick response"],
        },
      ],
      sentimentBreakdown: {
        positive: 75,
        negative: 15,
        neutral: 10,
      },
      keyPhrases: [
        { phrase: "very satisfied", frequency: 4 },
        { phrase: "great experience", frequency: 3 },
        { phrase: "would recommend", frequency: 2 },
      ],
      insights:
        "Overall, customers are highly satisfied with product quality and customer service. Main areas for improvement include faster delivery times and more customization options.",
    };

    return {
      choices: [
        {
          message: {
            content: JSON.stringify(mockResult),
          },
        },
      ],
    };
  }),
}));

describe("AI Analysis", () => {
  it("should analyze survey responses and return themes", async () => {
    const responses = [
      {
        questionText: "What did you like most about our product?",
        value: "Great quality and excellent customer service",
      },
      {
        questionText: "What did you like most about our product?",
        value: "Very satisfied with the product quality",
      },
    ];

    const result = await analyzeSurveyResponses(responses);

    expect(result).not.toBeNull();
    expect(result?.themes).toBeDefined();
    expect(result?.themes.length).toBeGreaterThan(0);
    expect(result?.themes[0]?.theme).toBe("Product Quality");
    expect(result?.themes[0]?.count).toBe(5);
  });

  it("should analyze sentiment breakdown", async () => {
    const responses = [
      {
        questionText: "How would you rate your experience?",
        value: "Excellent",
      },
    ];

    const result = await analyzeSurveyResponses(responses);

    expect(result?.sentimentBreakdown).toBeDefined();
    expect(result?.sentimentBreakdown.positive).toBe(75);
    expect(result?.sentimentBreakdown.negative).toBe(15);
    expect(result?.sentimentBreakdown.neutral).toBe(10);
  });

  it("should extract key phrases with frequency", async () => {
    const responses = [
      {
        questionText: "What would you improve?",
        value: "Faster delivery would be great",
      },
    ];

    const result = await analyzeSurveyResponses(responses);

    expect(result?.keyPhrases).toBeDefined();
    expect(result?.keyPhrases.length).toBeGreaterThan(0);
    expect(result?.keyPhrases[0]?.phrase).toBe("very satisfied");
    expect(result?.keyPhrases[0]?.frequency).toBe(4);
  });

  it("should generate actionable insights", async () => {
    const responses = [
      {
        questionText: "Any additional feedback?",
        value: "Overall very happy with the service",
      },
    ];

    const result = await analyzeSurveyResponses(responses);

    expect(result?.insights).toBeDefined();
    expect(result?.insights.length).toBeGreaterThan(0);
    expect(result?.insights).toContain("satisfied");
  });

  it("should return null for empty responses", async () => {
    const result = await analyzeSurveyResponses([]);

    expect(result).toBeNull();
  });

  it("should handle JSON responses with string values", async () => {
    const responses = [
      {
        questionText: "What features do you use most?",
        value: JSON.stringify({ features: ["Dashboard", "Reports"] }),
      },
    ];

    const result = await analyzeSurveyResponses(responses);

    expect(result).not.toBeNull();
    expect(result?.themes).toBeDefined();
  });

  it("should handle mixed response types", async () => {
    const responses = [
      {
        questionText: "Rating",
        value: 5,
      },
      {
        questionText: "Feedback",
        value: "Excellent service",
      },
      {
        questionText: "Would recommend?",
        value: true,
      },
    ];

    const result = await analyzeSurveyResponses(responses);

    expect(result).not.toBeNull();
    expect(result?.themes).toBeDefined();
    expect(result?.sentimentBreakdown).toBeDefined();
  });
});
