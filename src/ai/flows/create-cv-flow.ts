'use server';
/**
 * @fileOverview Generates a new, ATS-friendly CV tailored to a job description, formatted in Markdown,
 * optionally using prior CV analysis results to enhance tailoring.
 *
 * - createCv - Generates the tailored CV in Markdown format.
 * - CreateCvInput - The input type for the createCv function.
 * - CreateCvOutput - The return type for the createCv function (contains Markdown).
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import type { AnalyzeCvOutput } from './cv-analyzer'; // Import the type
import { AnalyzeCvOutputSchema } from './cv-analyzer-schema'; // Import the schema

// Updated input schema to include optional analysis results
const CreateCvInputSchema = z.object({
  cvText: z.string().describe('The text content of the existing CV.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
  analysisResults: AnalyzeCvOutputSchema.optional().describe('Optional results from a prior CV analysis against the job description, used to further tailor the CV.'),
});
export type CreateCvInput = z.infer<typeof CreateCvInputSchema>;

// Output schema remains the same (Markdown output)
const CreateCvOutputSchema = z.object({
  generatedCvMarkdown: z.string().describe('The text content of the newly generated, tailored CV, formatted in Markdown.'),
});
export type CreateCvOutput = z.infer<typeof CreateCvOutputSchema>;

// Exported function to call the flow
export async function createCv(input: CreateCvInput): Promise<CreateCvOutput> {
  console.log('[createCv] Flow called with CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length, 'Analysis provided:', !!input.analysisResults);

  if (!input.jobDescriptionText || input.jobDescriptionText.trim().length < 50) {
     console.error('[createCv] Invalid job description provided in input.');
     throw new Error('A valid job description must be provided.');
  }
   if (!input.cvText || input.cvText.trim().length < 50) {
     console.error('[createCv] Invalid CV text provided in input.');
     throw new Error('Valid CV text must be provided.');
  }

  try {
    // Pass the actual user inputs (including optional analysisResults) to the flow
    const result = await createCvFlow(input);
    console.log('[createCv] Flow completed successfully. Generated CV Markdown length:', result.generatedCvMarkdown.length);
    return result;
  } catch (error) {
     console.error('[createCv] Error executing flow:', error instanceof Error ? error.stack : error);
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
    schema: CreateCvOutputSchema,
  },
  prompt: `You are an expert CV writer specializing in creating Applicant Tracking System (ATS)-friendly resumes with professional formatting, tailored specifically for technology roles.
Your task is to rewrite the provided **Original CV Text**, tailoring it specifically for the **Target Job Description Text**, ensuring it passes ATS scans effectively while being visually appealing and well-organized for human readers. The goal is to create a CV suitable in length and content for a standard 2-page document.

**Context for the Target Role (Example - Adapt as needed based on Job Description Text):**
(The following is illustrative; primary guidance should come from the actual Job Description Text provided by the user)
*   **Company:** A technology company focused on harnessing technology for meaningful change...
*   **Role:** Lead Data Scientist responsible for developing/deploying advanced AI/ML models...
*   **Required Skills:** Python, R, SQL, Scikit-learn, PyTorch, TensorFlow, Hugging Face, Databricks...

**Instructions for CV Generation:**

1.  **Analyze Both Documents:** Carefully read the **Original CV Text** and the **Target Job Description Text** provided below.
2.  **Identify Keywords & Skills:** Extract key skills, qualifications, responsibilities, technologies, and action verbs mentioned *specifically* in the **Target Job Description Text**.
3.  **Tailor Content (CRITICAL):**
    {{#if analysisResults}}
    *   **Leverage CV Analysis Insights:** To significantly enhance the CV, you MUST incorporate the following analysis results:
        *   **Overall Match Indication:** {{analysisResults.matchPercentage}}% (use this as context for the depth of tailoring needed)
        *   **Keywords to Add/Emphasize:** {{#if analysisResults.suggestions.keywordsToAdd}}Incorporate these: {{#each analysisResults.suggestions.keywordsToAdd}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{else}}N/A.{{/if}}
        *   **Skills to Highlight:** {{#if analysisResults.suggestions.skillsToEmphasize}}Emphasize these: {{#each analysisResults.suggestions.skillsToEmphasize}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.{{else}}N/A.{{/if}}
        *   **Experience to Detail (including suggested summary):** Focus on: "{{{analysisResults.suggestions.experienceToDetail}}}"
    *   **Summary/Profile Section:** Rewrite this section to be concise (3-4 lines) and directly address the core requirements of the *Target Job Description*. **If a suggested summary is provided in the 'Experience to Detail' from the analysis, use that as a strong foundation.**
    *   **Prioritize and Emphasize:** Use the job description and {{#if analysisResults}}the analysis insights (keywords, skills, experience suggestions){{else}}your own analysis{{/if}} to identify which experiences, projects, and accomplishments from the **Original CV Text** are most relevant. Expand on these with quantifiable results.
    *   **De-emphasize/Omit:** Less relevant information should be summarized briefly or omitted to keep the CV focused and within the 2-page target.
    *   **Skills Section:** Organize clearly, potentially by category. Ensure skills from the job description and {{#if analysisResults}}the 'Skills to Highlight' analysis{{else}}your analysis{{/if}} are included if genuinely possessed by the candidate (as per the Original CV).
    {{else}}
    *   **Summary/Profile Section:** Rewrite this section to be concise (3-4 lines) and directly address the core requirements and keywords of the *Target Job Description*. Highlight the candidate's most relevant expertise for *this specific* role.
    *   **Prioritize and Expand:** From the **Original CV Text**, prioritize and expand on experiences, projects, and accomplishments that *directly align* with the responsibilities and qualifications listed in the **Target Job Description Text**.
    *   **De-emphasize/Omit:** Less relevant information should be summarized briefly or omitted.
    *   **Skills Section:** Organize the "Skills" section clearly. Ensure skills mentioned in the target job description are included if present in the original CV.
    {{/if}}
    *   **Crucially: Do not invent new experiences, skills, or qualifications not present in the Original CV Text.** Only rephrase, reorder, and emphasize existing information based on its relevance to the Target Job Description {{#if analysisResults}}and the provided analysis{{/if}}.
4.  **ATS-Friendly & Professional Formatting (Markdown):**
    *   Use standard, clear section headings (e.g., "Summary", "Professional Experience", "Skills", "Education", "Projects", "Certifications"). Use Markdown \`##\` for these main headings.
    *   Use clear, concise language. Start bullet points with strong action verbs.
    *   Employ bullet points (\`* \` or \`- \` followed by a space) for accomplishments and responsibilities under each role.
    *   Quantify achievements whenever possible.
    *   Avoid tables, columns, graphics, headers/footers, and unusual fonts/characters.
    *   Ensure consistent formatting for dates (e.g., "MM/YYYY - MM/YYYY"), job titles, and company names. Use Markdown \`###\` for job titles/sub-sections.
    *   Use \`**bold text**\` sparingly for emphasis on key achievements or technologies directly relevant to the target job.
    *   Structure logically: Contact Info (Implied), Summary, Skills, Professional Experience (reverse chronological), Education, Projects/Publications.
    *   Use horizontal rules (\`---\`) sparingly.
    *   Ensure clean line breaks and paragraph spacing.
5.  **Aim for 2-Page Length:** Structure content and detail for a professional 2-page CV.
6.  **Output Format:** Provide the **full text** of the rewritten CV formatted **exclusively in Markdown**. Start directly with the CV content. **Do not include any introductory sentences, explanations, apologies, or code block fences (\`\`\`) before or after the Markdown CV content.**

**Original CV Text:**
\`\`\`
{{{cvText}}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

{{#if analysisResults}}
**CV Analysis Summary for Reference (use this to guide tailoring):**
*   Overall Match with Job: {{analysisResults.matchPercentage}}%
*   Suggested Keywords to Add/Emphasize: {{#if analysisResults.suggestions.keywordsToAdd}}{{#each analysisResults.suggestions.keywordsToAdd}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None specifically suggested.{{/if}}
*   Suggested Skills to Highlight: {{#if analysisResults.suggestions.skillsToEmphasize}}{{#each analysisResults.suggestions.skillsToEmphasize}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None specifically suggested.{{/if}}
*   Guidance on Experience to Detail (includes suggested summary): "{{{analysisResults.suggestions.experienceToDetail}}}"
{{/if}}

**Generated ATS-Friendly CV (Markdown - Aiming for 2 pages):**
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
  console.log('[createCvFlow] Calling prompt for Markdown CV. Analysis provided:', !!input.analysisResults);
  const { output } = await prompt(input); // Input now includes optional analysisResults

  if (!output || !output.generatedCvMarkdown) {
      console.error('[createCvFlow] Prompt returned invalid or missing Markdown output.');
      throw new Error('The AI failed to generate a valid CV. The response was empty or incorrectly formatted.');
  }

  console.log('[createCvFlow] Markdown CV prompt returned successfully.');
  if (output.generatedCvMarkdown.length < 200) {
      console.warn('[createCvFlow] Generated CV Markdown seems unusually short:', output.generatedCvMarkdown.length);
  }

   output.generatedCvMarkdown = output.generatedCvMarkdown.trim();
   if (!output.generatedCvMarkdown.startsWith('##') && !output.generatedCvMarkdown.startsWith(input.cvText.substring(0,10))) { // Allow if it starts with original text if no heading
        console.warn('[createCvFlow] Generated CV Markdown does not start with a standard heading (##). Potential formatting issue or major rewrite.');
   }

  return output;
});

