'use server';
/**
 * @fileOverview Generates a tailored, ATS-friendly cover letter based on a CV, job description, and optional CV analysis results.
 *
 * - createCoverLetter - Generates the cover letter text.
 * - CreateCoverLetterInput - The input type for the createCoverLetter function.
 * - CreateCoverLetterOutput - The return type for the createCoverLetter function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import the schema from the analyzer flow to reuse it
import type { AnalyzeCvOutput } from './cv-analyzer';
import { AnalyzeCvOutputSchema } from './cv-analyzer-schema'; // Assuming you extract the schema

// Define the input schema for the cover letter generation flow
const CreateCoverLetterInputSchema = z.object({
  cvText: z.string().describe("The full text content of the candidate's CV."),
  jobDescriptionText: z.string().describe('The full text content of the target job description.'),
  analysisResults: AnalyzeCvOutputSchema.optional().describe('Optional results from a prior CV analysis against the job description, used to further strengthen the letter.'),
});
export type CreateCoverLetterInput = z.infer<typeof CreateCoverLetterInputSchema>;

// Define the output schema for the cover letter generation flow
const CreateCoverLetterOutputSchema = z.object({
  generatedCoverLetterText: z.string().describe('The generated cover letter text, formatted as plain text for maximum ATS compatibility.'),
});
export type CreateCoverLetterOutput = z.infer<typeof CreateCoverLetterOutputSchema>;

// Exported wrapper function to call the Genkit flow
export async function createCoverLetter(input: CreateCoverLetterInput): Promise<CreateCoverLetterOutput> {
  console.log('[createCoverLetter] Flow called with CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length, 'Analysis provided:', !!input.analysisResults);

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

Your task is to generate a cover letter based on the provided **Candidate CV Text** and the **Target Job Description Text**. The output MUST be plain text.

{{#if analysisResults}}
**Additionally, consider the following analysis results which compare the CV to the job description. Use these insights to make the cover letter even stronger and more targeted:**

*   **Overall Match:** {{analysisResults.matchPercentage}}%
*   **Score Breakdown:** Experience: {{analysisResults.scoreBreakdown.experience}}%, Education: {{analysisResults.scoreBreakdown.education}}%, Skills: {{analysisResults.scoreBreakdown.skills}}%
*   **Keywords to Add/Emphasize:** {{#each analysisResults.suggestions.keywordsToAdd}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
*   **Skills to Highlight:** {{#each analysisResults.suggestions.skillsToEmphasize}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
*   **Experience to Detail:** {{analysisResults.suggestions.experienceToDetail}}

Use these analysis points to strategically highlight the candidate's strengths identified in the CV that align best with the job description, address potential gaps implicitly by focusing on related strengths, and incorporate the suggested keywords naturally.
{{/if}}

**Instructions:**

1.  **Analyze Job Description:** Carefully read the **Target Job Description Text** to understand the required skills, qualifications, experience, keywords, and company culture.
2.  **Review CV:** Read the **Candidate CV Text**. Identify the candidate's name (look for standard name formats near the beginning or contact information sections). Extract relevant experiences, skills, and achievements that directly align with the requirements found in the job description.
3.  **Draft Cover Letter Structure (Plain Text):** Follow a standard professional cover letter format using ONLY plain text and standard paragraph breaks:
    *   **Contact Information (Candidate - Optional):** You MAY include the candidate's name, phone, and email at the top if easily identifiable in the CV, each on a new line. If not clear, omit this section.
    *   **Date:** Include the current date (e.g., "Month DD, YYYY") on a new line if easily determinable or just use a placeholder like "[Date]".
    *   **Hiring Manager/Company Address (Optional):** Include recipient details if clearly identifiable in the job description, each on a new line. If not available, omit this section.
    *   **Salutation:** Address the hiring manager by name if possible (e.g., "Dear [Mr./Ms./Mx. Last Name],"), otherwise use a generic professional greeting like "Dear Hiring Manager," or "Dear [Company Name] Team,". Follow with a blank line.
    *   **Introduction (Paragraph 1):** State the specific job title you are applying for and where you saw the advertisement. Briefly express your strong interest in the role and the company. End paragraph with a blank line.
    *   **Body Paragraphs (Paragraphs 2-3):** This is the core section. Use separate paragraphs for distinct points, separated by blank lines.
        *   **Connect CV to Job Description:** Highlight 2-3 key qualifications or experiences from the **Candidate CV Text** that directly match the most important requirements in the **Target Job Description Text**. {{#if analysisResults}}**Prioritize using the 'Skills to Emphasize' and detailing the 'Experience to Detail' suggested by the analysis.**{{/if}}
        *   **Use Keywords:** Naturally integrate keywords and specific terminology from the job description. {{#if analysisResults}}**Pay special attention to incorporating the 'Keywords to Add' suggested by the analysis.**{{/if}}
        *   **Quantify Achievements:** Use specific examples and quantify achievements from the CV whenever possible (e.g., "managed a team of 5," "increased efficiency by 15%").
        *   **Show Enthusiasm:** Briefly explain *why* you are interested in *this specific role* and *this company*, referencing aspects from the job description or company information if provided.
    *   **Conclusion (Paragraph 4):** Reiterate your enthusiasm and suitability for the role. Mention your attached CV. Express your desire for an interview to discuss your qualifications further. End paragraph with a blank line.
    *   **Closing:** Use a professional closing like "Sincerely," or "Regards," on a new line.
    *   **Signature:** Type the candidate's full name (extracted from the CV) on a new line below the closing.
4.  **Strictly ATS-Friendly Formatting (Plain Text ONLY):**
    *   **Plain Text ONLY:** Output MUST be plain text. Use clear, simple language.
    *   **NO Formatting:** Do **NOT** use Markdown, HTML, bold, italics, lists, tables, columns, images, headers, footers, text boxes, or any special characters/symbols.
    *   **Standard Line Breaks:** Use single blank lines to separate paragraphs, the date, addresses, salutation, closing, and signature. Do not use multiple blank lines.
    *   **Keywords:** Ensure relevant keywords from the job description are present naturally within the text.
5.  **Tone:** Maintain a professional, confident, and enthusiastic tone.
6.  **Proofread:** Ensure the generated text is free of grammatical errors and typos.
7.  **Output:** Provide **only** the generated plain text cover letter. Do not include any introductory phrases, explanations, comments, or code fences (\`\`\`) around the output. Start directly with the first line of the letter (e.g., Candidate Name or Date).


**Candidate CV Text:**
\`\`\`
{{{cvText}}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

**Generated ATS-Friendly Cover Letter (Plain Text Only):**
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
    const { output } = await prompt(input); // Input now includes optional analysisResults

    if (!output || !output.generatedCoverLetterText) {
      console.error('[createCoverLetterFlow] Prompt returned invalid or missing cover letter output.');
      throw new Error('The AI failed to generate a valid cover letter. The response was empty or incorrectly formatted.');
    }

    console.log('[createCoverLetterFlow] Cover letter prompt returned successfully.');
    // Basic validation: Check if the generated text seems plausible
    if (output.generatedCoverLetterText.length < 100) {
      console.warn('[createCoverLetterFlow] Generated cover letter seems unusually short:', output.generatedCoverLetterText.length);
    }

    // Trim whitespace and ensure consistent line endings (optional but good practice)
    output.generatedCoverLetterText = output.generatedCoverLetterText.trim().replace(/\r\n/g, '\n');

    return output;
  }
);

// Need to define or import AnalyzeCvOutputSchema if not already done
// Assuming it's defined in cv-analyzer-schema.ts
// If not, define it here based on the structure in cv-analyzer.ts
// export const AnalyzeCvOutputSchema = z.object({ ... }); // Define here if needed
