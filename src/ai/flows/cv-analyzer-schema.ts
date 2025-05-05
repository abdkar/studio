
/**
 * @fileOverview Defines the Zod schema for the output of the CV analysis flow.
 * This is separated to allow importing without circular dependencies.
 *
 * - AnalyzeCvOutputSchema - Zod schema for the analysis results.
 */
import { z } from 'genkit';

// Define the output schema in a separate file
export const AnalyzeCvOutputSchema = z.object({
  matchPercentage: z.number().min(0).max(100).describe('The overall percentage of how well the CV matches the job description.'),
  scoreBreakdown: z.object({
    experience: z.number().min(0).max(100).describe('Match percentage for Experience alignment (0-100).'),
    education: z.number().min(0).max(100).describe('Match percentage for Education alignment (0-100).'),
    skills: z.number().min(0).max(100).describe('Match percentage for Skills and Expertise alignment (0-100).'),
  }).describe('Breakdown of the match score by category.'),
  suggestions: z.object({
    keywordsToAdd: z.array(z.string()).describe('Keywords to add to the CV.'),
    skillsToEmphasize: z.array(z.string()).describe('Skills to emphasize in the CV.'),
    experienceToDetail: z.string().describe('Experience to detail in the CV.'),
  }).describe('Suggestions on how to improve the CV.'),
});

// Note: The type 'AnalyzeCvOutput' is still defined and exported from 'cv-analyzer.ts'
// using `z.infer<typeof AnalyzeCvOutputSchema>`. This file only exports the schema itself.
