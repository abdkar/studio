'use client';

import React, { useState } from 'react';
import { CvOptimizerForm } from '@/components/cv-optimizer-form';
import { CvAnalysisResults } from '@/components/cv-analysis-results';
import { GeneratedCvDisplay } from '@/components/generated-cv-display'; // Import new component
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Import the type
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator'; // Import Separator

export default function Home() {
  // State for analysis
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCvOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // State for CV creation
  const [generatedCv, setGeneratedCv] = useState<string | null>(null);
  const [isCreatingCv, setIsCreatingCv] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null); // Clear previous analysis results
     // Optionally clear generated CV when starting analysis
     setGeneratedCv(null);
     setCreationError(null);
  };

  const handleAnalysisComplete = (result: AnalyzeCvOutput | null, err: string | null) => {
    setAnalysisResult(result);
    setAnalysisError(err);
    setIsAnalyzing(false);
  };

   const handleCreationStart = () => {
    setIsCreatingCv(true);
    setCreationError(null);
    setGeneratedCv(null); // Clear previous generated CV
     // Optionally clear analysis results when starting creation
     setAnalysisResult(null);
     setAnalysisError(null);
  };

  const handleCreationComplete = (result: string | null, err: string | null) => {
    setGeneratedCv(result);
    setCreationError(err);
    setIsCreatingCv(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">CV Assistant</h1>
          <p className="text-lg text-muted-foreground">
            Analyze your CV against a job description or generate a tailored, ATS-friendly version.
          </p>
        </header>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Input Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CvOptimizerForm
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete}
              onCreationStart={handleCreationStart} // Pass creation handlers
              onCreationComplete={handleCreationComplete} // Pass creation handlers
              isAnalyzing={isAnalyzing} // Pass analyzing state
              isCreating={isCreatingCv} // Pass creating state
            />
          </CardContent>
        </Card>

        {/* Analysis Results Section */}
        {(analysisResult || isAnalyzing || analysisError) && (
             <CvAnalysisResults
                result={analysisResult}
                isLoading={isAnalyzing}
                error={analysisError}
             />
         )}


        {/* Separator only if both sections might appear */}
        {(analysisResult || isAnalyzing || analysisError) && (generatedCv || isCreatingCv || creationError) && (
           <Separator className="my-6" />
        )}


        {/* Generated CV Section */}
        {(generatedCv || isCreatingCv || creationError) && (
            <GeneratedCvDisplay
                cvText={generatedCv}
                isLoading={isCreatingCv}
                error={creationError}
            />
         )}
      </div>
    </main>
  );
}
