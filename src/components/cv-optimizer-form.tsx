
'use client';

import React, { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { analyzeCv, type AnalyzeCvOutput } from '@/ai/flows/cv-analyzer';
import { createCv, type CreateCvOutput } from '@/ai/flows/create-cv-flow';
import { createCoverLetter, type CreateCoverLetterOutput, type CreateCoverLetterInput } from '@/ai/flows/create-cover-letter-flow';
import { parsePdfAction } from '@/actions/parse-pdf';
import { Loader2, Upload, FileText, FileCheck2, Mail } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  cvText: z.string().min(50, {
    message: 'CV text must be at least 50 characters.',
  }),
  jobDescriptionText: z.string().min(50, {
    message: 'Job description text must be at least 50 characters.',
  }),
});

const ACCEPTED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ACCEPTED_EXTENSIONS_STRING = '.txt, .pdf, .doc, .docx';


type CvOptimizerFormProps = {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalyzeCvOutput | null, error: string | null) => void;
  onCreationStart: () => void;
  onCreationComplete: (result: string | null, error: string | null) => void;
  onCoverLetterStart: () => void;
  onCoverLetterComplete: (result: string | null, error: string | null) => void; // Will call this after generation completes
  isAnalyzing: boolean;
  isCreating: boolean;
  isCreatingCoverLetter: boolean;
  analysisResult: AnalyzeCvOutput | null;
  // Pass state and setters for parent component to access text values
  cvText: string;
  jobDescText: string;
  onCvTextChange: (value: string) => void;
  onJobDescTextChange: (value: string) => void;
};

