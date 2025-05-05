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
import { analyzeCv } from '@/ai/flows/cv-analyzer';
import { parsePdfAction } from '@/actions/parse-pdf'; // Import the server action
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer';
import { Loader2, Upload } from 'lucide-react';
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
};

export function CvOptimizerForm({ onAnalysisStart, onAnalysisComplete }: CvOptimizerFormProps) {
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

  const { isSubmitting } = form.formState;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset file input
    }

    if (!file) return;

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: `Please upload a supported file type: ${ACCEPTED_EXTENSIONS_STRING}.`,
      });
      return;
    }

    // Handle TXT file
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        form.setValue('cvText', text, { shouldValidate: true });
        toast({
          title: "TXT File Loaded",
          description: "CV content loaded successfully from the .txt file.",
        });
      };
      reader.onerror = () => {
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
      const formData = new FormData();
      formData.append('pdfFile', file);

      try {
        console.log('Calling parsePdfAction...');
        const result = await parsePdfAction(formData);
        console.log('parsePdfAction result:', result);

        if (result.success && result.text) {
          form.setValue('cvText', result.text, { shouldValidate: true });
          toast({
            title: "PDF Parsed Successfully",
            description: "CV content extracted from the PDF file.",
          });
        } else if (result.success && !result.text) {
          // Handle successful parse but no text extracted (e.g., image PDF)
          form.setValue('cvText', '', { shouldValidate: true }); // Keep field empty
          toast({
            variant: "default", // Use default variant, not destructive
            title: "PDF Parsed, No Text Found",
            description: result.error || "Could not extract text. The PDF might be image-based. Please paste the text manually.",
            duration: 9000,
          });
        }
         else {
           // Handle explicit failure
           toast({
             variant: "destructive",
             title: "PDF Parsing Failed",
             description: result.error || "Could not extract text from PDF. Please paste it manually.",
           });
           // Optionally clear the field again or leave it empty
           form.setValue('cvText', '', { shouldValidate: true });
        }
      } catch (error) {
        console.error('Error calling parsePdfAction:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        toast({
          variant: "destructive",
          title: "PDF Parsing Error",
          description: `An unexpected error occurred: ${errorMessage}. Please paste the text manually.`,
        });
         form.setValue('cvText', '', { shouldValidate: true });
      } finally {
        setIsParsingPdf(false);
      }
    }
    // Handle DOC/DOCX file (manual copy-paste)
    else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalysisStart();
    try {
      console.log('Submitting for analysis:', values);
      const result = await analyzeCv(values);
      console.log('Analysis result:', result);
      onAnalysisComplete(result, null);
       toast({
        title: "Analysis Complete",
        description: "Your CV has been analyzed successfully.",
      });
    } catch (error) {
      console.error('Error analyzing CV:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
      onAnalysisComplete(null, `Analysis failed: ${errorMessage}. Please check the input and try again.`);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: `An error occurred: ${errorMessage}. Please try again.`,
      });
    }
  }

  const isProcessing = isSubmitting || isParsingPdf; // Combined loading state

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  disabled={isParsingPdf} // Disable textarea during PDF parsing
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
           <FormLabel htmlFor="cvFile" className={`text-md font-semibold flex items-center gap-2 ${isProcessing ? 'cursor-not-allowed text-muted-foreground' : 'cursor-pointer hover:text-primary'}`}>
             <Upload className={`h-5 w-5 ${isProcessing ? 'text-muted-foreground' : 'text-green-600'}`} />
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
               disabled={isProcessing} // Disable file input during processing
             />
           </FormControl>
            <FormDescription>
                Upload TXT or PDF for automatic text extraction. For DOC/DOCX, please upload and then manually copy/paste the text into the field above.
            </FormDescription>
           <FormMessage />
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
                  disabled={isParsingPdf} // Also disable JD if parsing CV
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isProcessing} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : isParsingPdf ? (
             <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing PDF...
            </>
          ) : (
            'Optimize CV'
          )}
        </Button>
      </form>
    </Form>
  );
}
