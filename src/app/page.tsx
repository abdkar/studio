'use client';

import React, { useState } from 'react';
import { CvOptimizerForm } from '@/components/cv-optimizer-form';
import { CvAnalysisResults } from '@/components/cv-analysis-results';
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Import the type
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCvOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (result: AnalyzeCvOutput | null, err: string | null) => {
    setAnalysisResult(result);
    setError(err);
    setIsLoading(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">CV Optimizer</h1>
          <p className="text-lg text-muted-foreground">
            Optimize your CV for job applications by analyzing it against the job description.
          </p>
        </header>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Input Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CvOptimizerForm
              onAnalysisStart={() => {
                setIsLoading(true);
                setError(null);
                setAnalysisResult(null); // Clear previous results
              }}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </CardContent>
        </Card>

        <CvAnalysisResults
          result={analysisResult}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </main>
  );
}
