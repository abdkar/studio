'use server';
/**
 * @fileOverview Generates a new, ATS-friendly CV tailored to a job description, formatted in Markdown.
 *
 * - createCv - Generates the tailored CV in Markdown format.
 * - CreateCvInput - The input type for the createCv function.
 * - CreateCvOutput - The return type for the createCv function (contains Markdown).
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Input schema remains the same
const CreateCvInputSchema = z.object({
  cvText: z.string().describe('The text content of the existing CV.'),
  jobDescriptionText: z.string().describe('The text content of the job description.'),
});
export type CreateCvInput = z.infer<typeof CreateCvInputSchema>;

// Output schema now specifies Markdown output
const CreateCvOutputSchema = z.object({
  generatedCvMarkdown: z.string().describe('The text content of the newly generated, tailored CV, formatted in Markdown.'),
});
export type CreateCvOutput = z.infer<typeof CreateCvOutputSchema>;

// Exported function to call the flow
export async function createCv(input: CreateCvInput): Promise<CreateCvOutput> {
  console.log('[createCv] Flow called with CV length:', input.cvText.length, 'Job Desc length:', input.jobDescriptionText.length);
  try {
    const result = await createCvFlow(input);
    console.log('[createCv] Flow completed successfully. Generated CV Markdown length:', result.generatedCvMarkdown.length);
    return result;
  } catch (error) {
    console.error('[createCv] Error executing flow:', error);
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
    // Define the expected output structure for the LLM (Markdown)
    schema: CreateCvOutputSchema,
  },
  prompt: `You are an expert CV writer specializing in creating Applicant Tracking System (ATS)-friendly resumes with professional formatting.
Your task is to rewrite the provided CV, tailoring it specifically for the given job description, ensuring it passes ATS scans effectively while being visually clear and well-organized for human readers.

**Instructions:**

1.  **Analyze Both Documents:** Carefully read both the original CV and the target job description.
2.  **Identify Keywords:** Extract key skills, qualifications, responsibilities, and technologies mentioned in the job description.
3.  **Integrate Keywords:** Naturally weave these keywords into the rewritten CV, particularly in the summary/profile, skills, and experience sections. Use the exact phrasing from the job description where appropriate, but avoid keyword stuffing.
4.  **ATS-Friendly & Professional Formatting:**
    *   Use standard section headings (e.g., "Summary", "Professional Experience", "Skills", "Education", "Projects").
    *   Use clear, concise language.
    *   Employ bullet points for accomplishments and responsibilities.
    *   Avoid tables, columns, graphics, headers/footers, and unusual fonts.
    *   Ensure consistent formatting for dates and job titles.
    *   Structure the content logically.
5.  **Tailor Content:**
    *   Rewrite the summary/profile to directly address the requirements of the target role.
    *   Emphasize experiences and accomplishments from the original CV that are most relevant to the job description. Quantify achievements whenever possible.
    *   Reorder or prioritize sections/skills based on the job ad's focus.
    *   Do not include information not present in the original CV unless it's a direct synthesis of skills/experience already mentioned (e.g., summarizing technical skills listed under different jobs into a dedicated 'Skills' section). Do not invent new experiences or qualifications.
6.  **Output Format:** Provide the full text of the rewritten CV formatted using **Markdown**. Use standard Markdown syntax for structure and emphasis:
    *   Use \`##\` for main section headings (e.g., \`## Summary\`, \`## Professional Experience\`).
    *   Use \`###\` for job titles or sub-sections within experience/education.
    *   Use \`**bold text**\` for emphasis on key terms or achievements, but use sparingly for professionalism.
    *   Use bullet points (\`* \` or \`- \` followed by a space) for lists under experience, skills, etc. Start each bullet point on a new line.
    *   Use horizontal rules (\`---\`) sparingly to separate major sections if it enhances clarity (e.g., between Experience and Education).
    *   Ensure clean line breaks and paragraph spacing for readability. Use single blank lines between paragraphs or list items where appropriate.
    *   The final output should be **only the Markdown content** of the generated CV, ready to be saved in a \`.md\` file. Do not include any introductory text, code block fences (\`\`\`), or explanations outside the CV content itself.

**Original CV Text:**
\`\`\`
{{cvText}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{jobDescriptionText}}
\`\`\`

**Generated ATS-Friendly CV (Markdown):**
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
  console.log('[createCvFlow] Calling prompt for Markdown CV...');
  const { output } = await prompt(input);

  if (!output || !output.generatedCvMarkdown) {
      console.error('[createCvFlow] Prompt returned invalid or missing Markdown output.');
      throw new Error('The AI failed to generate a valid CV. The response was empty or incorrectly formatted.');
  }

  console.log('[createCvFlow] Markdown CV prompt returned successfully.');
  // Basic validation: Check if the generated Markdown seems plausible
  if (output.generatedCvMarkdown.length < 100) {
      console.warn('[createCvFlow] Generated CV Markdown seems unusually short:', output.generatedCvMarkdown.length);
      // Consider throwing error if too short
      // throw new Error('Generated CV is too short. Please check the input or try again.');
  }

   // Trim whitespace from the beginning and end of the generated Markdown
   output.generatedCvMarkdown = output.generatedCvMarkdown.trim();

  return output; // Output now contains generatedCvMarkdown
});
