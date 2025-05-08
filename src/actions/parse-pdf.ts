'use server';

import pdf from 'pdf-parse'; // Static import for pdf-parse
import { z } from 'zod';

const PdfParseResultSchema = z.object({
  success: z.boolean(),
  text: z.string().optional(),
  error: z.string().optional(),
});

type PdfParseResult = z.infer<typeof PdfParseResultSchema>;

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Parses a PDF file from FormData and extracts its text content.
 * Uses static import for pdf-parse and robust error handling.
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

   if (file.size > MAX_FILE_SIZE_BYTES) {
     console.error(`[parsePdfAction] File size exceeds limit: ${file.size} bytes > ${MAX_FILE_SIZE_BYTES} bytes`);
     return { success: false, error: `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.` };
   }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[parsePdfAction] Parsing PDF: ${file.name}, Buffer size: ${buffer.length} bytes with static parser function.`);
    console.log(`[parsePdfAction] CWD (current working directory) on server: ${process.cwd()}`);


    let data;
    try {
        // Use the statically imported pdf function directly
        data = await pdf(buffer);
    } catch (parseError) {
         // Log the raw error object to the server console for detailed diagnostics
         console.error(`[parsePdfAction] Error *during* actual PDF parsing execution for file ${file.name}. Type of error: ${typeof parseError}, Error object:`, parseError);

         let clientFriendlyMessage = 'PDF parsing failed internally. The file might be corrupted, password-protected, or incompatible with the parser.';
         if (parseError instanceof Error) {
            if (parseError.message.includes('ENOENT') && parseError.message.includes('test/data')) {
                clientFriendlyMessage = 'PDF parsing library failed: it seems to be trying to access internal test files. This often indicates an issue with the library setup in the current server environment, possibly related to its native dependencies. Check server logs for the exact path.';
                console.error(`[parsePdfAction] Critical: pdf-parse is attempting to access its own test data files (path likely similar to './test/data/...'). This indicates a deeper configuration or environment compatibility issue with pdf-parse or its native dependencies (like pdftotext). Raw error: ${parseError.message}`);
            } else if (parseError.message.includes('ENOENT')) {
                clientFriendlyMessage = 'PDF parsing library encountered an unexpected file system issue during parsing. Check server logs.';
            } else {
                // Truncate potentially long messages from the library
                const truncatedMessage = parseError.message.length > 200 ? parseError.message.substring(0, 200) + '...' : parseError.message;
                clientFriendlyMessage = `PDF parsing error: ${truncatedMessage}. Please check if the file is valid.`;
            }
         } else if (typeof parseError === 'string') {
             clientFriendlyMessage = `PDF parsing error: ${parseError}. Please check if the file is valid.`;
         } else if (parseError && typeof (parseError as any).message === 'string') {
             clientFriendlyMessage = `PDF parsing error: ${(parseError as any).message}. Please check if the file is valid.`;
         }
         return { success: false, error: clientFriendlyMessage };
    }

    console.log(`[parsePdfAction] PDF parsed. Pages: ${data.numpages}, Raw Text length: ${data.text?.length ?? 0}`);

    const extractedText = data.text?.trim() ?? '';
    if (extractedText.length === 0) {
        console.warn(`[parsePdfAction] PDF parsing resulted in empty or whitespace-only text. File: ${file.name}, Pages: ${data.numpages}`);
        // Check if the PDF actually had pages; if numpages is 0, it's more likely an invalid PDF.
        if (data.numpages === 0) {
            return { success: false, text: '', error: 'PDF parsed, but it appears to have no pages or is invalid. Please check the file.' };
        }
        return { success: true, text: '', error: 'PDF parsed, but no text content was extracted. The PDF might be image-based, empty, or password-protected.' };
    }

    console.log(`[parsePdfAction] Successfully extracted text (trimmed length: ${extractedText.length}). Returning success.`);
    return { success: true, text: extractedText };

  } catch (error) { // Outer catch for issues like buffer conversion or library loading
    console.error('[parsePdfAction] Error during PDF parsing process (outer catch):', error);

    let clientErrorMessage = 'PDF parsing failed due to an unexpected server error.';
    if (error instanceof Error) {
        // Check for ENOENT here if it bubbles up to the outer catch
        if (error.message.includes('ENOENT')) {
          clientErrorMessage = 'PDF parsing library encountered a file system issue (outer catch). Check server logs.';
        } else {
          const limitedMessage = error.message.substring(0, 150) + (error.message.length > 150 ? '...' : '');
          clientErrorMessage = `PDF processing error: ${limitedMessage}. Please try again or use a different file.`;
        }
         console.error(`[parsePdfAction] Caught specific error type in outer catch: ${error.name}, Message: ${error.message}`);
    } else {
        console.error('[parsePdfAction] Caught non-Error object during parsing process (outer catch):', error);
    }
    return { success: false, error: clientErrorMessage, text: undefined };
  }
}
