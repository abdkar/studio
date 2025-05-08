'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CvOptimizerForm } from '@/components/cv-optimizer-form';
import { CvAnalysisResults } from '@/components/cv-analysis-results';
import { GeneratedCvDisplay } from '@/components/generated-cv-display';
import { GeneratedCoverLetterDisplay } from '@/components/generated-cover-letter-display';
import { CoverLetterEvaluationResults } from '@/components/cover-letter-evaluation-results';
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer';
import { analyzeCv } from '@/ai/flows/cv-analyzer';
import { createCv, type CreateCvOutput, type CreateCvInput as CreateCvGenInput } from '@/ai/flows/create-cv-flow'; // Renamed import type to avoid conflict
import { createCoverLetter, type CreateCoverLetterOutput, type CreateCoverLetterInput } from '@/ai/flows/create-cover-letter-flow';
import { evaluateCoverLetter, type EvaluateCoverLetterOutput } from '@/ai/flows/evaluate-cover-letter-flow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileCheck2, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";


export default function Home() {
  // --- Refs ---
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  // --- State Variables ---
  const [cvText, setCvText] = useState<string>('');
  const [jobDescText, setJobDescText] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');

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

  const [isProcessingInput, setIsProcessingInput] = useState(false);

  const { toast } = useToast();

  // --- Helper Function ---
  const clearAllResults = (clearAnalysis = true) => {
    if (clearAnalysis) {
      setAnalysisResult(null);
      setAnalysisError(null);
    }
    setGeneratedCvMarkdown(null);
    setCreationError(null);
    setGeneratedCoverLetter(null);
    setCoverLetterError(null);
    setCoverLetterEvaluation(null);
    setEvaluationError(null);
    setIsCreatingCv(false);
    setIsCreatingCoverLetter(false);
    setIsEvaluatingCoverLetter(false);
  };

  // --- Handlers ---

  const handleAnalyzeDocuments = async () => {
    if (!cvText || cvText.trim().length < 50) {
       toast({ variant: "destructive", title: "CV Missing", description: "Please provide CV text or upload a valid CV file." });
       return;
    }
     if (!jobDescText || jobDescText.trim().length < 50) {
       toast({ variant: "destructive", title: "Job Description Missing", description: "Please paste the job description text." });
       return;
    }

    clearAllResults();
    setIsAnalyzing(true);
    setIsProcessingInput(true);

    try {
      console.log('[Home] Submitting for analysis...');
      const analysisInput = { cvText, jobDescriptionText: jobDescText };
      const result = await analyzeCv(analysisInput);
      console.log('[Home] Analysis result received:', result);
      setAnalysisResult(result);
      setAnalysisError(null);
      toast({
        title: "Analysis Complete",
        description: "Your CV has been analyzed. You can now generate a tailored CV or cover letter.",
      });
    } catch (error) {
      console.error('[Home] Error analyzing CV:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
      setAnalysisResult(null);
      setAnalysisError(`Analysis failed: ${errorMessage}. Please check the input and try again.`);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: `An error occurred: ${errorMessage}. Please try again.`,
        duration: 9000,
      });
    } finally {
      setIsAnalyzing(false);
      setIsProcessingInput(false);
    }
  };


  const handleCreateTailoredCv = async () => {
      if (!analysisResult && (!cvText || !jobDescText)) { // Allow CV creation even without prior analysis if texts are present
           toast({ variant: "destructive", title: "Input Missing", description: "Please provide CV and Job Description text, or analyze first." });
           return;
      }
       if (!cvText || cvText.trim().length < 50) {
           toast({ variant: "destructive", title: "CV Missing", description: "CV text is required to generate a tailored CV." });
           return;
       }
       if (!jobDescText || jobDescText.trim().length < 50) {
            toast({ variant: "destructive", title: "Job Description Missing", description: "Job description text is required to generate a tailored CV." });
            return;
       }


      setGeneratedCvMarkdown(null); // Clear previous CV
      setCreationError(null);
      setGeneratedCoverLetter(null); // Clear other results too
      setCoverLetterError(null);
      setCoverLetterEvaluation(null);
      setEvaluationError(null);

      setIsCreatingCv(true);
      setIsProcessingInput(true);

      try {
          console.log('[Home] Submitting for CV creation...');
          const creationInput: CreateCvGenInput = { // Use the renamed type here
              cvText,
              jobDescriptionText: jobDescText,
              analysisResults: analysisResult, // Pass analysisResult, can be null
          };
          const result: CreateCvOutput = await createCv(creationInput);
          console.log('[Home] CV creation result received.');
          setGeneratedCvMarkdown(result.generatedCvMarkdown);
          setCreationError(null);
          toast({
              title: "CV Creation Complete",
              description: "A tailored, ATS-friendly CV has been generated.",
          });
      } catch (error) {
          console.error('[Home] Error creating CV:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during CV creation.';
          setGeneratedCvMarkdown(null);
          setCreationError(`CV creation failed: ${errorMessage}. Please check the input and try again.`);
          toast({
              variant: "destructive",
              title: "CV Creation Error",
              description: `An error occurred: ${errorMessage}. Please try again.`,
              duration: 9000,
          });
      } finally {
          setIsCreatingCv(false);
          setIsProcessingInput(false);
      }
  };

   const handleCreateCoverLetter = async () => {
       if (!analysisResult) {
          toast({ variant: "destructive", title: "Analysis Required", description: "Please analyze the documents first before generating a cover letter." });
          return;
       }
        if (!cvText || !jobDescText) {
            toast({ variant: "destructive", title: "Input Missing", description: "CV and Job Description text are required." });
            return;
        }

       setGeneratedCoverLetter(null); // Clear previous
       setCoverLetterError(null);
       setCoverLetterEvaluation(null);
       setEvaluationError(null);
       setGeneratedCvMarkdown(null); // Clear other results
       setCreationError(null);


       setIsCreatingCoverLetter(true);
       setIsEvaluatingCoverLetter(true);
       setIsProcessingInput(true);

       let generatedText: string | null = null;

       try {
           console.log('[Home] Submitting for Cover Letter creation...');
           const coverLetterInput: CreateCoverLetterInput = {
               cvText,
               jobDescriptionText: jobDescText,
               analysisResults: analysisResult,
           };
           const result: CreateCoverLetterOutput = await createCoverLetter(coverLetterInput);
           console.log('[Home] Cover Letter creation result received.');
           generatedText = result.generatedCoverLetterText;
           setGeneratedCoverLetter(generatedText);
           setCoverLetterError(null);
           toast({
               title: "Cover Letter Generated",
               description: "Now evaluating the generated cover letter...",
           });

           console.log('[Home] Submitting for Cover Letter evaluation...');
            const evaluationInput = {
                generatedCoverLetterText: generatedText,
                jobDescriptionText: jobDescText,
            };
            const evaluationResult = await evaluateCoverLetter(evaluationInput);
            setCoverLetterEvaluation(evaluationResult);
            setEvaluationError(null);
             toast({
               title: "Evaluation Complete",
               description: "Cover letter evaluation finished.",
             });

       } catch (error) {
           console.error('[Home] Error during Cover Letter Process:', error);
           const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

           if (!generatedText) {
               setGeneratedCoverLetter(null);
               setCoverLetterError(`Cover Letter generation failed: ${errorMessage}`);
               setCoverLetterEvaluation(null);
               setEvaluationError(null);
               toast({
                   variant: "destructive",
                   title: "Cover Letter Generation Error",
                   description: `An error occurred: ${errorMessage}. Please try again.`,
                   duration: 9000,
               });
           } else {
               setCoverLetterEvaluation(null);
               setEvaluationError(`Evaluation failed: ${errorMessage}`);
                toast({
                    variant: "destructive",
                    title: "Cover Letter Evaluation Error",
                    description: `An error occurred during evaluation: ${errorMessage}.`,
                    duration: 9000,
                });
           }
       } finally {
           setIsCreatingCoverLetter(false);
           setIsEvaluatingCoverLetter(false);
           setIsProcessingInput(false);
       }
   };

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const shouldShowAnyResult =
    analysisResult || isAnalyzing || analysisError ||
    generatedCvMarkdown || isCreatingCv || creationError ||
    generatedCoverLetter || isCreatingCoverLetter || coverLetterError ||
    coverLetterEvaluation || isEvaluatingCoverLetter || evaluationError;

  return (
    <main className="flex min-h-screen flex-col items-center bg-background text-foreground">

      <section className="w-full bg-gradient-to-b from-blue-50 to-background pt-16 md:pt-24 lg:pt-32 pb-8 md:pb-12 lg:pb-16 text-center">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-4">
            Perfect Match Your CV to Any Job
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Upload your CV and job description to get personalized feedback, an improved CV,
            and a tailored cover letter.
          </p>
          <Button size="lg" onClick={scrollToUpload}>Get Started</Button>
        </div>
      </section>

      <section ref={uploadSectionRef} className="w-full max-w-6xl mx-auto pt-8 md:pt-12 lg:pt-16 pb-12 md:pb-16 lg:pb-20 px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-10 text-foreground">
          Upload Your Documents
        </h2>

        <CvOptimizerForm
          cvText={cvText}
          jobDescText={jobDescText}
          onCvTextChange={setCvText}
          onJobDescTextChange={setJobDescText}
          isProcessingInput={isProcessingInput}
          setIsProcessingInput={setIsProcessingInput}
        />

        <div className="mt-8 max-w-lg mx-auto">
          <Label htmlFor="jobTitle" className="text-md font-semibold">Job Title (Optional)</Label>
          <Input
            id="jobTitle"
            type="text"
            placeholder="Enter the job title you're applying for"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            disabled={isProcessingInput || isAnalyzing}
            className="mt-2 bg-white"
          />
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            onClick={handleAnalyzeDocuments}
            disabled={isProcessingInput || isAnalyzing || (!cvText || cvText.trim().length < 50) || (!jobDescText || jobDescText.trim().length < 50)}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Documents...
              </>
            ) : (
              'Analyze Documents'
            )}
          </Button>
        </div>
      </section>


      {shouldShowAnyResult && (
        <section className="w-full max-w-4xl mx-auto py-12 md:py-16 lg:py-20 px-4 md:px-6 space-y-8">
          {(analysisResult || isAnalyzing || analysisError) && (
            <Card className="shadow-lg">
               <CardHeader>
                <CardTitle className="text-2xl">CV Analysis Report</CardTitle>
                <CardDescription>Detailed breakdown and improvement suggestions.</CardDescription>
              </CardHeader>
              <CardContent>
                <CvAnalysisResults
                  result={analysisResult}
                  isLoading={isAnalyzing}
                  error={analysisError}
                />
                 {(analysisResult || (cvText && jobDescText)) && !analysisError && !isAnalyzing && ( // Allow actions if analysis exists OR if base texts exist
                    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                       <Button
                            onClick={handleCreateTailoredCv}
                            disabled={isProcessingInput || isCreatingCv || (!cvText || cvText.trim().length < 50) || (!jobDescText || jobDescText.trim().length < 50) }
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isCreatingCv ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating CV...</>
                            ) : (
                                <><FileCheck2 className="mr-2 h-4 w-4" /> Create Tailored CV</>
                            )}
                        </Button>
                        <Button
                            onClick={handleCreateCoverLetter}
                            disabled={isProcessingInput || isCreatingCoverLetter || isEvaluatingCoverLetter || !analysisResult} // Cover letter requires analysis
                            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        >
                             {isCreatingCoverLetter ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Letter...</>
                             ) : isEvaluatingCoverLetter ? (
                                 <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating Letter...</>
                             ) : (
                                <><Mail className="mr-2 h-4 w-4" /> Create Cover Letter</>
                             )}
                         </Button>
                    </div>
                 )}
              </CardContent>
            </Card>
          )}

          {(generatedCvMarkdown || isCreatingCv || creationError) && (
             <GeneratedCvDisplay
              cvMarkdown={generatedCvMarkdown}
              isLoading={isCreatingCv}
              error={creationError}
             />
          )}

           {(generatedCoverLetter || isCreatingCoverLetter || coverLetterError) && (
             <GeneratedCoverLetterDisplay
              coverLetterText={generatedCoverLetter}
              isLoading={isCreatingCoverLetter}
              error={coverLetterError}
             />
           )}

           {(coverLetterEvaluation || isEvaluatingCoverLetter || evaluationError) && (
              <CoverLetterEvaluationResults
                result={coverLetterEvaluation}
                isLoading={isEvaluatingCoverLetter}
                error={evaluationError}
              />
            )}
        </section>
      )}

    </main>
  );
}

