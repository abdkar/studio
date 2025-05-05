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
  // Ensure the job description from the user input is used, not the hardcoded one below (which is just context for the prompt)
  if (!input.jobDescriptionText || input.jobDescriptionText.trim().length < 50) {
     console.error('[createCv] Invalid job description provided in input.');
     throw new Error('A valid job description must be provided.');
  }
   if (!input.cvText || input.cvText.trim().length < 50) {
     console.error('[createCv] Invalid CV text provided in input.');
     throw new Error('Valid CV text must be provided.');
  }

  try {
    // Pass the actual user inputs to the flow
    const result = await createCvFlow({
        cvText: input.cvText,
        jobDescriptionText: input.jobDescriptionText
    });
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
    // Schema for the data dynamically passed into the prompt execution
    schema: CreateCvInputSchema,
  },
  output: {
    // Define the expected output structure for the LLM (Markdown)
    schema: CreateCvOutputSchema,
  },
  // The actual prompt template using Handlebars syntax
  prompt: `You are an expert CV writer specializing in creating Applicant Tracking System (ATS)-friendly resumes with professional formatting, tailored specifically for technology roles.
Your task is to rewrite the provided **Original CV Text**, tailoring it specifically for the **Target Job Description Text**, ensuring it passes ATS scans effectively while being visually appealing and well-organized for human readers. The goal is to create a CV suitable in length and content for a standard 2-page document.

**Context for the Target Role (Lead Data Scientist):**

*   **Company:** A technology company focused on harnessing technology for meaningful change, partnering with leading brands to create dynamic platforms and intelligent digital experiences. They emphasize world-class engineering, industry expertise, and a people-centric mindset. Key values include innovation, transformation, and making a real-world impact. Employee benefits focus on finance, career development, learning, work-life balance, health, and community. They are committed to diversity and inclusion.
*   **Role:** Lead Data Scientist responsible for developing/deploying advanced AI/ML models (statistical, ML, DL). Requires expertise in Python, big data processing (Spark/Hadoop), and cloud AI platforms (Databricks, Azure ML, AWS SageMaker, GCP Vertex AI). Key tasks involve EDA, feature engineering, classical ML (regression, clustering, time-series), advanced algorithms (XGBoost, LightGBM), CV/NLP/Generative models (PyTorch/TensorFlow/Transformers), MLOps (CI/CD with MLflow/Kubeflow/SageMaker Pipelines), model monitoring/retraining, communicating insights, and ensuring ethical AI (GDPR, bias mitigation, SHAP/LIME).
*   **Required Skills:** Python (NumPy, Pandas), R, SQL, Scikit-learn, PyTorch, TensorFlow, Hugging Face, Databricks, Azure ML, AWS SageMaker, GCP Vertex AI, MLflow, Kubeflow, Weights & Biases. Awareness of data pipelines, cloud architecture, governance, security. Soft skills: Critical thinking, communication, leadership/mentoring.

**Instructions for CV Generation:**

1.  **Analyze Both Documents:** Carefully read the **Original CV Text** and the **Target Job Description Text** provided below.
2.  **Identify Keywords & Skills:** Extract key skills, qualifications, responsibilities, technologies, and action verbs mentioned *specifically* in the **Target Job Description Text**. Pay attention to both technical skills (Python, PyTorch, Databricks, etc.) and soft skills (communication, leadership).
3.  **Integrate Keywords:** Naturally weave these keywords into the rewritten CV, particularly in the summary/profile, skills, and experience sections. Use the exact phrasing from the job description where appropriate, but ensure the language flows well and avoids keyword stuffing.
4.  **ATS-Friendly & Professional Formatting (Markdown):**
    *   Use standard, clear section headings (e.g., "Summary", "Professional Experience", "Skills", "Education", "Projects", "Certifications"). Use Markdown \`##\` for these main headings.
    *   Use clear, concise language. Start bullet points with strong action verbs.
    *   Employ bullet points (\`* \` or \`- \` followed by a space) for accomplishments and responsibilities under each role. Start each bullet point on a new line.
    *   Quantify achievements whenever possible (e.g., "Improved model accuracy by 15%", "Reduced processing time by 30%").
    *   Avoid tables, columns, graphics, headers/footers, and unusual fonts/characters that might confuse ATS.
    *   Ensure consistent formatting for dates (e.g., "MM/YYYY - MM/YYYY" or "YYYY - Present"), job titles, and company names. Use Markdown \`###\` for job titles/sub-sections.
    *   Use \`**bold text**\` sparingly for emphasis on key achievements or technologies directly relevant to the target job.
    *   Structure the content logically, typically: Contact Info (Implied, not generated here), Summary, Skills, Professional Experience (reverse chronological), Education, Projects/Publications (if applicable).
    *   Use horizontal rules (\`---\`) sparingly to separate major sections like Experience and Education if it enhances clarity.
    *   Ensure clean line breaks and paragraph spacing for readability. Use single blank lines between paragraphs or list items.
5.  **Tailor Content:**
    *   Rewrite the summary/profile section to be concise (3-4 lines) and directly address the core requirements and keywords of the *Target Job Description*. Highlight the candidate's most relevant expertise for *this specific* Lead Data Scientist role.
    *   From the **Original CV Text**, prioritize and expand on experiences, projects, and accomplishments that *directly align* with the responsibilities and qualifications listed in the **Target Job Description Text**. De-emphasize or omit less relevant information.
    *   Organize the "Skills" section clearly, potentially grouping by category (e.g., Programming Languages, ML/DL Frameworks, Cloud Platforms, MLOps Tools, Big Data Technologies). Ensure skills mentioned in the target job description are included if present in the original CV.
    *   Synthesize information where appropriate (e.g., consolidating skills listed across different jobs into the main Skills section).
    *   **Crucially: Do not invent new experiences, skills, or qualifications not present in the Original CV Text.** Only rephrase, reorder, and emphasize existing information.
6.  **Aim for 2-Page Length:** Structure the content and level of detail to be suitable for a standard, professional 2-page CV. This means being selective about which accomplishments to detail and keeping descriptions concise. While precise page control isn't possible in Markdown, aim for a length and density appropriate for this target.
7.  **Output Format:** Provide the **full text** of the rewritten CV formatted **exclusively in Markdown**. The output must start directly with the first line of the CV content (e.g., Name or Summary heading) and end with the last line. **Do not include any introductory sentences, explanations, apologies, or code block fences (\`\`\`) before or after the Markdown CV content itself.**

**Original CV Text:**
\`\`\`
{{{cvText}}}
\`\`\`

**Target Job Description Text:**
\`\`\`
{{{jobDescriptionText}}}
\`\`\`

**Generated ATS-Friendly CV (Markdown - Aiming for 2 pages):**
`, // Keep the final line break here
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
  // Pass the validated user inputs to the prompt
  const { output } = await prompt(input);

  if (!output || !output.generatedCvMarkdown) {
      console.error('[createCvFlow] Prompt returned invalid or missing Markdown output.');
      throw new Error('The AI failed to generate a valid CV. The response was empty or incorrectly formatted.');
  }

  console.log('[createCvFlow] Markdown CV prompt returned successfully.');
  // Basic validation: Check if the generated Markdown seems plausible
  if (output.generatedCvMarkdown.length < 200) { // Increased minimum length check
      console.warn('[createCvFlow] Generated CV Markdown seems unusually short:', output.generatedCvMarkdown.length);
      // Consider throwing error if too short, but allow for brief CVs if valid
      // throw new Error('Generated CV is too short. Please check the input or try again.');
  }

   // Trim whitespace from the beginning and end of the generated Markdown
   output.generatedCvMarkdown = output.generatedCvMarkdown.trim();

   // Further validation: Check if it starts like a CV (e.g., with a heading)
   if (!output.generatedCvMarkdown.startsWith('##')) {
        console.warn('[createCvFlow] Generated CV Markdown does not start with a standard heading (##). Potential formatting issue.');
        // Allow it but log warning
   }


  return output; // Output now contains generatedCvMarkdown
});