export function CvOptimizerForm({
  onAnalysisStart,
  onAnalysisComplete,
  onCreationStart,
  onCreationComplete,
  onCoverLetterStart,
  onCoverLetterComplete, // This prop will now trigger generation AND evaluation
  isAnalyzing,
  isCreating,
  isCreatingCoverLetter,
  analysisResult,
  // Receive state and setters
  cvText,
  jobDescText,
  onCvTextChange,
  onJobDescTextChange,
}: CvOptimizerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // Use values from props for initial state and ensure sync
    values: {
        cvText: cvText,
        jobDescriptionText: jobDescText
    },
  });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);

  const { formState: { isSubmitting: isFormSubmitting, errors }, trigger, getValues, setValue } = form;

   // Use form's watch or props directly? For simplicity, use props for read, call prop setters on change
   // const watchedCvText = form.watch('cvText');
   // const watchedJobDescText = form.watch('jobDescriptionText');

   // Sync form state with parent state when props change (e.g., from PDF parsing)
   React.useEffect(() => {
       setValue('cvText', cvText, { shouldValidate: true, shouldDirty: true });
   }, [cvText, setValue]);

    React.useEffect(() => {
         setValue('jobDescriptionText', jobDescText, { shouldValidate: true, shouldDirty: true });
     }, [jobDescText, setValue]);


   // Combined loading state for disabling inputs and buttons
   const isProcessingInput = isAnalyzing || isCreating || isCreatingCoverLetter || isParsingPdf || isFormSubmitting;


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
    }

    if (!file) return;

    console.log(`[CvOptimizerForm] File selected: ${file.name}, Type: ${file.type}`);

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      console.warn(`[CvOptimizerForm] Invalid file type: ${file.type}`);
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: `Please upload a supported file type: ${ACCEPTED_EXTENSIONS_STRING}.`,
      });
      return;
    }

    // Clear manual CV text area when uploading
    onCvTextChange(''); // Call parent setter
    setValue('cvText', '', { shouldValidate: false }); // Update local form state too

    if (file.type === 'text/plain') {
       console.log(`[CvOptimizerForm] Reading TXT file: ${file.name}`);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onCvTextChange(text); // Update parent state
        setValue('cvText', text, { shouldValidate: true }); // Update local form state
        console.log(`[CvOptimizerForm] TXT file read successfully. Length: ${text?.length ?? 0}`);
        toast({
          title: "TXT File Loaded",
          description: "CV content loaded successfully from the .txt file.",
        });
      };
      reader.onerror = (e) => {
         console.error('[CvOptimizerForm] Error reading TXT file:', e);
         toast({
          variant: "destructive",
          title: "File Read Error",
          description: "Could not read the selected .txt file.",
        });
      }
      reader.readAsText(file);
    }
    else if (file.type === 'application/pdf') {
      setIsParsingPdf(true);
      console.log(`[CvOptimizerForm] Starting PDF parsing for: ${file.name}`);
      const formData = new FormData();
      formData.append('pdfFile', file);

      try {
        console.log('[CvOptimizerForm] Calling parsePdfAction...');
        const result = await parsePdfAction(formData);
        console.log('[CvOptimizerForm] parsePdfAction result:', result);

        if (result.success) {
          if (result.text && result.text.length > 0) {
             onCvTextChange(result.text); // Update parent state
             setValue('cvText', result.text, { shouldValidate: true }); // Update local form state
            console.log(`[CvOptimizerForm] PDF parsed successfully. Text length: ${result.text.length}`);
            toast({
              title: "PDF Parsed Successfully",
              description: "CV content extracted from the PDF file.",
            });
          } else {
             onCvTextChange(''); // Ensure parent state is cleared
             setValue('cvText', '', { shouldValidate: true }); // Update local form state
             console.warn(`[CvOptimizerForm] PDF parsed but no text found. File: ${file.name}. Error from action: ${result.error}`);
             toast({
               variant: "default",
               title: "PDF Parsed, No Text Found",
               description: result.error || "Could not extract text. The PDF might be image-based or corrupted. Please paste the text manually.",
               duration: 9000,
             });
             trigger('cvText');
          }
        } else {
           // Log error and show toast
           console.error(`[CvOptimizerForm] PDF parsing failed on server. Error: ${result.error}`);
           toast({
             variant: "destructive",
             title: "PDF Parsing Failed",
             description: result.error || "Could not extract text from PDF. Please ensure it's a valid PDF and try pasting manually.",
             duration: 9000,
           });
           onCvTextChange(''); // Ensure parent state is cleared
           setValue('cvText', '', { shouldValidate: true }); // Update local form state
           trigger('cvText');
        }
      } catch (error) {
        console.error('[CvOptimizerForm] Error calling parsePdfAction client-side:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          variant: "destructive",
          title: "PDF Parsing Error",
          description: `An unexpected error occurred: ${errorMessage}. Please paste the text manually.`,
        });
         onCvTextChange(''); // Ensure parent state is cleared
         setValue('cvText', '', { shouldValidate: true }); // Update local form state
         trigger('cvText');
      } finally {
        console.log('[CvOptimizerForm] PDF parsing finished.');
        setIsParsingPdf(false);
      }
    }
    else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
       console.log(`[CvOptimizerForm] DOC/DOCX file uploaded: ${file.name}. Prompting user to paste.`);
       toast({
         variant: "default",
         title: "File Uploaded",
         description: `Uploaded ${file.name}. Please copy the text from your Word document and paste it into the CV text area above. Automatic extraction is not supported for DOC/DOCX files.`,
         duration: 9000,
       });
       onCvTextChange(''); // Clear CV text
       setValue('cvText', '', { shouldValidate: false });
    }
  };


  // Function to handle Analyze CV button click
  const handleAnalyzeClick = async () => {
      const isValid = await trigger();
      if (!isValid) {
          console.log('[CvOptimizerForm] Validation failed before analysis.');
           toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields correctly before analyzing.",
            });
          return;
      }

      const values = { cvText, jobDescriptionText }; // Use state props
      onAnalysisStart();
      try {
          console.log('[CvOptimizerForm] Submitting for analysis...');
          const result = await analyzeCv(values);
          console.log('[CvOptimizerForm] Analysis result received:', result);
          onAnalysisComplete(result, null);
          toast({
              title: "Analysis Complete",
              description: "Your CV has been analyzed successfully.",
          });
      } catch (error) {
          console.error('[CvOptimizerForm] Error analyzing CV:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
          onAnalysisComplete(null, `Analysis failed: ${errorMessage}. Please check the input and try again.`);
          toast({
              variant: "destructive",
              title: "Analysis Error",
              description: `An error occurred: ${errorMessage}. Please try again.`,
              duration: 9000,
          });
      }
  };

 // Function to handle Create Tailored CV button click
 const handleCreateClick = async () => {
     const isValid = await trigger();
     if (!isValid) {
         console.log('[CvOptimizerForm] Validation failed before creation.');
         toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields correctly before creating the CV.",
         });
         return;
     }

     const values = { cvText, jobDescriptionText }; // Use state props
     onCreationStart();
     try {
         console.log('[CvOptimizerForm] Submitting for CV creation...');
         const result: CreateCvOutput = await createCv(values);
         console.log('[CvOptimizerForm] CV creation result received.');
         onCreationComplete(result.generatedCvMarkdown, null);
         toast({
             title: "CV Creation Complete",
             description: "A tailored, ATS-friendly CV has been generated.",
         });
     } catch (error) {
         console.error('[CvOptimizerForm] Error creating CV:', error);
         const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during CV creation.';
         onCreationComplete(null, `CV creation failed: ${errorMessage}. Please check the input and try again.`);
         toast({
             variant: "destructive",
             title: "CV Creation Error",
             description: `An error occurred: ${errorMessage}. Please try again.`,
             duration: 9000,
         });
     }
 };

 // Function to handle Create Cover Letter button click
 const handleCreateCoverLetterClick = async () => {
    const isValid = await trigger();
    if (!isValid) {
        console.log('[CvOptimizerForm] Validation failed before cover letter creation.');
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Please fill in all required fields correctly before creating the cover letter.",
        });
        return;
    }

    const values = { cvText, jobDescriptionText }; // Use state props
    onCoverLetterStart(); // Signal start of the process (generation + evaluation)
    try {
        console.log('[CvOptimizerForm] Submitting for Cover Letter creation...');
        const coverLetterInput: CreateCoverLetterInput = {
            ...values,
            analysisResults: analysisResult // Pass the analysis result stored in parent state
        };
        const result: CreateCoverLetterOutput = await createCoverLetter(coverLetterInput);
        console.log('[CvOptimizerForm] Cover Letter creation result received.');
        // Pass result up - parent component will handle evaluation trigger
        onCoverLetterComplete(result.generatedCoverLetterText, null);
        toast({
            title: "Cover Letter Creation Complete",
            description: "A tailored cover letter has been generated and is now being evaluated.",
        });
    } catch (error) {
        console.error('[CvOptimizerForm] Error creating cover letter:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during cover letter creation.';
        onCoverLetterComplete(null, `Cover Letter creation failed: ${errorMessage}. Please check the input and try again.`);
        toast({
            variant: "destructive",
            title: "Cover Letter Creation Error",
            description: `An error occurred: ${errorMessage}. Please try again.`,
            duration: 9000,
        });
    }
};


  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* CV Text Area */}
        <FormField
          control={form.control}
          name="cvText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">CV Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste the full text of your CV here, or upload a TXT/PDF file below. PDF text will be extracted automatically."
                  className="min-h-[200px] resize-y bg-white"
                  {...field}
                  // Use value from props and update parent via onCvTextChange
                  value={cvText}
                  onChange={(e) => onCvTextChange(e.target.value)}
                  disabled={isProcessingInput}
                />
              </FormControl>
               {isParsingPdf && (
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing PDF, please wait...
                  </div>
                )}
              <FormMessage /> {/* Will use local form errors */}
            </FormItem>
          )}
        />

        {/* CV File Upload */}
         <FormItem>
           <FormLabel htmlFor="cvFile" className={`text-md font-semibold flex items-center gap-2 ${isProcessingInput ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer hover:text-primary'}`}>
             <Upload className={`h-5 w-5 ${isProcessingInput ? 'text-muted-foreground' : 'text-accent'}`} /> {/* Use accent color for upload icon */}
             Upload CV File ({ACCEPTED_EXTENSIONS_STRING})
           </FormLabel>
           <FormControl>
             <Input
               id="cvFile"
               type="file"
               accept={ACCEPTED_FILE_TYPES.join(',')}
               onChange={handleFileChange}
               className="hidden"
               ref={fileInputRef}
               disabled={isProcessingInput}
             />
           </FormControl>
            <FormDescription>
                Upload TXT or PDF for automatic text extraction. For DOC/DOCX, please upload and then manually copy/paste the text into the field above.
            </FormDescription>
         </FormItem>


        {/* Job Description Text Area */}
        <FormField
          control={form.control}
          name="jobDescriptionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Job Description Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste the full text of the job description here..."
                  className="min-h-[200px] resize-y bg-white"
                  {...field}
                  // Use value from props and update parent via onJobDescTextChange
                  value={jobDescText}
                  onChange={(e) => onJobDescTextChange(e.target.value)}
                  disabled={isProcessingInput}
                />
              </FormControl>
              <FormMessage /> {/* Will use local form errors */}
            </FormItem>
          )}
        />

         {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* Analyze Button */}
              <Button
                  type="button"
                  onClick={handleAnalyzeClick}
                  disabled={isProcessingInput}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                  {isAnalyzing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                  ) : (
                      <><FileText className="mr-2 h-4 w-4" /> Analyze CV</>
                  )}
              </Button>

               {/* Create Tailored CV Button */}
               <Button
                  type="button"
                  onClick={handleCreateClick}
                  disabled={isProcessingInput}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                  {isCreating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating CV...</>
                  ) : (
                       <><FileCheck2 className="mr-2 h-4 w-4" /> Create Tailored CV</>
                  )}
              </Button>

              {/* Create Cover Letter Button */}
               <Button
                  type="button"
                  onClick={handleCreateCoverLetterClick}
                  disabled={isProcessingInput}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                  {isCreatingCoverLetter ? ( // Only show generating spinner here
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Letter...</>
                  ) : (
                       <><Mail className="mr-2 h-4 w-4" /> Create Cover Letter</>
                  )}
              </Button>
          </div>

      </form>
    </Form>
  );
}

```