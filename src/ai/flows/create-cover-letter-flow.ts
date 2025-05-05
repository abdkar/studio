'use server';
/**
 * @fileOverview Generates a tailored, ATS-friendly cover letter based on a CV and job description.
 *
 * - createCoverLetter - Generates the cover letter text.
 * - CreateCoverLetterInput - The input type for the createCoverLetter function.
 * - CreateCoverLetterOutput - The return type for the createCoverLetter function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define the input schema for the cover letter generation flow
const CreateCoverLetterInputSchema = z.object({
  cvText: z.string().describe('The full text content of the candidate\'s CV.'),
  jobDescriptionText: z.string().describe('The full text content of the target job description.'),
});
export type CreateCoverLetterInput = z.infer<typeof CreateCoverLetterInputSchema>;

// Define the output schema for the cover letter generation flow
const CreateCoverLetterOutputSchema = z.object({
  generatedCoverLetterText: z.string().describe('The generated cover letter text, formatted for ATS compatibility (plain text or simple Markdown).'),
});
export type CreateCoverLetterOutput = z.infer<typeof CreateCoverLetterOutputSchema>;

// Exported wrapper function to call the Genkit flow
export async function createCoverLetter(input: CreateCoverLetterInput): Promise<CreateCoverLetterOutput> {
  console.log('[createCoverLetter] Flow called with CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length);

  // Basic input validation
  if (!input.cvText || input.cvText.trim().length < 50) {
    console.error('[createCoverLetter] Invalid CV text provided.');
    throw new Error('Valid CV text must be provided.');
  }
  if (!input.jobDescriptionText || input.jobDescriptionText.trim().length < 50) {
    console.error('[createCoverLetter] Invalid job description provided.');
    throw new Error('A valid job description must be provided.');
  }

  try {
    const result = await createCoverLetterFlow(input);
    console.log('[createCoverLetter] Flow completed successfully. Generated Cover Letter length:', result.generatedCoverLetterText.length);
    return result;
  } catch (error) {
    console.error('[createCoverLetter] Error executing flow:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate cover letter: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the cover letter.');
  }
}

// Define the Genkit prompt for cover letter generation
const prompt = ai.definePrompt({
  name: 'createCoverLetterPrompt',
  input: {
    schema: CreateCoverLetterInputSchema,
  },
  output: {
    schema: CreateCoverLetterOutputSchema,
  },
  prompt: `You are an expert career advisor specializing in writing compelling, Applicant Tracking System (ATS)-friendly cover letters tailored to specific job descriptions.

Your task is to generate a cover letter based on the provided **Candidate CV Text** and the **Target Job Description Text**.

**Instructions:**

1.  **Analyze Job Description:** Carefully read the **Target Job Description Text** to understand the required skills, qualifications, experience, keywords, and company culture.
2.  **Review CV:** Read the **Candidate CV Text**. Identify the candidate's name (look for standard name formats near the beginning or contact information sections). Extract relevant experiences, skills, and achievements that directly align with the requirements found in the job description.
3.  **Draft Cover Letter Structure:** Follow a standard professional cover letter format:
    *   **Contact Information (Implied):** You don't need to generate this section, but assume the candidate's name (extracted from the CV) and contact details would be at the top.
    *   **Date:** (Optional, can be omitted for simplicity)
    *   **Hiring Manager/Company Address:** (If not available, use a generic salutation like "Dear Hiring Manager," or "Dear [Company Name] Team,").
    *   **Salutation:** Address the hiring manager by name if possible, otherwise use a professional greeting.
    *   **Introduction (Paragraph 1):** State the specific job title you are applying for and where you saw the advertisement. Briefly express your strong interest in the role and the company.
    *   **Body Paragraphs (Paragraphs 2-3):** This is the core section.
        *   **Connect CV to Job Description:** Highlight 2-3 key qualifications or experiences from the **Candidate CV Text** that directly match the most important requirements in the **Target Job Description Text**.
        *   **Use Keywords:** Naturally integrate keywords and specific terminology from the job description.
        *   **Quantify Achievements:** Use specific examples and quantify achievements from the CV whenever possible (e.g., "managed a team of 5," "increased efficiency by 15%").
        *   **Show Enthusiasm:** Briefly explain *why* you are interested in *this specific role* and *this company*, referencing aspects from the job description or company information if provided.
    *   **Conclusion (Paragraph 4):** Reiterate your enthusiasm and suitability for the role. Mention your attached CV. Express your desire for an interview to discuss your qualifications further.
    *   **Closing:** Use a professional closing like "Sincerely," or "Regards,".
    *   **Signature:** Type the candidate's full name (extracted from the CV).
4.  **ATS-Friendly Formatting:**
    *   **Plain Text Focus:** Use clear, simple language. Avoid complex sentence structures where possible.
    *   **No Fancy Formatting:** Do **NOT** use tables, columns, images, headers, footers, text boxes, or unusual fonts/characters. Stick to standard paragraph breaks. Use simple Markdown like bold (\`**bold**\`) sparingly for emphasis if needed, but prioritize plain text compatibility.
    *   **Standard Font/Size (Implied):** Assume the output will be used in systems expecting standard fonts (like Arial, Calibri, Times New Roman) and readable sizes (10-12pt).
    *   **Keywords:** Ensure relevant keywords from the job description are present naturally within the text.
5.  **Tone:** Maintain a professional, confident, and enthusiastic tone.
6.  **Proofread:** Ensure the generated text is free of grammatical errors and typos.
7.  **Output:** Provide **only** the generated cover letter text. Do not include any introductory phrases, explanations, or code fences (\`\`\`) around the output. Start directly with the salutation or the first line of the letter body.


**Candidate CV Text:**
\`\`\`
{{{cvText}}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

**Generated ATS-Friendly Cover Letter Text:**
`,
});

// Define the Genkit flow
const createCoverLetterFlow = ai.defineFlow<
  typeof CreateCoverLetterInputSchema,
  typeof CreateCoverLetterOutputSchema
>(
  {
    name: 'createCoverLetterFlow',
    inputSchema: CreateCoverLetterInputSchema,
    outputSchema: CreateCoverLetterOutputSchema,
  },
  async (input) => {
    console.log('[createCoverLetterFlow] Calling prompt for cover letter...');
    const { output } = await prompt(input);

    if (!output || !output.generatedCoverLetterText) {
      console.error('[createCoverLetterFlow] Prompt returned invalid or missing cover letter output.');
      throw new Error('The AI failed to generate a valid cover letter. The response was empty or incorrectly formatted.');
    }

    console.log('[createCoverLetterFlow] Cover letter prompt returned successfully.');
    // Basic validation: Check if the generated text seems plausible
    if (output.generatedCoverLetterText.length < 100) {
      console.warn('[createCoverLetterFlow] Generated cover letter seems unusually short:', output.generatedCoverLetterText.length);
    }

    // Trim whitespace
    output.generatedCoverLetterText = output.generatedCoverLetterText.trim();

    return output;
  }
);
