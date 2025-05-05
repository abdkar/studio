'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Download, FileText, FileType, Loader2, Mail } from 'lucide-react'; // Added FileType, Loader2
import { useToast } from '@/hooks/use-toast';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'; // Import Font

type GeneratedCoverLetterDisplayProps = {
  coverLetterText: string | null;
  isLoading: boolean;
  error: string | null;
};


// --- PDF Styling ---
// Register standard fonts (optional but recommended for consistency)
// Note: @react-pdf/renderer uses fontkit. Ensure fonts are accessible.
// Using standard PDF fonts like Times-Roman is safer if embedding isn't set up.
// Font.register({
//   family: 'Times-Roman',
//   src: 'path/to/times.ttf', // You'd need to host font files or use system fonts if allowed
// });
// Font.register({
//   family: 'Times-Bold',
//    src: 'path/to/timesbd.ttf',
// });

const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman', // Standard PDF font
    fontSize: 11,
    paddingTop: 40, // Increased padding
    paddingLeft: 60, // Increased padding
    paddingRight: 60, // Increased padding
    paddingBottom: 40, // Increased padding
    lineHeight: 1.5,
    color: '#333333', // Default text color
  },
  section: {
    marginBottom: 10,
  },
  addressBlock: {
    textAlign: 'left',
    marginBottom: 20,
  },
  body: {
    textAlign: 'justify', // Justify body text
  },
  paragraph: {
    marginBottom: 12, // Slightly increased paragraph spacing
  },
  closing: {
    marginTop: 20,
  },
  signature: {
    marginTop: 4, // Reduced space before typed name
  },
  bold: {
    fontFamily: 'Times-Bold', // Use Times-Bold variant
  },
  placeholder: {
     color: '#888888', // Lighter color for placeholders
     fontStyle: 'italic',
   },
});

