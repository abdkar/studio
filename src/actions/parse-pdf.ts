'use server';

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
 * Uses dynamic import for pdf-parse and robust error handling.
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
    // Dynamically import pdf-parse
    console.log('[parsePdfAction] Attempting to dynamically import pdf-parse...');
    const pdfParseModule = await import('pdf-parse');
    console.log('[parsePdfAction] pdf-parse module imported. Type:', typeof pdfParseModule, 'Keys:', pdfParseModule ? Object.keys(pdfParseModule) : 'null');

    let pdfParserFn;
    if (typeof pdfParseModule.default === 'function') {
        pdfParserFn = pdfParseModule.default;
        console.log('[parsePdfAction] Using pdfParseModule.default as the parser function.');
    } else if (typeof pdfParseModule === 'function') {
        // This case might occur if the module is directly the function (e.g. CJS style imported via ESM import)
        pdfParserFn = pdfParseModule;
        console.log('[parsePdfAction] Using the imported module itself as the parser function.');
    } else {
        console.error('[parsePdfAction] pdf-parse module or its default export is not a function.', pdfParseModule);
        // This error will be caught by the outer catch block
        throw new Error('PDF parsing library (pdf-parse) could not be loaded correctly.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[parsePdfAction] Parsing PDF: ${file.name}, Buffer size: ${buffer.length} bytes with the resolved parser function.`);

    let data;
    try {
        data = await pdfParserFn(buffer);
    } catch (parseError) {
         // Log the raw error object to the server console for detailed diagnostics
         console.error(`[parsePdfAction] Error *during* actual PDF parsing execution for file ${file.name}. Type of error: ${typeof parseError}, Error object:`, parseError);

         let clientFriendlyMessage = 'PDF parsing failed internally. The file might be corrupted, password-protected, or incompatible with the parser.';
         if (parseError instanceof Error) {
             clientFriendlyMessage = `PDF parsing error: ${parseError.message}. Please check if the file is valid.`;
         } else if (typeof parseError === 'string') {
             clientFriendlyMessage = `PDF parsing error: ${parseError}. Please check if the file is valid.`;
         } else if (parseError && typeof (parseError as any).message === 'string') {
             clientFriendlyMessage = `PDF parsing error: ${(parseError as any).message}. Please check if the file is valid.`;
         }
         // If it's none of the above, the generic message set initially is used.
         return { success: false, error: clientFriendlyMessage };
    }

    console.log(`[parsePdfAction] PDF parsed. Pages: ${data.numpages}, Raw Text length: ${data.text?.length ?? 0}`);

    const extractedText = data.text?.trim() ?? '';
    if (extractedText.length === 0) {
        console.warn(`[parsePdfAction] PDF parsing resulted in empty or whitespace-only text. File: ${file.name}, Pages: ${data.numpages}`);
        return { success: true, text: '', error: 'PDF parsed, but no text content was extracted. The PDF might be image-based, empty, or password-protected.' };
    }

    console.log(`[parsePdfAction] Successfully extracted text (trimmed length: ${extractedText.length}). Returning success.`);
    return { success: true, text: extractedText };
  } catch (error) {
    console.error('[parsePdfAction] Error during PDF parsing process (outer catch):', error);

    let clientErrorMessage = 'PDF parsing failed due to an unexpected server error.';
    if (error instanceof Error) {
        if (error.message.includes('pdf-parse module could not be loaded') || error.message.includes('PDF parsing library (pdf-parse) could not be loaded correctly')) {
          clientErrorMessage = 'Failed to load the PDF parsing library on the server. Please contact support.';
        } else if (error.message.includes('ENOENT')) {
          clientErrorMessage = 'PDF parsing library encountered an file system issue. Check server logs.';
        } else {
          const limitedMessage = error.message.substring(0, 150) + (error.message.length > 150 ? '...' : '');
          clientErrorMessage = `PDF processing error: ${limitedMessage}. Please try again or use a different file.`;
        }
         console.error(`[parsePdfAction] Caught specific error type: ${error.name}, Message: ${error.message}`);
    } else {
        console.error('[parsePdfAction] Caught non-Error object during parsing process (outer catch):', error);
    }
    return { success: false, error: clientErrorMessage, text: undefined };
  }
}
