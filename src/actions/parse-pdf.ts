'use server';

import { z } from 'zod';
// Dynamic import handles type inference, no need for static import type

const PdfParseResultSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(), // Allow error message even on success (e.g., empty text extraction)
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
    console.log('Attempting to dynamically import pdf-parse...');
    const pdfParser = (await import('pdf-parse')).default;
    console.log('pdf-parse imported successfully.');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`Parsing PDF: ${file.name}, size: ${buffer.length} bytes`);
    // Now call the dynamically imported function
    const data = await pdfParser(buffer);
    console.log(`PDF parsed. Pages: ${data.numpages}, Text length: ${data.text?.length ?? 0}`);


    // Basic check for meaningful text extraction
    if (!data.text || data.text.trim().length === 0) {
        console.warn("PDF parsing resulted in empty or whitespace-only text.", {fileName: file.name, pages: data.numpages});
        // Still return success as the parsing itself didn't fail, but the content might be empty/unparsable image-only PDF.
        // Let the user know the text might be missing by returning an error message alongside success:true.
        return { success: true, text: data.text, error: 'PDF parsed, but no text content was extracted. The PDF might be image-based or empty.' };
    }

    return { success: true, text: data.text };
  } catch (error) {
    // Log the full error for server-side debugging
    console.error('Error during PDF parsing process:', error);

    // Check if the error is the specific ENOENT error potentially related to library loading
     if (error instanceof Error && error.message.includes('ENOENT') && error.message.includes('test/data')) {
       console.error('Specific Error: pdf-parse failed to load/execute correctly, possibly due to bundling/environment issue.', error);
       // Return a more user-friendly error in this specific case
       return { success: false, error: 'PDF parsing library encountered an internal issue. The PDF might be invalid or corrupted.' };
    }

    // Provide a generic but informative error to the client
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    // Avoid exposing potentially sensitive details from the raw error message to the client.
    // Limit the length of the exposed error message details.
    const clientErrorMessage = `PDF parsing failed. Please ensure the file is a valid PDF. (Details: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''})`;
    return { success: false, error: clientErrorMessage };
  }
}
