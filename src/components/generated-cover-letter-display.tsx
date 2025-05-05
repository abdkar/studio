{'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Download, FileText, FileType, Loader2, Mail } from 'lucide-react'; // Added FileType, Loader2
import { useToast } from '@/hooks/use-toast';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type GeneratedCoverLetterDisplayProps = {
  coverLetterText: string | null;
  isLoading: boolean;
  error: string | null;
};

// --- PDF Styling ---
const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman', // Standard font
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 50,
    paddingRight: 50,
    paddingBottom: 30,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 10,
  },
  header: {
    textAlign: 'right',
    marginBottom: 20,
  },
  addressBlock: {
    textAlign: 'left',
    marginBottom: 20,
  },
  body: {
    textAlign: 'justify',
  },
  paragraph: {
    marginBottom: 10,
  },
  closing: {
    marginTop: 20,
  },
  signature: {
    marginTop: 10,
  },
  bold: {
    fontFamily: 'Times-Bold',
  }
});

// --- PDF Document Component ---
const CoverLetterPdfDocument = ({ text }: { text: string }) => {
    // Basic parsing attempt - This is very fragile and depends heavily on the LLM output format.
    // A more robust solution would involve a more structured output from the LLM.
    const lines = text.split('\n');
    const dateRegex = /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}$/;
    const salutationRegex = /^Dear\s+(.*?),?$/;
    const closingRegex = /^(Sincerely|Regards|Yours faithfully|Yours truly),?$/;

    let contactInfo: string[] = [];
    let recipientInfo: string[] = [];
    let dateLine: string | null = null;
    let salutationLine: string | null = null;
    let bodyParagraphs: string[] = [];
    let closingLine: string | null = null;
    let signatureLine: string | null = null;

    let currentState: 'start' | 'contact' | 'recipient' | 'date' | 'salutation' | 'body' | 'closing' | 'signature' = 'start';
    let currentParagraph = '';

    // Simple state machine to parse structure (highly simplified)
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line) {
            if (currentParagraph) {
                bodyParagraphs.push(currentParagraph);
                currentParagraph = '';
            }
            if (currentState === 'body') currentState = 'body'; // Stay in body if blank line within
            continue; // Skip blank lines
        }

        if (currentState === 'start' && !dateRegex.test(line) && !salutationRegex.test(line) && line.length > 5) { // Assume first few non-empty lines are contact/recipient
           if (i < 5) recipientInfo.push(line); // Guessing first few lines are recipient
           else currentState = 'date'; // Move on if too many lines
           continue;
        }

        if (dateRegex.test(line)) {
            dateLine = line;
            currentState = 'salutation';
            continue;
        }

         if (salutationRegex.test(line)) {
            salutationLine = line;
            currentState = 'body';
            continue;
        }

        if (currentState === 'body' && closingRegex.test(line)) {
             if (currentParagraph) bodyParagraphs.push(currentParagraph);
             currentParagraph = '';
             closingLine = line;
             currentState = 'signature';
             continue;
        }

        if (currentState === 'body') {
           currentParagraph += (currentParagraph ? ' ' : '') + line;
           // Add paragraph break heuristics if needed, e.g., based on indentation or sentence end.
           // For now, just concatenate lines until a blank line or closing.
           continue;
        }

        if (currentState === 'signature') {
            signatureLine = line; // Assume the line after closing is the signature name
            break; // Stop parsing after signature
        }
    }
     // Add any remaining paragraph
     if (currentParagraph && currentState === 'body') {
        bodyParagraphs.push(currentParagraph);
    }
     // If parsing failed, fall back to rendering the whole text as body
     if (bodyParagraphs.length === 0 && !closingLine) {
        bodyParagraphs = lines.filter(l => l.trim().length > 0);
     }


  return (
    <Document title="Cover Letter">
      <Page size="A4" style={pdfStyles.page}>
        {/* Simple placeholder for contact info - Improve if LLM provides it structured */}
        {/* <View style={pdfStyles.header}>
            <Text style={pdfStyles.bold}>[Your Name]</Text>
            <Text>[Your Address]</Text>
            <Text>[Your Phone]</Text>
            <Text>[Your Email]</Text>
        </View> */}

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
        {/* Fallback if signature not parsed */}
        {!signatureLine && closingLine && (
            <View style={pdfStyles.signature}>
                 <Text>[Your Typed Name]</Text>
            </View>
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

  if (!coverLetterText) {
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
            <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" /> Copy Text
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt}>
                <FileText className="mr-2 h-4 w-4" /> Download (.txt)
            </Button>
            {/* PDF Download Button - Rendered only on client */}
            {isClient ? (
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
           {/* Render text with preserved line breaks */}
           {coverLetterText.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
