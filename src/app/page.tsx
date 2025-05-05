'use client';

import React, { useState } from 'react';
import { CvOptimizerForm } from '@/components/cv-optimizer-form';
import { CvAnalysisResults } from '@/components/cv-analysis-results';
import { GeneratedCvDisplay } from '@/components/generated-cv-display';
import { GeneratedCoverLetterDisplay } from '@/components/generated-cover-letter-display'; // Import new component
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Type remains the same, structure inside changed
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  // State for analysis - uses the full AnalyzeCvOutput type
  const [analysisResult, setAnalysisResult] = useState<AnalyzeCvOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // State for CV creation (Markdown)
  const [generatedCvMarkdown, setGeneratedCvMarkdown] = useState<string | null>(null);
  const [isCreatingCv, setIsCreatingCv] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  // State for Cover Letter creation
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [isCreatingCoverLetter, setIsCreatingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);


  // --- Handlers ---

  const handleAnalysisStart = () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null); // Clear analysis result on new start
    // Clear other results when starting analysis
    setGeneratedCvMarkdown(null);
    setCreationError(null);
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
  };

  // Accepts the full AnalyzeCvOutput object
  const handleAnalysisComplete = (result: AnalyzeCvOutput | null, err: string | null) => {
    setAnalysisResult(result); // Store the full result including breakdown
    setAnalysisError(err);
    setIsAnalyzing(false);
  };

  const handleCreationStart = () => {
    setIsCreatingCv(true);
    setCreationError(null);
    setGeneratedCvMarkdown(null);
    // Clear other results when starting CV creation
    setAnalysisResult(null); // Clear analysis when creating CV
    setAnalysisError(null);
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
  };

  const handleCreationComplete = (markdown: string | null, err: string | null) => {
    setGeneratedCvMarkdown(markdown);
    setCreationError(err);
    setIsCreatingCv(false);
  };

  const handleCoverLetterStart = () => {
    setIsCreatingCoverLetter(true);
    setCoverLetterError(null);
    setGeneratedCoverLetter(null);
    // Don't clear analysis results when starting cover letter, as it might be used
    // Clear other results though
    // setAnalysisResult(null); // Keep analysisResult
    // setAnalysisError(null);
    setGeneratedCvMarkdown(null);
    setCreationError(null);
  };

  const handleCoverLetterComplete = (text: string | null, err: string | null) => {
    setGeneratedCoverLetter(text);
    setCoverLetterError(err);
    setIsCreatingCoverLetter(false);
  };

  // Helper to determine if any result section is potentially visible
  const shouldShowAnyResult =
    analysisResult || isAnalyzing || analysisError ||
    generatedCvMarkdown || isCreatingCv || creationError ||
    generatedCoverLetter || isCreatingCoverLetter || coverLetterError;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">CV Assistant</h1>
          <p className="text-lg text-muted-foreground">
            Analyze your CV, generate a tailored version, or create a cover letter.
          </p>
        </header>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Input Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CvOptimizerForm
              onAnalysisStart={handleAnalysisStart}
              onAnalysisComplete={handleAnalysisComplete} // Passes the full result
              onCreationStart={handleCreationStart}
              onCreationComplete={handleCreationComplete}
              onCoverLetterStart={handleCoverLetterStart} // Pass cover letter handlers
              onCoverLetterComplete={handleCoverLetterComplete} // Pass cover letter handlers
              isAnalyzing={isAnalyzing}
              isCreating={isCreatingCv}
              isCreatingCoverLetter={isCreatingCoverLetter} // Pass cover letter loading state
              analysisResult={analysisResult} // Pass down the analysis result state
            />
          </CardContent>
        </Card>

        {/* Conditionally render result sections */}
        {shouldShowAnyResult && (
          <div className="space-y-6">
            {/* Analysis Results Section - Receives the full analysisResult object */}
            {(analysisResult || isAnalyzing || analysisError) && (
              <CvAnalysisResults
                result={analysisResult} // Pass the full result object
                isLoading={isAnalyzing}
                error={analysisError}
              />
            )}

            {/* Generated CV Section */}
            {(generatedCvMarkdown || isCreatingCv || creationError) && (
              <GeneratedCvDisplay
                cvMarkdown={generatedCvMarkdown}
                isLoading={isCreatingCv}
                error={creationError}
              />
            )}

            {/* Generated Cover Letter Section */}
            {(generatedCoverLetter || isCreatingCoverLetter || coverLetterError) && (
              <GeneratedCoverLetterDisplay
                coverLetterText={generatedCoverLetter}
                isLoading={isCreatingCoverLetter}
                error={coverLetterError}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
