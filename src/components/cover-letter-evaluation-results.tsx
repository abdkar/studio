
'use client';

import React from 'react';
import type { EvaluateCoverLetterOutput } from '@/ai/flows/evaluate-cover-letter-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckSquare, BarChart, MessageSquare, ClipboardCheck, Info, RefreshCw, Loader2 } from 'lucide-react';

type CoverLetterEvaluationResultsProps = {
  result: EvaluateCoverLetterOutput | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => Promise<void>;
  originalCoverLetterText: string | null;
  isRegenerating: boolean;
};

export function CoverLetterEvaluationResults({
  result,
  isLoading,
  error,
  onRegenerate,
  originalCoverLetterText,
  isRegenerating
}: CoverLetterEvaluationResultsProps) {
  if (isLoading && !isRegenerating) { // Show skeleton only if initial evaluation is loading
    return (
      <Card className="shadow-md animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <div className="flex items-center gap-4">
               <Skeleton className="h-3 w-full" />
               <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-4 w-4/5 mt-2" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-1/4 mb-1" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Evaluation Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return null;
  }

  const {
    relevanceScore,
    toneAnalysis,
    keywordUsage,
    clarityAndConciseness,
    atsFriendliness,
    overallFeedback
  } = result;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
           <CheckSquare className="h-6 w-6 text-primary" /> Cover Letter Evaluation
        </CardTitle>
        <CardDescription>
          Assessment of the generated cover letter against the job description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
             <BarChart className="text-primary" /> Relevance Score
          </h3>
          <div className="flex items-center gap-4">
             <Progress value={relevanceScore} aria-label={`${relevanceScore}% Relevance Score`} className="h-3 bg-secondary [&>div]:bg-primary" />
            <span className="text-xl font-bold text-primary">{relevanceScore}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            How well the letter addresses the specific requirements of the job description.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeedbackItem icon={MessageSquare} title="Tone Analysis" content={toneAnalysis} />
          <FeedbackItem icon={ClipboardCheck} title="Keyword Usage" content={keywordUsage} />
          <FeedbackItem icon={ClipboardCheck} title="Clarity & Conciseness" content={clarityAndConciseness} />
          <FeedbackItem icon={ClipboardCheck} title="ATS Friendliness" content={atsFriendliness} />
        </div>

        <div className="space-y-2 pt-4 border-t">
           <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Info className="text-primary" /> Overall Feedback & Suggestions
           </h3>
           <p className="text-sm text-foreground whitespace-pre-wrap">{overallFeedback}</p>
        </div>

        {overallFeedback && originalCoverLetterText && (
          <div className="mt-6 text-center">
            <Button
              onClick={onRegenerate}
              disabled={isRegenerating || isLoading}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate with Suggestions
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type FeedbackItemProps = {
    icon: React.ElementType;
    title: string;
    content: string;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ icon: Icon, title, content }) => (
     <div className="space-y-1">
        <h4 className="text-md font-medium text-foreground flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-accent" /> {title}
        </h4>
        <p className="text-sm text-muted-foreground">{content}</p>
    </div>
);
