
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

  console.log('[parsePdfAction] Received request.');

  if (!file) {
    console.error('[parsePdfAction] No file provided in FormData.');
    return { success: false, error: 'No file provided.' };
  }

  console.log(`[parsePdfAction] Received file: ${file.name}, Type: ${file.type}, Size: ${file.size}`);

  if (file.type !== 'application/pdf') {
     console.error(`[parsePdfAction] Invalid file type: ${file.type}`);
    return { success: false, error: 'Invalid file type. Only PDF is supported.' };
  }

  try {
    // Dynamically import pdf-parse only when the function is executed
    console.log('[parsePdfAction] Attempting to dynamically import pdf-parse...');
    const pdfParser = (await import('pdf-parse')).default;
    console.log('[parsePdfAction] pdf-parse imported successfully.');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[parsePdfAction] Parsing PDF: ${file.name}, Buffer size: ${buffer.length} bytes`);
    // Now call the dynamically imported function
    const data = await pdfParser(buffer);
    console.log(`[parsePdfAction] PDF parsed. Pages: ${data.numpages}, Raw Text length: ${data.text?.length ?? 0}`);


    const extractedText = data.text?.trim() ?? '';
    // Basic check for meaningful text extraction
    if (extractedText.length === 0) {
        console.warn(`[parsePdfAction] PDF parsing resulted in empty or whitespace-only text. File: ${file.name}, Pages: ${data.numpages}`);
        // Still return success as the parsing itself didn't fail, but the content might be empty/unparsable image-only PDF.
        return { success: true, text: '', error: 'PDF parsed, but no text content was extracted. The PDF might be image-based or empty.' };
    }

    console.log(`[parsePdfAction] Successfully extracted text (trimmed length: ${extractedText.length}). Returning success.`);
    return { success: true, text: extractedText }; // Return trimmed text
  } catch (error) {
    // Log the full error for server-side debugging
    console.error('[parsePdfAction] Error during PDF parsing process:', error); // Detailed log

    let clientErrorMessage = 'PDF parsing failed due to an unexpected server error.';

    // Check if the error is the specific ENOENT error potentially related to library loading
     if (error instanceof Error && error.message.includes('ENOENT') && error.message.includes('test/data')) {
       console.error('[parsePdfAction] Specific Error: pdf-parse failed to load/execute correctly, possibly due to bundling/environment issue.', error);
       // Return a more user-friendly error in this specific case
       clientErrorMessage = 'PDF parsing library encountered an internal issue. The PDF might be invalid or corrupted.';
    } else if (error instanceof Error) {
        // Provide a generic but slightly more informative error to the client
        // Avoid exposing potentially sensitive details from the raw error message.
        const limitedMessage = error.message.substring(0, 100) + (error.message.length > 100 ? '...' : '');
        clientErrorMessage = `PDF parsing failed. Please ensure the file is a valid PDF. (Details: ${limitedMessage})`;
        console.error(`[parsePdfAction] Caught specific error type: ${error.name}, Message: ${error.message}`);
    } else {
        // Handle non-Error types if necessary
        console.error('[parsePdfAction] Caught non-Error object during parsing:', error);
    }

    // Ensure a valid object matching the schema is always returned
    return { success: false, error: clientErrorMessage, text: undefined };
  }
}
