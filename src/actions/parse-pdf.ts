'use server';

import { z } from 'zod';
// We don't need a static type import if we infer from the dynamic import later

const PdfParseResultSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
});

type PdfParseResult = z.infer<typeof PdfParseResultSchema>;

/**
 * Parses a PDF file from FormData and extracts its text content.
 * Uses dynamic import for pdf-parse to avoid potential issues during static module loading.
 * @param formData The FormData containing the PDF file under the key 'pdfFile'.
 * @returns An object containing the success status, extracted text, or an error message.
 */
export async function parsePdfAction(formData: FormData): Promise<PdfParseResult> {
  const file = formData.get('pdfFile') as File | null;

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  if (file.type !== 'application/pdf') {
    return { success: false, error: 'Invalid file type. Only PDF is supported.' };
  }

  try {
    // Dynamically import pdf-parse only when the function is executed
    const pdfParser = (await import('pdf-parse')).default;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Now call the dynamically imported function
    const data = await pdfParser(buffer);

    // Basic check for meaningful text extraction
    if (!data.text || data.text.trim().length === 0) {
        console.warn("PDF parsing resulted in empty or whitespace-only text.", {fileName: file.name, pages: data.numpages});
        // Still return success as the parsing itself didn't fail, but the content might be empty.
    }

    return { success: true, text: data.text };
  } catch (error) {
    console.error('Error during PDF parsing process:', error);

    // Check if the error is the specific ENOENT error potentially related to library loading
    if (error instanceof Error && error.message.includes('ENOENT') && error.message.includes('test/data')) {
       console.error('Specific Error: pdf-parse failed to load/execute correctly, possibly due to bundling/environment issue.', error);
       // Return a more user-friendly error in this specific case
       return { success: false, error: 'PDF parsing library encountered an internal issue. Please try again later or ensure the PDF is valid.' };
    }

    // Handle other general errors
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during PDF parsing.';
    return { success: false, error: `PDF parsing failed: ${errorMessage}` };
  }
}
