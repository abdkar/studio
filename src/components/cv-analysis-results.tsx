'use client';

import React from 'react';
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Lightbulb, ListChecks, Target, GraduationCap, Wrench, Briefcase } from 'lucide-react'; // Added GraduationCap, Wrench, Briefcase

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
           {/* Overall Score Skeleton */}
           <div>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <div className="flex items-center gap-4">
               <Skeleton className="h-3 w-full" />
               <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-4 w-4/5 mt-2" />
           </div>
           {/* Breakdown Skeletons */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/4 mb-2" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1">
                         <Skeleton className="h-5 w-1/3" />
                         <div className="flex items-center gap-4">
                            <Skeleton className="h-2 w-full" />
                             <Skeleton className="h-5 w-10" />
                         </div>
                    </div>
                ))}
            </div>
            {/* Suggestions Skeletons */}
            <div>
                 <Skeleton className="h-6 w-1/3 mb-4" />
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>

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

  // Only render the card if there is a result
  if (!result) {
    return null;
  }

  const { matchPercentage, suggestions, scoreBreakdown } = result;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Analysis Results</CardTitle>
        <CardDescription>
          Here's how well your CV matches the job description, a detailed score breakdown, and suggestions for improvement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Match Percentage */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
             <Target className="text-primary" /> Overall Match Score
          </h3>
          <div className="flex items-center gap-4">
             <Progress value={matchPercentage} aria-label={`${matchPercentage}% Overall Match`} className="h-3 bg-secondary [&>div]:bg-primary" />
            <span className="text-xl font-bold text-primary">{matchPercentage}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This score indicates the overall relevance of your CV to the job description based on keywords, skills, experience, and education.
          </p>
        </div>

        {/* Score Breakdown */}
        {scoreBreakdown && (
            <div className="space-y-4">
             <h3 className="text-lg font-semibold text-foreground">Score Breakdown</h3>
                {/* Experience Score */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                         <Briefcase className="h-4 w-4 text-accent" /> Experience Alignment
                    </label>
                    <div className="flex items-center gap-4">
                        <Progress value={scoreBreakdown.experience} aria-label={`Experience Score: ${scoreBreakdown.experience}%`} className="h-2 bg-secondary [&>div]:bg-accent" />
                        <span className="text-sm font-semibold text-accent">{scoreBreakdown.experience}%</span>
                    </div>
                </div>
                {/* Education Score */}
                 <div className="space-y-1">
                     <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-accent" /> Education Alignment
                     </label>
                     <div className="flex items-center gap-4">
                         <Progress value={scoreBreakdown.education} aria-label={`Education Score: ${scoreBreakdown.education}%`} className="h-2 bg-secondary [&>div]:bg-accent" />
                         <span className="text-sm font-semibold text-accent">{scoreBreakdown.education}%</span>
                     </div>
                 </div>
                 {/* Skills Score */}
                  <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                           <Wrench className="h-4 w-4 text-accent" /> Skills & Expertise Alignment
                      </label>
                      <div className="flex items-center gap-4">
                          <Progress value={scoreBreakdown.skills} aria-label={`Skills Score: ${scoreBreakdown.skills}%`} className="h-2 bg-secondary [&>div]:bg-accent" />
                          <span className="text-sm font-semibold text-accent">{scoreBreakdown.skills}%</span>
                      </div>
                  </div>
            </div>
        )}


        {/* Suggestions Accordion */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="text-primary" /> Improvement Suggestions
          </h3>
          <Accordion type="single" collapsible className="w-full" defaultValue='keywords'> {/* Default open keywords */}
            {suggestions.keywordsToAdd && suggestions.keywordsToAdd.length > 0 && (
              <AccordionItem value="keywords">
                <AccordionTrigger className="text-base hover:no-underline">
                  <ListChecks className="mr-2 h-5 w-5 text-primary" /> Keywords to Add
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
                  <Target className="mr-2 h-5 w-5 text-primary" /> Skills to Emphasize
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
                   <Briefcase className="mr-2 h-5 w-5 text-primary" /> {/* Using Briefcase icon */}
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
