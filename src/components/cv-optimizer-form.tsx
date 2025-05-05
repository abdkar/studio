'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { analyzeCv } from '@/ai/flows/cv-analyzer';
import type { AnalyzeCvOutput } from '@/ai/flows/cv-analyzer'; // Import the type
import { Loader2 } from 'lucide-react';

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

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    onAnalysisStart();
    try {
      console.log('Submitting form with values:', values);
      const result = await analyzeCv(values);
      console.log('Analysis result:', result);
      onAnalysisComplete(result, null);
    } catch (error) {
      console.error('Error analyzing CV:', error);
      onAnalysisComplete(null, 'An error occurred during analysis. Please try again.');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="cvText"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">CV Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Paste the full text of your CV here..."
                  className="min-h-[200px] resize-y bg-white" // Use white for contrast on light gray bg
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
