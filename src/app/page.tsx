'use client';

import React, { useState } from 'react';
import { CvOptimizerForm } from '@/components/cv-optimizer-form';
import { CvAnalysisResults } from '@/components/cv-analysis-results';
import { GeneratedCvDisplay } from '@/components/generated-cv-display';
import { GeneratedCoverLetterDisplay } from '@/components/generated-cover-letter-display'; // Import new component
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Import the type
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  // State for analysis
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
    setAnalysisResult(null);
    // Clear other results when starting analysis
    setGeneratedCvMarkdown(null);
    setCreationError(null);
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
  };

  const handleAnalysisComplete = (result: AnalyzeCvOutput | null, err: string | null) => {
    setAnalysisResult(result);
    setAnalysisError(err);
    setIsAnalyzing(false);
  };

  const handleCreationStart = () => {
    setIsCreatingCv(true);
    setCreationError(null);
    setGeneratedCvMarkdown(null);
    // Clear other results when starting CV creation
    setAnalysisResult(null);
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
    // Clear other results when starting cover letter creation
    setAnalysisResult(null);
    setAnalysisError(null);
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
              onAnalysisComplete={handleAnalysisComplete}
              onCreationStart={handleCreationStart}
              onCreationComplete={handleCreationComplete}
              onCoverLetterStart={handleCoverLetterStart} // Pass cover letter handlers
              onCoverLetterComplete={handleCoverLetterComplete} // Pass cover letter handlers
              isAnalyzing={isAnalyzing}
              isCreating={isCreatingCv}
              isCreatingCoverLetter={isCreatingCoverLetter} // Pass cover letter loading state
            />
          </CardContent>
        </Card>

        {/* Conditionally render result sections */}
        {shouldShowAnyResult && (
          <div className="space-y-6">
            {/* Analysis Results Section */}
            {(analysisResult || isAnalyzing || analysisError) && (
              <CvAnalysisResults
                result={analysisResult}
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
