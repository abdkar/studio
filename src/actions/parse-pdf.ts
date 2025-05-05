'use server';

import pdf from 'pdf-parse';
import { z } from 'zod';

const PdfParseResultSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
});

type PdfParseResult = z.infer<typeof PdfParseResultSchema>;

/**
 * Parses a PDF file from FormData and extracts its text content.
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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdf(buffer);

    // Basic check for meaningful text extraction
    if (!data.text || data.text.trim().length === 0) {
        console.warn("PDF parsing resulted in empty or whitespace-only text.", {fileName: file.name, pages: data.numpages});
        // Return success but maybe indicate potential issue or let validation handle it
        // For now, return the (empty) text. Consider adding a specific error/warning later if needed.
    }

    return { success: true, text: data.text };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during PDF parsing.';
    return { success: false, error: `PDF parsing failed: ${errorMessage}` };
  }
}
