'use server';
/**
 * @fileOverview Generates a new, ATS-friendly CV tailored to a job description.
 *
 * - createCv - Generates the tailored CV.
 * - CreateCvInput - The input type for the createCv function.
 * - CreateCvOutput - The return type for the createCv function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema remains the same as the analyzer
const CreateCvInputSchema = z.object({
  cvText: z.string().describe('The text content of the existing CV.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type CreateCvInput = z.infer<typeof CreateCvInputSchema>;

// Output schema is the generated CV text
const CreateCvOutputSchema = z.object({
  generatedCvText: z.string().describe('The text content of the newly generated, tailored CV.'),
});
export type CreateCvOutput = z.infer<typeof CreateCvOutputSchema>;

// Exported function to call the flow
export async function createCv(input: CreateCvInput): Promise<CreateCvOutput> {
  console.log('[createCv] Flow called with CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length);
  try {
    const result = await createCvFlow(input);
    console.log('[createCv] Flow completed successfully. Generated CV length:', result.generatedCvText.length);
    return result;
  } catch (error) {
    console.error('[createCv] Error executing flow:', error);
    // Re-throw the error or handle it as needed
    // For now, let's return a structured error if possible, or re-throw
    if (error instanceof Error) {
       throw new Error(`Failed to generate CV: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the CV.');
  }
}


const prompt = ai.definePrompt({
  name: 'createCvPrompt',
  input: {
    schema: CreateCvInputSchema,
  },
  output: {
    // Define the expected output structure for the LLM
    schema: CreateCvOutputSchema,
  },
  prompt: `You are an expert CV writer specializing in creating Applicant Tracking System (ATS)-friendly resumes.
Your task is to rewrite the provided CV, tailoring it specifically for the given job description, ensuring it passes ATS scans effectively.

**Instructions:**

1.  **Analyze Both Documents:** Carefully read both the original CV and the target job description.
2.  **Identify Keywords:** Extract key skills, qualifications, responsibilities, and technologies mentioned in the job description.
3.  **Integrate Keywords:** Naturally weave these keywords into the rewritten CV, particularly in the summary/profile, skills, and experience sections. Use the exact phrasing from the job description where appropriate, but avoid keyword stuffing.
4.  **ATS-Friendly Formatting:**
    *   Use standard section headings (e.g., "Summary", "Professional Experience", "Skills", "Education", "Projects").
    *   Use clear, concise language.
    *   Employ bullet points for accomplishments and responsibilities (use standard symbols like '*' or '-').
    *   Avoid tables, columns, graphics, headers/footers, and unusual fonts (stick to plain text).
    *   Ensure consistent formatting for dates and job titles.
5.  **Tailor Content:**
    *   Rewrite the summary/profile to directly address the requirements of the target role.
    *   Emphasize experiences and accomplishments from the original CV that are most relevant to the job description. Quantify achievements whenever possible.
    *   Reorder or prioritize sections/skills based on the job ad's focus.
    *   Do not include information not present in the original CV unless it's a direct synthesis of skills/experience already mentioned (e.g., summarizing technical skills listed under different jobs into a dedicated 'Skills' section). Do not invent new experiences or qualifications.
6.  **Output:** Provide only the full text of the rewritten, ATS-friendly CV. Do not include any introductory phrases, explanations, or apologies.

**Original CV Text:**
\`\`\`
{{cvText}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{jobDescriptionText}}
\`\`\`

**Generated ATS-Friendly CV:**
`,
});


const createCvFlow = ai.defineFlow<
  typeof CreateCvInputSchema,
  typeof CreateCvOutputSchema
>({
  name: 'createCvFlow',
  inputSchema: CreateCvInputSchema,
  outputSchema: CreateCvOutputSchema,
}, async (input) => {
  console.log('[createCvFlow] Calling prompt...');
  const { output } = await prompt(input);

  if (!output || !output.generatedCvText) {
      console.error('[createCvFlow] Prompt returned invalid or missing output.');
      throw new Error('The AI failed to generate a valid CV. The response was empty or incorrectly formatted.');
  }

  console.log('[createCvFlow] Prompt returned successfully.');
  // Basic validation: Check if the generated text seems plausible (e.g., not extremely short)
  if (output.generatedCvText.length < 100) {
      console.warn('[createCvFlow] Generated CV text seems unusually short:', output.generatedCvText.length);
      // Depending on requirements, you might throw an error here or return anyway
      // throw new Error('Generated CV is too short. Please check the input or try again.');
  }


  return output; // Output already matches CreateCvOutputSchema due to prompt definition
});
