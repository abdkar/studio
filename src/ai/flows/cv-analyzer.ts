'use server';

/**
 * @fileOverview Analyzes a CV against a job description and provides suggestions to improve the CV.
 *
 * - analyzeCv - Analyzes the CV and provides suggestions.
 * - AnalyzeCvInput - The input type for the analyzeCv function.
 * - AnalyzeCvOutput - The return type for the analyzeCv function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeCvInputSchema = z.object({
  cvText: z.string().describe('The text content of the CV.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type AnalyzeCvInput = z.infer<typeof AnalyzeCvInputSchema>;

const AnalyzeCvOutputSchema = z.object({
  matchPercentage: z.number().describe('The percentage of how well the CV matches the job description.'),
  suggestions: z.object({
    keywordsToAdd: z.array(z.string()).describe('Keywords to add to the CV.'),
    skillsToEmphasize: z.array(z.string()).describe('Skills to emphasize in the CV.'),
    experienceToDetail: z.string().describe('Experience to detail in the CV.'),
  }).describe('Suggestions on how to improve the CV.'),
});
export type AnalyzeCvOutput = z.infer<typeof AnalyzeCvOutputSchema>;

export async function analyzeCv(input: AnalyzeCvInput): Promise<AnalyzeCvOutput> {
  return analyzeCvFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cvAnalyzerPrompt',
  input: {
    schema: z.object({
      cvText: z.string().describe('The text content of the CV.'),
      jobDescriptionText: z.string().describe('The text content of the job description.'),
    }),
  },
  output: {
    schema: z.object({
      matchPercentage: z.number().describe('The percentage of how well the CV matches the job description.'),
      suggestions: z.object({
        keywordsToAdd: z.array(z.string()).describe('Keywords to add to the CV.'),
        skillsToEmphasize: z.array(z.string()).describe('Skills to emphasize in the CV.'),
        experienceToDetail: z.string().describe('Experience to detail in the CV.'),
      }).describe('Suggestions on how to improve the CV.'),
    }),
  },
  prompt: `You are a career advisor. Analyze the CV against the job description, and provide suggestions on how to improve it, including keywords to add, skills to emphasize, and experience to detail. Also, determine how much the CV matches the job description in percentage.

CV Text:
{{cvText}}

Job Description Text:
{{jobDescriptionText}}`,
});

const analyzeCvFlow = ai.defineFlow<
  typeof AnalyzeCvInputSchema,
  typeof AnalyzeCvOutputSchema
>({
  name: 'analyzeCvFlow',
  inputSchema: AnalyzeCvInputSchema,
  outputSchema: AnalyzeCvOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
