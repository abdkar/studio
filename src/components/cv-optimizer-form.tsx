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
    if (file) {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          form.setValue('cvText', text, { shouldValidate: true });
          toast({
            title: "File Loaded",
            description: "CV content loaded from the .txt file.",
          });
        };
        reader.onerror = () => {
           toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
          });
        }
        reader.readAsText(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a .txt file.",
        });
         // Reset file input if type is invalid
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
                  placeholder="Paste the full text of your CV here, or upload a .txt file below..."
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
             <Upload className="h-5 w-5 text-green-600" /> {/* Changed icon color to green */} Upload CV from .txt file
           </FormLabel>
           <FormControl>
             <Input
               id="cvFile"
               type="file"
               accept=".txt"
               onChange={handleFileChange}
               className="hidden" // Hide default input, label acts as trigger
               ref={fileInputRef}
             />
           </FormControl>
            <FormDescription>
                Alternatively, upload your CV as a plain text (.txt) file. The content will populate the text area above.
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