// --- PDF Document Component ---
const CoverLetterPdfDocument = ({ text }: { text: string | null }) => {

    // Handle null text gracefully
    if (!text) {
        return (
            <Document title="Cover Letter">
                <Page size="A4" style={pdfStyles.page}>
                    <View style={pdfStyles.body}>
                        <Text style={pdfStyles.placeholder}>Error: No cover letter content available.</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    // Basic parsing attempt - This is very fragile and depends heavily on the LLM output format.
    const lines = text.split('\n');
    const dateRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/i; // Case-insensitive
    const salutationRegex = /^Dear\s+(.*?),?$/i; // Case-insensitive
    const closingRegex = /^(Sincerely|Regards|Yours faithfully|Yours truly),?$/i; // Case-insensitive

    let recipientInfo: string[] = [];
    let dateLine: string | null = null;
    let salutationLine: string | null = null;
    let bodyParagraphs: string[] = [];
    let closingLine: string | null = null;
    let signatureLine: string | null = null;

    let currentState: 'start' | 'recipientOrDate' | 'salutation' | 'body' | 'closing' | 'signature' = 'start';
    let currentParagraph = '';

    // Slightly improved state machine for parsing
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Handle blank lines - they usually separate paragraphs or sections
        if (!line) {
            if (currentParagraph && currentState === 'body') {
                bodyParagraphs.push(currentParagraph);
                currentParagraph = '';
            }
            // Don't change state on blank lines necessarily, just use them as separators
            continue;
        }

        switch (currentState) {
            case 'start':
                // First non-blank lines could be recipient info or date
                 if (dateRegex.test(line)) {
                     dateLine = line;
                     currentState = 'salutation'; // Expect salutation after date
                 } else if (salutationRegex.test(line)) {
                    // Allow skipping recipient/date if salutation comes first
                    salutationLine = line;
                    currentState = 'body';
                 } else if (i < 5) { // Assume first few lines might be recipient
                    recipientInfo.push(line);
                    // Stay in 'recipientOrDate' state implicitly by not changing
                 } else {
                     // If we have many lines and haven't found date/salutation, assume body starts
                     currentState = 'body';
                     currentParagraph += (currentParagraph ? '\n' : '') + line; // Start body
                 }
                break;

            case 'recipientOrDate': // Implicitly handled by continuing 'start' logic or moving to 'salutation'/'body'
                 if (dateRegex.test(line)) {
                     dateLine = line;
                     currentState = 'salutation';
                 } else if (salutationRegex.test(line)) {
                    salutationLine = line;
                    currentState = 'body';
                 } else if (i < 5) { // Continue adding recipient info
                     recipientInfo.push(line);
                 } else {
                    currentState = 'body';
                    currentParagraph += (currentParagraph ? '\n' : '') + line;
                 }
                break;


            case 'salutation':
                if (salutationRegex.test(line)) {
                    salutationLine = line;
                    currentState = 'body';
                } else {
                    // If salutation wasn't found immediately after date, assume body starts
                    currentState = 'body';
                    currentParagraph += (currentParagraph ? '\n' : '') + line;
                }
                break;

            case 'body':
                if (closingRegex.test(line)) {
                    if (currentParagraph) bodyParagraphs.push(currentParagraph);
                    currentParagraph = '';
                    closingLine = line;
                    currentState = 'signature';
                } else {
                    // Append line to current paragraph, handle paragraph breaks via blank lines (handled above)
                     currentParagraph += (currentParagraph ? ' ' : '') + line;
                }
                break;

            case 'closing': // Transition happens within 'body' state check
                break;

            case 'signature':
                if (!signatureLine) { // Capture the first line after the closing as the signature
                    signatureLine = line;
                }
                // Allow multiple lines in signature block? For now, just capture the first.
                // Stop parsing after the first signature line is found? Or let it continue? Stop for now.
                 // break; // Uncomment to stop reading after signature line
                break;
        }
    }
     // Add any remaining paragraph content if the loop finished while in the body state
     if (currentParagraph && currentState === 'body') {
        bodyParagraphs.push(currentParagraph);
    }

    // --- Fallback Logic ---
     // Check if parsing produced *any* structure. If not, render raw text.
     const isParsingSuccessful = recipientInfo.length > 0 || dateLine || salutationLine || bodyParagraphs.length > 0 || closingLine || signatureLine;
     const fallbackText = !isParsingSuccessful ? text : null; // Use raw text only if NO structure was parsed


  return (
    <Document title="Cover Letter">
      <Page size="A4" style={pdfStyles.page}>
        {fallbackText ? (
           // --- Render Raw Text Fallback ---
            <View style={pdfStyles.body}>
                {fallbackText.split('\n').map((line, index) => (
                     <Text key={`fallback-${index}`} style={pdfStyles.paragraph}>{line || ' '}</Text> // Render blank lines too
                ))}
            </View>
        ) : (
           // --- Render Parsed Structure ---
            <>
                {recipientInfo.length > 0 && (
                     <View style={pdfStyles.addressBlock}>
                        {recipientInfo.map((line, index) => <Text key={`recipient-${index}`}>{line}</Text>)}
                    </View>
                )}

                {dateLine && (
                    <View style={pdfStyles.addressBlock}>
                        <Text>{dateLine}</Text>
                    </View>
                )}

                 {/* Add space if recipient or date exists before salutation */}
                 {(recipientInfo.length > 0 || dateLine) && salutationLine && <View style={{marginBottom: 10}} />}

                {salutationLine && (
                     <View style={pdfStyles.section}>
                         <Text>{salutationLine}</Text>
                    </View>
                )}


                <View style={pdfStyles.body}>
                  {bodyParagraphs.map((paragraph, index) => (
                    <Text key={`p-${index}`} style={pdfStyles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>

                 {closingLine && (
                    <View style={pdfStyles.closing}>
                        <Text>{closingLine}</Text>
                    </View>
                )}
                {signatureLine && (
                     <View style={pdfStyles.signature}>
                         <Text>{signatureLine}</Text>
                    </View>
                )}
                {/* Placeholder if signature not parsed but closing exists */}
                {!signatureLine && closingLine && (
                    <View style={pdfStyles.signature}>
                         <Text style={pdfStyles.placeholder}>[Your Typed Name]</Text>
                    </View>
                )}
            </>
        )}
      </Page>
    </Document>
  );
};

// --- Main Component ---
export function GeneratedCoverLetterDisplay({ coverLetterText, isLoading, error }: GeneratedCoverLetterDisplayProps) {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  // Ensure PDFDownloadLink only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCopy = () => {
    if (coverLetterText) {
      navigator.clipboard.writeText(coverLetterText)
        .then(() => {
          toast({ title: "Copied to Clipboard", description: "Generated cover letter text copied successfully." });
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
          toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy cover letter text to clipboard." });
        });
    }
  };

  const handleDownloadTxt = () => {
    if (coverLetterText) {
      const blob = new Blob([coverLetterText], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'cover_letter.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Download Started", description: "Downloading cover letter as cover_letter.txt." });
    }
  };

   // Handle Word and LaTeX (Placeholders - require server-side conversion or complex libraries)
  const handleDownloadDocx = () => {
    toast({ variant: "default", title: "Feature Not Implemented", description: "Word (.docx) download requires server-side processing and is not yet available." });
     // Placeholder: Future implementation would involve sending `coverLetterText`
     // to a backend endpoint that uses a library like mammoth.js or pandoc
     // to convert text/Markdown to DOCX.
  };

  const handleDownloadTex = () => {
     toast({ variant: "default", title: "Feature Not Implemented", description: "LaTeX (.tex) download requires server-side processing or complex formatting and is not yet available." });
     // Placeholder: Future implementation might involve sending text to a backend
     // or using a sophisticated JS library to generate basic LaTeX structure.
  };

  if (isLoading) {
    return (
      <Card className="shadow-md animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex justify-end flex-wrap gap-2">
             <Skeleton className="h-10 w-28" /> {/* Copy */}
             <Skeleton className="h-10 w-36" /> {/* TXT */}
             <Skeleton className="h-10 w-36" /> {/* PDF */}
             <Skeleton className="h-10 w-36" /> {/* DOCX */}
             <Skeleton className="h-10 w-36" /> {/* TEX */}
           </div>
          <Skeleton className="h-64 w-full border rounded-md p-4" /> {/* Preview area */}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Cover Letter Generation Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Do not render card if there's no cover letter text AND it's not loading AND there's no error
  if (!coverLetterText && !isLoading && !error) {
    return null;
  }


  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
           <Mail className="h-6 w-6 text-primary" /> Generated Cover Letter
        </CardTitle>
        <CardDescription>
          Review the generated cover letter text below. You can copy or download it in various formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="flex justify-end flex-wrap gap-2">
            {/* --- Action Buttons --- */}
             {/* Buttons are only enabled if coverLetterText is not null */}
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!coverLetterText}>
                <Copy className="mr-2 h-4 w-4" /> Copy Text
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt} disabled={!coverLetterText}>
                <FileText className="mr-2 h-4 w-4" /> Download (.txt)
            </Button>
            {/* PDF Download Button - Rendered only on client, disabled if no text */}
            {isClient ? (
                 // Render the link only if coverLetterText exists
                 coverLetterText ? (
                     <PDFDownloadLink
                         document={<CoverLetterPdfDocument text={coverLetterText} />}
                         fileName="cover_letter.pdf"
                     >
                         {({ loading }) => (
                             <Button variant="outline" size="sm" disabled={loading}>
                                 {loading ? (
                                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                 ) : (
                                     <Download className="mr-2 h-4 w-4" />
                                 )}
                                 Download (.pdf)
                             </Button>
                         )}
                     </PDFDownloadLink>
                 ) : (
                      <Button variant="outline" size="sm" disabled>
                          <Download className="mr-2 h-4 w-4" /> Download (.pdf)
                      </Button>
                 )
             ) : (
                 <Button variant="outline" size="sm" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading PDF...
                 </Button>
             )}
             <Button variant="outline" size="sm" onClick={handleDownloadDocx} disabled> {/* Disabled for now */}
                <FileType className="mr-2 h-4 w-4" /> Download (.docx)
             </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadTex} disabled> {/* Disabled for now */}
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-filetype-tex mr-2" viewBox="0 0 16 16"><path fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v.9h1.6v1.48h.87v-1.48h1.6v-.9h-1.6V10.3h-.87zM5.56 11.8h-.85v2.14h.85zM7.91 14h.87v-1.48h1.6v-.9h-1.6v-.68h.85v-.9H7.91zm4.08 0h.87v-1.48h1.6v-.9h-1.6v-.68h.85v-.9h-2.47v3.96z"/></svg>
                 Download (.tex)
             </Button>
          </div>


        {/* Display the cover letter text in a styled preview area */}
        <div
          className="min-h-[400px] resize-y overflow-auto border rounded-md p-4 bg-white text-foreground font-serif text-sm leading-relaxed shadow-inner" // Using serif font for letter feel
          aria-label="Generated Cover Letter Preview"
        >
           {/* Render text with preserved line breaks or a placeholder */}
            {coverLetterText ? (
                coverLetterText.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))
            ) : (
                 <p className="text-muted-foreground italic">No cover letter generated yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
