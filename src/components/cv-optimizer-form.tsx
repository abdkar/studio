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
import { analyzeCv, type AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Corrected import path
import { createCv, type CreateCvOutput } from '@/ai/flows/create-cv-flow'; // Import create CV flow
import { parsePdfAction } from '@/actions/parse-pdf'; // Import the server action
import { Loader2, Upload, FileText, FileCheck2 } from 'lucide-react'; // Added icons
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  cvText: z.string().min(50, {
    message: 'CV text must be at least 50 characters.',
  }),
  jobDescriptionText: z.string().min(50, {
    message: 'Job description text must be at least 50 characters.',
  }),
});

// Allowed MIME types and extensions
const ACCEPTED_FILE_TYPES = [
  'text/plain', // .txt
  'application/pdf', // .pdf
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const ACCEPTED_EXTENSIONS_STRING = '.txt, .pdf, .doc, .docx';


type CvOptimizerFormProps = {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: AnalyzeCvOutput | null, error: string | null) => void;
  onCreationStart: () => void; // New prop for creation start
  onCreationComplete: (result: string | null, error: string | null) => void; // Prop type remains string (for Markdown)
  isAnalyzing: boolean; // Pass loading state for analysis
  isCreating: boolean; // Pass loading state for creation
};

export function CvOptimizerForm({
  onAnalysisStart,
  onAnalysisComplete,
  onCreationStart,
  onCreationComplete,
  isAnalyzing,
  isCreating,
}: CvOptimizerFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cvText: '',
      jobDescriptionText: '',
    },
  });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false); // State for PDF parsing loading

  const { formState: { isSubmitting: isFormSubmitting, errors }, trigger, getValues } = form; // Use trigger and getValues

   // Combined loading state for disabling inputs
   const isProcessingInput = isAnalyzing || isCreating || isParsingPdf || isFormSubmitting;


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

    // Handle TXT file
    if (file.type === 'text/plain') {
       console.log(`[CvOptimizerForm] Reading TXT file: ${file.name}`);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue('cvText', text, { shouldValidate: true });
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
    // Handle PDF file
    else if (file.type === 'application/pdf') {
      setIsParsingPdf(true);
      form.setValue('cvText', '', { shouldValidate: false }); // Clear existing text
      console.log(`[CvOptimizerForm] Starting PDF parsing for: ${file.name}`);
      const formData = new FormData();
      formData.append('pdfFile', file);

      try {
        console.log('[CvOptimizerForm] Calling parsePdfAction...');
        const result = await parsePdfAction(formData);
        console.log('[CvOptimizerForm] parsePdfAction result:', result);

        if (result.success) {
          if (result.text && result.text.length > 0) {
            form.setValue('cvText', result.text, { shouldValidate: true });
            console.log(`[CvOptimizerForm] PDF parsed successfully. Text length: ${result.text.length}`);
            toast({
              title: "PDF Parsed Successfully",
              description: "CV content extracted from the PDF file.",
            });
          } else {
             // Handle successful parse but no text extracted (e.g., image PDF)
             form.setValue('cvText', '', { shouldValidate: true }); // Keep field empty but validate to show potential errors if field is required
             console.warn(`[CvOptimizerForm] PDF parsed but no text found. File: ${file.name}. Error from action: ${result.error}`);
             toast({
               variant: "default", // Use default variant, not destructive
               title: "PDF Parsed, No Text Found",
               description: result.error || "Could not extract text. The PDF might be image-based or corrupted. Please paste the text manually.",
               duration: 9000,
             });
             // Trigger validation after setting empty value if needed
             trigger('cvText');
          }
        } else {
           // Handle explicit failure from the action
           // Removed console.error log here as the toast below handles user notification
           toast({
             variant: "destructive",
             title: "PDF Parsing Failed",
             description: result.error || "Could not extract text from PDF. Please ensure it's a valid PDF and try pasting manually.",
             duration: 9000,
           });
           form.setValue('cvText', '', { shouldValidate: true });
           trigger('cvText'); // Trigger validation after setting empty value
        }
      } catch (error) {
        console.error('[CvOptimizerForm] Error calling parsePdfAction client-side:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          variant: "destructive",
          title: "PDF Parsing Error",
          description: `An unexpected error occurred: ${errorMessage}. Please paste the text manually.`,
        });
         form.setValue('cvText', '', { shouldValidate: true });
         trigger('cvText'); // Trigger validation on error
      } finally {
        console.log('[CvOptimizerForm] PDF parsing finished.');
        setIsParsingPdf(false);
      }
    }
    // Handle DOC/DOCX file (manual copy-paste)
    else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
       console.log(`[CvOptimizerForm] DOC/DOCX file uploaded: ${file.name}. Prompting user to paste.`);
       toast({
         variant: "default",
         title: "File Uploaded",
         description: `Uploaded ${file.name}. Please copy the text from your Word document and paste it into the CV text area above. Automatic extraction is not supported for DOC/DOCX files.`,
         duration: 9000,
       });
       // Clear the CV text field to prompt manual paste
       form.setValue('cvText', '', { shouldValidate: false });
    }
  };


  // Function to handle Analyze CV button click
  const handleAnalyzeClick = async () => {
      // Manually trigger validation for all fields
      const isValid = await trigger();
      if (!isValid) {
          console.log('[CvOptimizerForm] Validation failed before analysis.');
           toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields correctly before analyzing.",
            });
          return; // Don't proceed if validation fails
      }

      const values = getValues(); // Get current form values after validation
      onAnalysisStart();
      try {
          console.log('[CvOptimizerForm] Submitting for analysis. CV Text length:', values.cvText.length);
          if (values.cvText.length < 200) {
              console.log('[CvOptimizerForm] Submitting CV Text (first 200 chars):', values.cvText.substring(0, 200));
          }
          console.log('[CvOptimizerForm] Submitting Job Description Text length:', values.jobDescriptionText.length);

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
      // Manually trigger validation for all fields
     const isValid = await trigger();
     if (!isValid) {
         console.log('[CvOptimizerForm] Validation failed before creation.');
         toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fill in all required fields correctly before creating the CV.",
         });
         return; // Don't proceed if validation fails
     }

     const values = getValues(); // Get current form values after validation
     onCreationStart();
     try {
         console.log('[CvOptimizerForm] Submitting for CV creation. CV Text length:', values.cvText.length);
         console.log('[CvOptimizerForm] Submitting Job Description Text length:', values.jobDescriptionText.length);

         const result: CreateCvOutput = await createCv(values); // Call the createCv flow, result has generatedCvMarkdown
         console.log('[CvOptimizerForm] CV creation result received. Generated Markdown length:', result.generatedCvMarkdown.length);
         onCreationComplete(result.generatedCvMarkdown, null); // Pass the Markdown content
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

  return (
    // Note: Removed onSubmit from <form> tag as we handle submissions via button clicks
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
                  disabled={isProcessingInput} // Disable textarea during any processing
                />
              </FormControl>
               {isParsingPdf && ( // Show parsing indicator
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing PDF, please wait...
                  </div>
                )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CV File Upload */}
         <FormItem>
           <FormLabel htmlFor="cvFile" className={`text-md font-semibold flex items-center gap-2 ${isProcessingInput ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer hover:text-primary'}`}>
             <Upload className={`h-5 w-5 ${isProcessingInput ? 'text-muted-foreground' : 'text-green-600'}`} />
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
               disabled={isProcessingInput} // Disable file input during processing
             />
           </FormControl>
            <FormDescription>
                Upload TXT or PDF for automatic text extraction. For DOC/DOCX, please upload and then manually copy/paste the text into the field above.
            </FormDescription>
           {/* Display validation errors specifically for the file upload if needed,
               though the main cvText validation usually covers it unless you add specific file validation */}
            {/* <FormMessage /> */}
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
                  disabled={isProcessingInput} // Disable JD during any processing
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

         {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {/* Analyze Button */}
              <Button
                  type="button" // Change type to button to prevent form submission
                  onClick={handleAnalyzeClick}
                  disabled={isProcessingInput} // Disable if any processing is happening
                  className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" // Use accent color
              >
                  {isAnalyzing ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                      </>
                  ) : (
                      <>
                          <FileText className="mr-2 h-4 w-4" /> {/* Analysis Icon */}
                          Analyze CV
                      </>
                  )}
              </Button>

               {/* Create Tailored CV Button */}
               <Button
                  type="button" // Change type to button
                  onClick={handleCreateClick}
                  disabled={isProcessingInput} // Disable if any processing is happening
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" // Use primary color
              >
                  {isCreating ? (
                      <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating CV...
                      </>
                  ) : (
                       <>
                          <FileCheck2 className="mr-2 h-4 w-4" /> {/* Creation Icon */}
                          Create Tailored CV
                       </>
                  )}
              </Button>
          </div>

      </form>
    </Form>
  );
}
