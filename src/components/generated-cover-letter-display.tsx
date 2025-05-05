
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, FileText, FileType, Mail, Loader2 } from 'lucide-react'; // Removed Download, added Loader2 for placeholders if needed
import { useToast } from '@/hooks/use-toast';
// Removed @react-pdf/renderer imports

type GeneratedCoverLetterDisplayProps = {
  coverLetterText: string | null;
  isLoading: boolean;
  error: string | null;
};

// --- PDF Styling (Removed) ---
// Removed pdfStyles

// --- PDF Document Component (Removed) ---
// Removed CoverLetterPdfDocument component

// --- Main Component ---
export function GeneratedCoverLetterDisplay({ coverLetterText, isLoading, error }: GeneratedCoverLetterDisplayProps) {
  const { toast } = useToast();
  // Removed isClient state and useEffect as they were primarily for PDFDownloadLink

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

   // Handle Word and LaTeX (Placeholders)
  const handleDownloadDocx = () => {
    toast({ variant: "default", title: "Feature Not Implemented", description: "Word (.docx) download requires server-side processing and is not yet available." });
  };

  const handleDownloadTex = () => {
     toast({ variant: "default", title: "Feature Not Implemented", description: "LaTeX (.tex) download requires server-side processing or complex formatting and is not yet available." });
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
             {/* Removed PDF Skeleton */}
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

  // Do not render the card if there's no result to display
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
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!coverLetterText}>
                <Copy className="mr-2 h-4 w-4" /> Copy Text
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTxt} disabled={!coverLetterText}>
                <FileText className="mr-2 h-4 w-4" /> Download (.txt)
            </Button>

            {/* PDF Download Button - Removed */}

             {/* Placeholder Buttons for DOCX/TEX */}
             <Button variant="outline" size="sm" onClick={handleDownloadDocx} disabled>
                <FileType className="mr-2 h-4 w-4" /> Download (.docx)
             </Button>
             <Button variant="outline" size="sm" onClick={handleDownloadTex} disabled>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-filetype-tex mr-2" viewBox="0 0 16 16"><path fillRule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v.9h1.6v1.48h.87v-1.48h1.6v-.9h-1.6V10.3h-.87zM5.56 11.8h-.85v2.14h.85zM7.91 14h.87v-1.48h1.6v-.9h-1.6v-.68h.85v-.9H7.91zm4.08 0h.87v-1.48h1.6v-.9h-1.6v-.68h.85v-.9h-2.47v3.96z"/></svg>
                 Download (.tex)
             </Button>
          </div>


        {/* Display the cover letter text in a styled preview area */}
        <div
          className="min-h-[400px] resize-y overflow-auto border rounded-md p-4 bg-white text-foreground font-serif text-sm leading-relaxed shadow-inner whitespace-pre-wrap"
          aria-label="Generated Cover Letter Preview"
        >
           {/* Render text directly */}
           {coverLetterText}
        </div>
      </CardContent>
    </Card>
  );
}
