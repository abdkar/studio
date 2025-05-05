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

// --- PDF Document Component (Simplified for Debugging) ---
const CoverLetterPdfDocument = ({ text }: { text: string | null }) => {
  return (
    <Document title="Cover Letter">
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.body}>
          {text ? (
            // Simple rendering of text split by newlines
            text.split('\n').map((line, index) => (
              <Text key={`line-${index}`} style={pdfStyles.paragraph}>{line || ' '}</Text> // Render blank lines too
            ))
          ) : (
            // Explicit placeholder if text is null
            <Text style={pdfStyles.placeholder}>No cover letter content available to generate PDF.</Text>
          )}
        </View>
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
      try {
        const blob = new Blob([coverLetterText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'cover_letter.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast({ title: "Download Started", description: "Downloading cover letter as cover_letter.txt." });
      } catch (e) {
         console.error("Error creating blob or download link:", e);
         toast({ variant: "destructive", title: "Download Failed", description: "Could not prepare the text file for download." });
      }
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
            {/* PDF Download Button */}
            {isClient ? (
                 // Render the link only if coverLetterText exists
                 coverLetterText ? (
                     <PDFDownloadLink
                         document={<CoverLetterPdfDocument text={coverLetterText} />}
                         fileName="cover_letter.pdf"
                     >
                         {({ loading }) => (
                             <Button
                                 variant="outline"
                                 size="sm"
                                 disabled={loading}
                                 aria-label="Download Cover Letter as PDF"
                              >
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
                     // Render disabled button if no text
                     <Button
                         variant="outline"
                         size="sm"
                         disabled
                         aria-label="PDF download disabled, no content"
                     >
                        <Download className="mr-2 h-4 w-4" />
                        Download (.pdf)
                     </Button>
                 )
             ) : (
                  // Placeholder button while waiting for client-side render
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
          className="min-h-[400px] resize-y overflow-auto border rounded-md p-4 bg-white text-foreground font-serif text-sm leading-relaxed shadow-inner whitespace-pre-wrap" // Use serif font and preserve whitespace/newlines
          aria-label="Generated Cover Letter Preview"
        >
           {/* Render text directly or a placeholder */}
            {coverLetterText || <p className="text-muted-foreground italic">No cover letter generated yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
