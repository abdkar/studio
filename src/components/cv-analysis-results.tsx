'use client';

import React from 'react';
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lightbulb, ListChecks, Target } from 'lucide-react';

type CvAnalysisResultsProps = {
  result: AnalyzeCvOutput | null;
  isLoading: boolean;
  error: string | null;
};

export function CvAnalysisResults({ result, isLoading, error }: CvAnalysisResultsProps) {
  if (isLoading) {
    return (
      <Card className="shadow-md animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Analysis Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!result) {
    return null; // Don't render anything if there's no result, error, or loading state
  }

  const { matchPercentage, suggestions } = result;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Analysis Results</CardTitle>
        <CardDescription>
          Here's how well your CV matches the job description and suggestions for improvement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Percentage */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
             <Target className="text-accent" /> Match Score
          </h3>
          <div className="flex items-center gap-4">
             <Progress value={matchPercentage} aria-label={`${matchPercentage}% Match`} className="h-3 bg-secondary [&>div]:bg-accent" />
            <span className="text-xl font-bold text-accent">{matchPercentage}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This score indicates the estimated relevance of your CV to the provided job description based on keywords and skills.
          </p>
        </div>

        {/* Suggestions Accordion */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="text-accent" /> Improvement Suggestions
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {suggestions.keywordsToAdd && suggestions.keywordsToAdd.length > 0 && (
              <AccordionItem value="keywords">
                <AccordionTrigger className="text-base hover:no-underline">
                  <ListChecks className="mr-2 h-5 w-5 text-accent" /> Keywords to Add
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1 text-foreground">
                    {suggestions.keywordsToAdd.map((keyword, index) => (
                      <li key={`keyword-${index}`}>{keyword}</li>
                    ))}
                  </ul>
                   <p className="text-xs text-muted-foreground mt-2">Consider naturally weaving these terms from the job description into your CV where relevant.</p>
                </AccordionContent>
              </AccordionItem>
            )}

            {suggestions.skillsToEmphasize && suggestions.skillsToEmphasize.length > 0 && (
              <AccordionItem value="skills">
                <AccordionTrigger className="text-base hover:no-underline">
                  <Target className="mr-2 h-5 w-5 text-accent" /> Skills to Emphasize
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-6 space-y-1 text-foreground">
                    {suggestions.skillsToEmphasize.map((skill, index) => (
                      <li key={`skill-${index}`}>{skill}</li>
                    ))}
                  </ul>
                   <p className="text-xs text-muted-foreground mt-2">Ensure these skills, mentioned in the job ad, are prominent and well-described in your CV.</p>
                </AccordionContent>
              </AccordionItem>
            )}

            {suggestions.experienceToDetail && (
              <AccordionItem value="experience">
                <AccordionTrigger className="text-base hover:no-underline">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-accent lucide lucide-briefcase"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>
                   Experience to Detail
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-foreground">{suggestions.experienceToDetail}</p>
                  <p className="text-xs text-muted-foreground mt-2">Elaborate on experiences relevant to the requirements mentioned in this area of the job description.</p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
