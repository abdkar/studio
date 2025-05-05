'use client';

import React, { useRef } from 'react';
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
import { Input } from '@/components/ui/input'; // Import Input component
import { analyzeCv } from '@/ai/flows/cv-analyzer';
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Import the type
import { Loader2, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"; // Import useToast

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
  const { toast } = useToast(); // Initialize useToast
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const { isSubmitting } = form.formState;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset file input value immediately to allow re-uploading the same file
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }

    if (file) {
      if (ACCEPTED_FILE_TYPES.includes(file.type)) {
        if (file.type === 'text/plain') {
            // Handle .txt file
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
        } else {
            // Handle PDF, DOC, DOCX - inform user about manual copy-paste
            toast({
                variant: "default", // Use default variant, maybe change to warning if available/desired
                title: "File Uploaded",
                description: `Uploaded ${file.name}. Please copy the text from your ${file.type.split('/')[1].toUpperCase()} file and paste it into the CV text area above for analysis.`,
                duration: 9000, // Keep message longer
            });
            // Clear the CV text field if a non-txt file is uploaded, prompting manual paste
            form.setValue('cvText', '', { shouldValidate: false });
        }

      } else {
        // Handle invalid file type
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: `Please upload a supported file type: ${ACCEPTED_EXTENSIONS_STRING}.`,
        });
      }
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalysisStart();
    try {
      console.log('Submitting form with values:', values);
      const result = await analyzeCv(values);
      console.log('Analysis result:', result);
      onAnalysisComplete(result, null);
       toast({ // Add toast notification for success
        title: "Analysis Complete",
        description: "Your CV has been analyzed successfully.",
      });
    } catch (error) {
      console.error('Error analyzing CV:', error);
       const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during analysis.';
      onAnalysisComplete(null, `Analysis failed: ${errorMessage}. Please check the input and try again.`);
      toast({ // Add toast notification for submission error
        variant: "destructive",
        title: "Analysis Error",
        description: `An error occurred: ${errorMessage}. Please try again.`,
      });
    }
  }

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
                  placeholder="Paste the full text of your CV here, or upload a file below..."
                  className="min-h-[200px] resize-y bg-white" // Use white for contrast on light gray bg
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CV File Upload */}
         <FormItem>
           <FormLabel htmlFor="cvFile" className="text-md font-semibold flex items-center gap-2 cursor-pointer hover:text-primary">
             <Upload className="h-5 w-5 text-green-600" /> {/* Changed icon color to green */} Upload CV File ({ACCEPTED_EXTENSIONS_STRING})
           </FormLabel>
           <FormControl>
             <Input
               id="cvFile"
               type="file"
               accept={ACCEPTED_FILE_TYPES.join(',')} // Update accept attribute
               onChange={handleFileChange}
               className="hidden" // Hide default input, label acts as trigger
               ref={fileInputRef}
             />
           </FormControl>
            <FormDescription>
                You can upload your CV as a TXT, PDF, DOC, or DOCX file. For PDF/DOC/DOCX, please copy and paste the text into the field above after uploading.
            </FormDescription>
           <FormMessage /> {/* Add FormMessage for potential file-related errors if needed */}
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
                  className="min-h-[200px] resize-y bg-white" // Use white for contrast
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Optimize CV'
          )}
        </Button>
      </form>
    </Form>
  );
}
