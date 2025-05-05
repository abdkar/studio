
'use server';

/**
 * @fileOverview Analyzes a CV against a job description and provides suggestions to improve the CV, including a breakdown of match scores.
 *
 * - analyzeCv - Analyzes the CV and provides suggestions and scores.
 * - AnalyzeCvInput - The input type for the analyzeCv function.
 * - AnalyzeCvOutput - The return type for the analyzeCv function, including score breakdown.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { AnalyzeCvOutputSchema } from './cv-analyzer-schema'; // Import schema from separate file

const AnalyzeCvInputSchema = z.object({
  cvText: z.string().describe('The text content of the CV.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type AnalyzeCvInput = z.infer<typeof AnalyzeCvInputSchema>;

// Define the output type by inferring from the imported schema
export type AnalyzeCvOutput = z.infer<typeof AnalyzeCvOutputSchema>;


export async function analyzeCv(input: AnalyzeCvInput): Promise<AnalyzeCvOutput> {
  console.log('[analyzeCv] Flow called with CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length);
   if (!input.cvText || input.cvText.trim().length < 50) {
     console.error('[analyzeCv] Invalid CV text provided.');
     throw new Error('Valid CV text must be provided.');
  }
   if (!input.jobDescriptionText || input.jobDescriptionText.trim().length < 50) {
     console.error('[analyzeCv] Invalid job description provided.');
     throw new Error('A valid job description must be provided.');
  }

  try {
      const result = await analyzeCvFlow(input);
      console.log('[analyzeCv] Flow completed successfully. Overall Match:', result.matchPercentage);
      // Validate breakdown scores are within range (optional but good practice)
       if (result.scoreBreakdown) {
           const { experience, education, skills } = result.scoreBreakdown;
           if (experience < 0 || experience > 100 || education < 0 || education > 100 || skills < 0 || skills > 100) {
               console.warn('[analyzeCv] Warning: Breakdown scores are outside the 0-100 range.', result.scoreBreakdown);
               // Optionally clamp values or handle as needed
           }
       } else {
            console.warn('[analyzeCv] Warning: Score breakdown is missing from the result.');
       }

      return result;
  } catch (error) {
     // Log the detailed error on the server
     console.error('[analyzeCv] Error executing flow:', error instanceof Error ? error.stack : error);
     // Throw a more generic error to the client, but keep server logs detailed
     if (error instanceof Error) {
        throw new Error(`Failed to analyze CV: ${error.message}`);
     }
     throw new Error('An unknown error occurred while analyzing the CV.');
  }
}

// Updated prompt to request score breakdown
const prompt = ai.definePrompt({
  name: 'cvAnalyzerPrompt',
  input: {
    schema: AnalyzeCvInputSchema, // Keep input schema the same
  },
  output: {
    schema: AnalyzeCvOutputSchema, // Use updated output schema from import
  },
  prompt: `You are an expert career advisor specializing in CV analysis against job descriptions. Your task is to analyze the provided CV Text against the Job Description Text.

**Analysis Requirements:**

1.  **Overall Match Percentage:** Determine how well the CV matches the job description overall, expressed as a percentage (0-100). Set this in the \`matchPercentage\` field.
2.  **Score Breakdown (0-100 for each):** Calculate specific match percentages for the following categories based on their relevance and detail in the CV compared to the job description requirements:
    *   **Experience:** How well does the candidate's work history, roles, responsibilities, and achievements align with the experience required? Set this in \`scoreBreakdown.experience\`.
    *   **Education:** How well do the candidate's educational qualifications match the requirements? Set this in \`scoreBreakdown.education\`.
    *   **Skills & Expertise:** How well do the candidate's technical skills, soft skills, tools, and domain expertise match those listed or implied in the job description? Set this in \`scoreBreakdown.skills\`.
3.  **Improvement Suggestions:** Provide actionable suggestions on how to improve the CV for this specific job:
    *   \`suggestions.keywordsToAdd\`: List specific keywords from the job description that are missing or underrepresented in the CV.
    *   \`suggestions.skillsToEmphasize\`: Identify specific skills present in the CV that should be highlighted or described in more detail to better match the job requirements.
    *   \`suggestions.experienceToDetail\`: Describe specific areas of the candidate's experience that should be elaborated upon with more quantifiable results or context relevant to the job description.

**Input Documents:**

**CV Text:**
\`\`\`
{{{cvText}}}
\`\`\`

**Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

**Output Format:**
Respond strictly in the JSON format defined by the output schema. Ensure all fields, including the score breakdown, are populated correctly.
`,
});


const analyzeCvFlow = ai.defineFlow<
  typeof AnalyzeCvInputSchema,
  typeof AnalyzeCvOutputSchema // Use the inferred type here
>({
  name: 'analyzeCvFlow',
  inputSchema: AnalyzeCvInputSchema,
  outputSchema: AnalyzeCvOutputSchema, // Use updated output schema from import
}, async input => {
  console.log('[analyzeCvFlow] Calling prompt for CV analysis with score breakdown...');
  const { output } = await prompt(input);

  if (!output) {
     console.error('[analyzeCvFlow] Prompt returned no output.');
     throw new Error('The AI failed to generate an analysis. The response was empty.');
  }

  // Basic validation for the presence of required fields
  if (typeof output.matchPercentage !== 'number' || !output.scoreBreakdown || !output.suggestions) {
      console.error('[analyzeCvFlow] Prompt returned incomplete or invalid output structure:', output);
       throw new Error('The AI response is missing required analysis fields (overall score, breakdown, or suggestions).');
  }
   if (typeof output.scoreBreakdown.experience !== 'number' || typeof output.scoreBreakdown.education !== 'number' || typeof output.scoreBreakdown.skills !== 'number') {
        console.error('[analyzeCvFlow] Prompt returned incomplete score breakdown:', output.scoreBreakdown);
       throw new Error('The AI response is missing required score breakdown fields (experience, education, or skills).');
   }

    // Ensure scores are within 0-100 range (clamp if necessary)
    output.matchPercentage = Math.max(0, Math.min(100, output.matchPercentage));
    output.scoreBreakdown.experience = Math.max(0, Math.min(100, output.scoreBreakdown.experience));
    output.scoreBreakdown.education = Math.max(0, Math.min(100, output.scoreBreakdown.education));
    output.scoreBreakdown.skills = Math.max(0, Math.min(100, output.scoreBreakdown.skills));


  console.log('[analyzeCvFlow] CV analysis prompt returned successfully with score breakdown.');
  return output; // Return the full output including the breakdown
});
