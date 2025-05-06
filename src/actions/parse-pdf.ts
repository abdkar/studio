
'use server';

import { z } from 'zod';
// Dynamic import handles type inference, no need for static import type

const PdfParseResultSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(), // Allow error message even on success (e.g., empty text extraction)
});

type PdfParseResult = z.infer<typeof PdfParseResultSchema>;

const MAX_FILE_SIZE_MB = 10; // Set a reasonable file size limit (e.g., 10MB)
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

  console.log(`[parsePdfAction] Received file: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

  if (file.type !== 'application/pdf') {
     console.error(`[parsePdfAction] Invalid file type: ${file.type}`);
    return { success: false, error: 'Invalid file type. Only PDF is supported for automatic extraction.' };
  }

   // Check file size
   if (file.size > MAX_FILE_SIZE_BYTES) {
     console.error(`[parsePdfAction] File size exceeds limit: ${file.size} bytes > ${MAX_FILE_SIZE_BYTES} bytes`);
     return { success: false, error: `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.` };
   }

   let pdfParser: any; // Keep pdfParser in broader scope for logging

  try {
    // Dynamically import pdf-parse only when the function is executed
    console.log('[parsePdfAction] Attempting to dynamically import pdf-parse...');
    pdfParser = (await import('pdf-parse')).default;
    if (!pdfParser) {
        throw new Error('pdf-parse module could not be loaded dynamically.');
    }
    console.log('[parsePdfAction] pdf-parse imported successfully.');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[parsePdfAction] Parsing PDF: ${file.name}, Buffer size: ${buffer.length} bytes`);

    // Now call the dynamically imported function
    let data;
    try {
        data = await pdfParser(buffer); // Call the pdf-parse function
    } catch (parseError) {
         console.error(`[parsePdfAction] Error *during* pdfParser execution for file ${file.name}:`, parseError);
         // Provide a more specific error if pdf-parse itself throws an error
         if (parseError instanceof Error) {
             return { success: false, error: `PDF parsing failed: ${parseError.message}. The file might be corrupted or password-protected.` };
         }
         return { success: false, error: 'PDF parsing failed due to an internal library error. The file might be corrupted or password-protected.' };
    }


    console.log(`[parsePdfAction] PDF parsed. Pages: ${data.numpages}, Raw Text length: ${data.text?.length ?? 0}`);

    const extractedText = data.text?.trim() ?? '';
    // Basic check for meaningful text extraction
    if (extractedText.length === 0) {
        console.warn(`[parsePdfAction] PDF parsing resulted in empty or whitespace-only text. File: ${file.name}, Pages: ${data.numpages}`);
        // Still return success as the parsing itself didn't fail, but the content might be empty/unparsable image-only PDF.
        return { success: true, text: '', error: 'PDF parsed, but no text content was extracted. The PDF might be image-based, empty, or password-protected.' };
    }

    console.log(`[parsePdfAction] Successfully extracted text (trimmed length: ${extractedText.length}). Returning success.`);
    return { success: true, text: extractedText }; // Return trimmed text
  } catch (error) {
    // Log the full error for server-side debugging
    console.error('[parsePdfAction] Error during PDF parsing process (outer catch):', error); // Detailed log

    let clientErrorMessage = 'PDF parsing failed due to an unexpected server error.';

    // Check if the error is the specific ENOENT error potentially related to library loading
     if (error instanceof Error && error.message.includes('ENOENT') && error.message.includes('test/data')) {
       console.error('[parsePdfAction] Specific Error: pdf-parse failed to load/execute correctly, possibly due to bundling/environment issue.', error);
       clientErrorMessage = 'PDF parsing library encountered an internal issue. Check server logs.';
    } else if (error instanceof Error && error.message.includes('pdf-parse module could not be loaded')) {
        clientErrorMessage = 'Failed to load the PDF parsing library on the server.';
    } else if (error instanceof Error) {
        const limitedMessage = error.message.substring(0, 100) + (error.message.length > 100 ? '...' : '');
        clientErrorMessage = `PDF parsing failed. Please ensure the file is a valid, unencrypted PDF. (Details: ${limitedMessage})`;
        console.error(`[parsePdfAction] Caught specific error type: ${error.name}, Message: ${error.message}`);
    } else {
        console.error('[parsePdfAction] Caught non-Error object during parsing:', error);
    }

    // Ensure a valid object matching the schema is always returned
    return { success: false, error: clientErrorMessage, text: undefined };
  }
}
