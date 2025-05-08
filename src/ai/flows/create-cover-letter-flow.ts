
'use server';
/**
 * @fileOverview Generates or regenerates a tailored, ATS-friendly cover letter.
 * It can create a new letter based on a CV, job description, and optional CV analysis.
 * It can also regenerate an existing cover letter by incorporating specific feedback.
 *
 * - createCoverLetter - Generates or regenerates the cover letter text.
 * - CreateCoverLetterInput - The input type for the createCoverLetter function.
 * - CreateCoverLetterOutput - The return type for the createCoverLetter function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Import the schema from the analyzer flow to reuse it
import type { AnalyzeCvOutput } from './cv-analyzer';
import { AnalyzeCvOutputSchema } from './cv-analyzer-schema';

// Define the input schema for the cover letter generation flow
const CreateCoverLetterInputSchema = z.object({
  cvText: z.string().describe("The full text content of the candidate's CV."),
  jobDescriptionText: z.string().describe('The full text content of the target job description.'),
  analysisResults: AnalyzeCvOutputSchema.optional().describe('Optional results from a prior CV analysis against the job description, used to further strengthen the letter.'),
  originalCoverLetterText: z.string().optional().describe('Optional: The text of a previously generated cover letter that needs improvement. If provided, the AI will revise this letter.'),
  evaluationFeedback: z.string().optional().describe('Optional: Specific feedback and suggestions for improving the cover letter. Used when `originalCoverLetterText` is provided.'),
});
export type CreateCoverLetterInput = z.infer<typeof CreateCoverLetterInputSchema>;

// Define the output schema for the cover letter generation flow
const CreateCoverLetterOutputSchema = z.object({
  generatedCoverLetterText: z.string().describe('The generated or regenerated cover letter text, formatted as plain text for maximum ATS compatibility.'),
});
export type CreateCoverLetterOutput = z.infer<typeof CreateCoverLetterOutputSchema>;

// Exported wrapper function to call the Genkit flow
export async function createCoverLetter(input: CreateCoverLetterInput): Promise<CreateCoverLetterOutput> {
  console.log('[createCoverLetter] Flow called. CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length);
  console.log('[createCoverLetter] Analysis provided:', !!input.analysisResults);
  console.log('[createCoverLetter] Original Letter Provided:', !!input.originalCoverLetterText, 'Feedback Provided:', !!input.evaluationFeedback);


  // Basic input validation
  if (!input.cvText || input.cvText.trim().length < 50) {
    console.error('[createCoverLetter] Invalid CV text provided.');
    throw new Error('Valid CV text must be provided.');
  }
  if (!input.jobDescriptionText || input.jobDescriptionText.trim().length < 50) {
    console.error('[createCoverLetter] Invalid job description provided.');
    throw new Error('A valid job description must be provided.');
  }
  if (input.evaluationFeedback && !input.originalCoverLetterText) {
    console.warn('[createCoverLetter] Evaluation feedback provided without an original cover letter. Feedback may not be optimally used.');
  }


  try {
    const result = await createCoverLetterFlow(input);
    console.log('[createCoverLetter] Flow completed successfully. Generated Cover Letter length:', result.generatedCoverLetterText.length);
    return result;
  } catch (error) {
    // Log detailed error on the server
    console.error('[createCoverLetter] Error executing flow:', error instanceof Error ? error.stack : error);
    // Throw a more generic error to the client
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

{{#if originalCoverLetterText}}
**Task: Revise and Improve Cover Letter**
You are improving a previously generated cover letter based on specific feedback.
**Original Cover Letter Text:**
\`\`\`
{{{originalCoverLetterText}}}
\`\`\`
{{#if evaluationFeedback}}
**Feedback for Improvement:**
\`\`\`
{{{evaluationFeedback}}}
\`\`\`
Your primary goal is to revise the **Original CoverLetter Text** by thoroughly applying the **Feedback for Improvement**. You must also adhere to all general instructions below regarding structure, ATS-friendliness, and writing style.
{{else}}
Your task is to review and refine the **Original Cover Letter Text** based on the general instructions below for structure, ATS-friendliness, and writing style, ensuring it is highly effective.
{{/if}}

**Context for Revision (use these if no original letter text is provided, or to cross-reference if it is):**
Candidate CV Text:
\`\`\`
{{{cvText}}}
\`\`\`
Target Job Description Text:
\`\`\`
{{{jobDescriptionText}}}
\`\`\`
{{#if analysisResults}}
CV Analysis Insights (use to strengthen the letter):
*   Overall Match: {{analysisResults.matchPercentage}}%
*   Keywords to Add/Emphasize: {{#if analysisResults.suggestions.keywordsToAdd}}{{#each analysisResults.suggestions.keywordsToAdd}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}N/A{{/if}}
*   Skills to Highlight: {{#if analysisResults.suggestions.skillsToEmphasize}}{{#each analysisResults.suggestions.skillsToEmphasize}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}N/A{{/if}}
*   Experience to Detail (includes suggested summary): {{{analysisResults.suggestions.experienceToDetail}}}
{{/if}}

{{else}}
**Task: Generate New Cover Letter**
Your task is to generate a new cover letter based on the provided **Candidate CV Text** and the **Target Job Description Text**.
**Candidate CV Text:**
\`\`\`
{{{cvText}}}
\`\`\`
**Target Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`
{{#if analysisResults}}
**Additionally, consider the following analysis results which compare the CV to the job description. Use these insights to make the cover letter even stronger and more targeted:**
*   Overall Match: {{analysisResults.matchPercentage}}%
*   Score Breakdown: Experience: {{analysisResults.scoreBreakdown.experience}}%, Education: {{analysisResults.scoreBreakdown.education}}%, Skills: {{analysisResults.scoreBreakdown.skills}}%
*   Keywords to Add/Emphasize: {{#each analysisResults.suggestions.keywordsToAdd}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
*   Skills to Highlight: {{#each analysisResults.suggestions.skillsToEmphasize}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
*   Experience to Detail (includes suggested summary): {{{analysisResults.suggestions.experienceToDetail}}}
Use these analysis points to strategically highlight the candidate's strengths identified in the CV that align best with the job description, address potential gaps implicitly by focusing on related strengths, and incorporate the suggested keywords naturally.
{{/if}}
{{/if}}

**General Instructions (Apply to both new generation and revision):**

1.  **Analyze Job Description:** Carefully read the **Target Job Description Text** to understand the required skills, qualifications, experience, keywords, and company culture.
2.  **Review CV (or Original Letter if revising):** If generating new, read the **Candidate CV Text**. Identify the candidate's name. Extract relevant experiences, skills, and achievements that directly align with the job description. If revising, use the Original Letter as the base, but cross-reference with CV and Job Description for context.
3.  **Draft Cover Letter Structure (Plain Text):** Follow a standard professional cover letter format using ONLY plain text and standard paragraph breaks:
    *   **Contact Information (Candidate - Optional):** You MAY include the candidate's name, phone, and email at the top if easily identifiable in the CV, each on a new line. If not clear, omit this section.
    *   **Date:** Include the current date (e.g., "Month DD, YYYY") on a new line if easily determinable or just use a placeholder like "[Date]".
    *   **Hiring Manager/Company Address (Optional):** Include recipient details if clearly identifiable in the job description, each on a new line. If not available, omit this section.
    *   **Salutation:** Address the hiring manager by name if possible (e.g., "Dear [Mr./Ms./Mx. Last Name],"), otherwise use a generic professional greeting like "Dear Hiring Manager," or "Dear [Company Name] Team,". Follow with a blank line.
    *   **Introduction (Paragraph 1):** State the specific job title you are applying for and where you saw the advertisement. Briefly express your strong interest in the role and the company. End paragraph with a blank line.
    *   **Body Paragraphs (Paragraphs 2-3):** This is the core section. Use separate paragraphs for distinct points, separated by blank lines.
        *   **Connect CV/Experience to Job Description:** Highlight 2-3 key qualifications or experiences (from CV if new, or refined from original letter if revising) that directly match the most important requirements in the **Target Job Description Text**. {{#if analysisResults}}**Prioritize using the 'Skills to Emphasize' and detailing the 'Experience to Detail' suggested by the analysis.**{{/if}}
        *   **Elaborate on Relevant Experience:** For the highlighted experiences, briefly explain how skills and achievements from those previous roles are transferable and beneficial to the target job. Show, don't just tell. For example, instead of "Experienced in project management," say "In my role as X, I successfully managed Y project, delivering Z results, which aligns with your need for..."
        *   **Use Keywords:** Naturally integrate keywords and specific terminology from the job description. {{#if analysisResults}}**Pay special attention to incorporating the 'Keywords to Add' suggested by the analysis.**{{/if}}
        *   **Quantify Achievements:** Use specific examples and quantify achievements whenever possible.
        *   **Show Enthusiasm:** Briefly explain *why* you are interested in *this specific role* and *this company*.
    *   **Conclusion (Paragraph 4):** Reiterate your enthusiasm and suitability for the role. Mention your attached CV. Express your desire for an interview to discuss your qualifications further. End paragraph with a blank line.
    *   **Closing:** Use a professional closing like "Sincerely," or "Regards," on a new line.
    *   **Signature:** Type the candidate's full name (extracted from the CV or original letter) on a new line below the closing.
4.  **Strictly ATS-Friendly Formatting (Plain Text ONLY):**
    *   **Plain Text ONLY:** Output MUST be plain text.
    *   **NO Formatting:** Do **NOT** use Markdown, HTML, bold, italics, lists, tables, columns, images, headers, footers, text boxes, or any special characters/symbols.
    *   **Standard Line Breaks:** Use single blank lines to separate paragraphs, the date, addresses, salutation, closing, and signature. Do not use multiple blank lines.
5.  **Tone:** Maintain a professional, confident, and enthusiastic tone.
6.  **Writing Style - VERY IMPORTANT:**
    *   **Sentence Length:** Keep sentences brief and clear. Aim for 10-20 words per sentence where appropriate for readability.
    *   **Word Choice:** Pick common, easily understood words over complex vocabulary. Use technical terms ONLY when necessary and relevant to the job description.
    *   **AVOID JARGON:** Do NOT use the following overused business terms and jargon: delve, digital age, cutting-edge, leverage, proactive, pivotal, seamless, fast-paced, game-changer, quest, realm, landscape, evolve, resilient, thrill, unravel, embark, world.
    *   **AVOID SPECIFIC LINKING WORDS:** Do NOT use the following words: indeed, furthermore, thus, moreover, notwithstanding, ostensibly, consequently, specifically, notably, alternatively. Find simpler ways to connect ideas.
    *   **Punctuation:** Use standard English punctuation correctly.
    *   **Sentence Structure:** Vary sentence structure and punctuation naturally to maintain reader engagement, while adhering to clarity and brevity.
7.  **Proofread:** Ensure the generated text is free of grammatical errors and typos.
8.  **Output:** Provide **only** the generated plain text cover letter. Do not include any introductory phrases, explanations, comments, or code fences (\`\`\`) around the output. Start directly with the first line of the letter.

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

    // Trim whitespace and ensure consistent line endings (optional but good practice)
    output.generatedCoverLetterText = output.generatedCoverLetterText.trim().replace(/\r\n/g, '\n');

    return output;
  }
);
