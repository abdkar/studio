
'use server';
/**
 * @fileOverview Evaluates a generated cover letter against a job description for relevance, tone, keyword usage, clarity, and ATS-friendliness.
 *
 * - evaluateCoverLetter - Analyzes the cover letter and provides feedback.
 * - EvaluateCoverLetterInput - The input type for the evaluateCoverLetter function.
 * - EvaluateCoverLetterOutput - The return type for the evaluateCoverLetter function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Define the input schema for the cover letter evaluation flow
const EvaluateCoverLetterInputSchema = z.object({
  generatedCoverLetterText: z.string().describe('The full text content of the generated cover letter.'),
  jobDescriptionText: z.string().describe('The full text content of the target job description.'),
});
export type EvaluateCoverLetterInput = z.infer<typeof EvaluateCoverLetterInputSchema>;

// Define the output schema for the cover letter evaluation flow
const EvaluateCoverLetterOutputSchema = z.object({
  relevanceScore: z.number().min(0).max(100).describe('Score (0-100) indicating how well the cover letter addresses the job description requirements.'),
  toneAnalysis: z.string().describe('Feedback on the tone of the cover letter (e.g., professional, enthusiastic, passive).'),
  keywordUsage: z.string().describe('Analysis of how effectively keywords from the job description were incorporated.'),
  clarityAndConciseness: z.string().describe('Feedback on the clarity, conciseness, and readability of the letter.'),
  atsFriendliness: z.string().describe('Assessment of the cover letter\'s compatibility with Applicant Tracking Systems (plain text, standard format).'),
  overallFeedback: z.string().describe('A summary of the evaluation and actionable suggestions for improvement.'),
});
export type EvaluateCoverLetterOutput = z.infer<typeof EvaluateCoverLetterOutputSchema>;

// Exported wrapper function to call the Genkit flow
export async function evaluateCoverLetter(input: EvaluateCoverLetterInput): Promise<EvaluateCoverLetterOutput> {
  console.log('[evaluateCoverLetter] Flow called with Cover Letter length:', input.generatedCoverLetterText.length, 'Job Desc length:', input.jobDescriptionText.length);

  // Basic input validation
  if (!input.generatedCoverLetterText || input.generatedCoverLetterText.trim().length < 50) {
    console.error('[evaluateCoverLetter] Invalid cover letter text provided.');
    throw new Error('Valid cover letter text must be provided.');
  }
  if (!input.jobDescriptionText || input.jobDescriptionText.trim().length < 50) {
    console.error('[evaluateCoverLetter] Invalid job description provided.');
    throw new Error('A valid job description must be provided.');
  }

  try {
    const result = await evaluateCoverLetterFlow(input);
    console.log('[evaluateCoverLetter] Flow completed successfully. Relevance Score:', result.relevanceScore);
    return result;
  } catch (error) {
    console.error('[evaluateCoverLetter] Error executing flow:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to evaluate cover letter: ${error.message}`);
    }
    throw new Error('An unknown error occurred while evaluating the cover letter.');
  }
}

// Define the Genkit prompt for cover letter evaluation
const prompt = ai.definePrompt({
  name: 'evaluateCoverLetterPrompt',
  input: {
    schema: EvaluateCoverLetterInputSchema,
  },
  output: {
    schema: EvaluateCoverLetterOutputSchema,
  },
  prompt: `You are an expert career advisor and editor, specializing in evaluating cover letters for effectiveness against job descriptions.

Your task is to analyze the provided **Generated Cover Letter Text** in the context of the **Target Job Description Text**. Provide a structured evaluation based on the following criteria:

1.  **Relevance Score (0-100):** Assess how directly and effectively the cover letter addresses the specific requirements, responsibilities, and qualifications mentioned in the job description. A high score means strong alignment. Set this in \`relevanceScore\`.
2.  **Tone Analysis:** Evaluate the tone. Is it professional, enthusiastic, confident, passive, generic, etc.? Is the tone appropriate for the role and company (if discernible from the job description)? Provide brief feedback in \`toneAnalysis\`.
3.  **Keyword Usage:** Analyze how well the cover letter incorporates relevant keywords and terminology found in the job description. Are they used naturally? Are key terms missing? Provide feedback in \`keywordUsage\`.
4.  **Clarity and Conciseness:** Assess the readability. Is the language clear, concise, and easy to understand? Are there any run-on sentences or jargon? Provide feedback in \`clarityAndConciseness\`.
5.  **ATS Friendliness:** Based *only* on the provided text, evaluate its likely compatibility with Applicant Tracking Systems. Consider factors like standard formatting (implied by plain text), absence of special characters/graphics (implied), and natural keyword integration. Provide assessment in \`atsFriendliness\`. Assume it's plain text as generated by a previous step.
6.  **Overall Feedback:** Summarize the strengths and weaknesses of the cover letter. Offer 1-2 specific, actionable suggestions for improvement based on your analysis. Provide this summary in \`overallFeedback\`.

**Input Documents:**

**Generated Cover Letter Text:**
\`\`\`
{{{generatedCoverLetterText}}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

**Output Format:**
Respond strictly in the JSON format defined by the output schema. Ensure all fields are populated with your evaluation.
`,
});

// Define the Genkit flow
const evaluateCoverLetterFlow = ai.defineFlow<
  typeof EvaluateCoverLetterInputSchema,
  typeof EvaluateCoverLetterOutputSchema
>(
  {
    name: 'evaluateCoverLetterFlow',
    inputSchema: EvaluateCoverLetterInputSchema,
    outputSchema: EvaluateCoverLetterOutputSchema,
  },
  async (input) => {
    console.log('[evaluateCoverLetterFlow] Calling prompt for cover letter evaluation...');
    const { output } = await prompt(input);

    if (!output) {
      console.error('[evaluateCoverLetterFlow] Prompt returned no output.');
      throw new Error('The AI failed to generate an evaluation. The response was empty.');
    }

     // Basic validation for the presence of required fields
     if (typeof output.relevanceScore !== 'number' || !output.toneAnalysis || !output.keywordUsage || !output.clarityAndConciseness || !output.atsFriendliness || !output.overallFeedback) {
        console.error('[evaluateCoverLetterFlow] Prompt returned incomplete or invalid evaluation structure:', output);
        throw new Error('The AI response is missing required evaluation fields.');
     }

     // Ensure score is within 0-100 range (clamp if necessary)
     output.relevanceScore = Math.max(0, Math.min(100, output.relevanceScore));


    console.log('[evaluateCoverLetterFlow] Cover letter evaluation prompt returned successfully.');
    return output;
  }
);
