import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, BarChart3, Lightbulb, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AiInsightsProps {
  surveyId: number;
}

export function AiInsights({ surveyId }: AiInsightsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: summary, isLoading, refetch } = trpc.surveys.getAiSummary.useQuery(
    { surveyId },
    { retry: false }
  );

  const generateMutation = trpc.surveys.generateAiSummary.useMutation({
    onSuccess: () => {
      setIsGenerating(false);
      refetch();
    },
    onError: (error) => {
      setIsGenerating(false);
    },
  });

  const handleGenerateAnalysis = async () => {
    setIsGenerating(true);
    await generateMutation.mutateAsync({ surveyId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">
            No AI analysis available yet. Generate an analysis to extract themes, sentiment, and key insights from open-ended responses.
          </p>
          <Button onClick={handleGenerateAnalysis} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate AI Summary
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
          {summary.generatedAt && (
            <p className="text-sm text-muted-foreground">
              Generated {new Date(summary.generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button onClick={handleGenerateAnalysis} variant="outline" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Refreshing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {/* Sentiment Breakdown */}
      {summary && (summary as any).sentimentBreakdown && (
        <Card className="p-6">
          <h4 className="mb-4 flex items-center text-base font-semibold">
            <BarChart3 className="mr-2 h-5 w-5" />
            Sentiment Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {(summary.sentimentBreakdown as any).positive}%
              </div>
              <p className="text-sm text-green-700">Positive</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {(summary.sentimentBreakdown as any).neutral}%
              </div>
              <p className="text-sm text-gray-700">Neutral</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {(summary.sentimentBreakdown as any).negative}%
              </div>
              <p className="text-sm text-red-700">Negative</p>
            </div>
          </div>
        </Card>
      )}

      {/* Key Themes */}
      {summary && (summary as any).themes && ((summary as any).themes as any[]).length > 0 && (
        <Card className="p-6">
          <h4 className="mb-4 font-semibold">Key Themes</h4>
          <div className="space-y-3">
            {((summary as any).themes as any[]).map((theme: any, idx: number) => (
              <div key={idx} className="border-l-4 border-primary bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{theme.theme}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {theme.count} mentions
                  </span>
                </div>
                {theme.examples && theme.examples.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {theme.examples.slice(0, 2).map((example: string, i: number) => (
                      <p key={i} className="text-sm italic text-muted-foreground">
                        "{example}"
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Phrases */}
      {summary && (summary as any).keyPhrases && ((summary as any).keyPhrases as any[]).length > 0 && (
        <Card className="p-6">
          <h4 className="mb-4 font-semibold">Most Mentioned Phrases</h4>
          <div className="flex flex-wrap gap-2">
            {((summary as any).keyPhrases as any[]).map((phrase: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1"
              >
                <span className="text-sm font-medium">{phrase.phrase}</span>
                <span className="text-xs font-semibold text-primary">{phrase.frequency}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actionable Insights */}
      {summary && (summary as any).insights && (
        <Card className="border-l-4 border-amber-500 bg-amber-50 p-6">
          <h4 className="mb-3 flex items-center font-semibold text-amber-900">
            <Lightbulb className="mr-2 h-5 w-5" />
            Actionable Insights
          </h4>
          <p className="whitespace-pre-wrap text-sm text-amber-800">{summary.insights}</p>
        </Card>
      )}
    </div>
  );
}
