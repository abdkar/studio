
'use client';

import React, { useState } from 'react';
import { CvOptimizerForm } from '@/components/cv-optimizer-form';
import { CvAnalysisResults } from '@/components/cv-analysis-results';
import { GeneratedCvDisplay } from '@/components/generated-cv-display';
import { GeneratedCoverLetterDisplay } from '@/components/generated-cover-letter-display';
import { CoverLetterEvaluationResults } from '@/components/cover-letter-evaluation-results'; // Import new component
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer';
import { evaluateCoverLetter, type EvaluateCoverLetterOutput } from '@/ai/flows/evaluate-cover-letter-flow'; // Import evaluation flow
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  // --- State Variables ---
  const [cvText, setCvText] = useState<string>('');
  const [jobDescText, setJobDescText] = useState<string>('');

  const [analysisResult, setAnalysisResult] = useState<AnalyzeCvOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [generatedCvMarkdown, setGeneratedCvMarkdown] = useState<string | null>(null);
  const [isCreatingCv, setIsCreatingCv] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);

  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [isCreatingCoverLetter, setIsCreatingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState<string | null>(null);

  const [coverLetterEvaluation, setCoverLetterEvaluation] = useState<EvaluateCoverLetterOutput | null>(null);
  const [isEvaluatingCoverLetter, setIsEvaluatingCoverLetter] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // --- Helper Function ---
  const clearAllResults = () => {
    setAnalysisResult(null);
    setAnalysisError(null);
    setGeneratedCvMarkdown(null);
    setCreationError(null);
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
    setCoverLetterEvaluation(null);
    setEvaluationError(null);
  };

  // --- Handlers ---
  const handleAnalysisStart = () => {
    clearAllResults();
    setIsAnalyzing(true);
  };

  const handleAnalysisComplete = (result: AnalyzeCvOutput | null, err: string | null) => {
    setAnalysisResult(result);
    setAnalysisError(err);
    setIsAnalyzing(false);
  };

  const handleCreationStart = () => {
    clearAllResults();
    setIsCreatingCv(true);
  };

  const handleCreationComplete = (markdown: string | null, err: string | null) => {
    setGeneratedCvMarkdown(markdown);
    setCreationError(err);
    setIsCreatingCv(false);
  };

  const handleCoverLetterStart = () => {
    // Clear results except analysis which might be used
    setGeneratedCvMarkdown(null);
    setCreationError(null);
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
    setCoverLetterEvaluation(null);
    setEvaluationError(null);
    setIsCreatingCoverLetter(true);
    setIsEvaluatingCoverLetter(false); // Ensure evaluation state is reset
  };

  // Renamed internal handler
  const handleCoverLetterGenerationComplete = async (text: string | null, err: string | null) => {
    setGeneratedCoverLetter(text);
    setCoverLetterError(err);
    setIsCreatingCoverLetter(false);

    // If generation was successful, automatically trigger evaluation
    if (text && !err) {
      handleEvaluationStart(); // Start evaluation loading state
      try {
        const evaluationInput = {
          generatedCoverLetterText: text,
          jobDescriptionText: jobDescText, // Use jobDescText from state
        };
        const evaluationResult = await evaluateCoverLetter(evaluationInput);
        handleEvaluationComplete(evaluationResult, null);
      } catch (evalError) {
        console.error("Cover Letter Evaluation Error:", evalError);
        const evalErrorMessage = evalError instanceof Error ? evalError.message : "Unknown evaluation error.";
        handleEvaluationComplete(null, `Evaluation failed: ${evalErrorMessage}`);
      }
    } else {
        // If generation failed, ensure evaluation state is off
        setIsEvaluatingCoverLetter(false);
    }
  };


  const handleEvaluationStart = () => {
    setIsEvaluatingCoverLetter(true);
    setEvaluationError(null);
    setCoverLetterEvaluation(null);
  };

  const handleEvaluationComplete = (result: EvaluateCoverLetterOutput | null, err: string | null) => {
    setCoverLetterEvaluation(result);
    setEvaluationError(err);
    setIsEvaluatingCoverLetter(false);
  };


  // Helper to determine if any result section is potentially visible
  const shouldShowAnyResult =
    analysisResult || isAnalyzing || analysisError ||
    generatedCvMarkdown || isCreatingCv || creationError ||
    generatedCoverLetter || isCreatingCoverLetter || coverLetterError ||
    coverLetterEvaluation || isEvaluatingCoverLetter || evaluationError; // Add evaluation states

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">CV Assistant</h1>
          <p className="text-lg text-muted-foreground">
            Analyze your CV, generate a tailored version, or create and evaluate a cover letter.
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
              onCoverLetterStart={handleCoverLetterStart}
              onCoverLetterComplete={handleCoverLetterGenerationComplete} // Use internal handler
              isAnalyzing={isAnalyzing}
              isCreating={isCreatingCv}
              isCreatingCoverLetter={isCreatingCoverLetter}
              analysisResult={analysisResult}
              // Pass state setters for text inputs
              cvText={cvText}
              jobDescText={jobDescText}
              onCvTextChange={setCvText}
              onJobDescTextChange={setJobDescText}
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

             {/* Cover Letter Evaluation Section */}
            {(coverLetterEvaluation || isEvaluatingCoverLetter || evaluationError) && (
               <CoverLetterEvaluationResults
                 result={coverLetterEvaluation}
                 isLoading={isEvaluatingCoverLetter}
                 error={evaluationError}
               />
             )}
          </div>
        )}
      </div>
    </main>
  );
}
