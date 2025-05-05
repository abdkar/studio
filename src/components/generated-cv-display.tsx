'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Download, FileText, FileCode } from 'lucide-react'; // Added Markdown icon
import { useToast } from '@/hooks/use-toast';

type GeneratedCvDisplayProps = {
  cvMarkdown: string | null; // Renamed prop to indicate Markdown content
  isLoading: boolean;
  error: string | null;
};

export function GeneratedCvDisplay({ cvMarkdown, isLoading, error }: GeneratedCvDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (cvMarkdown) {
      navigator.clipboard.writeText(cvMarkdown)
        .then(() => {
          toast({ title: "Copied to Clipboard", description: "Generated CV Markdown copied successfully." });
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
          toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy Markdown to clipboard." });
        });
    }
  };

  // Function to initiate download
  const triggerDownload = (filename: string, content: string, mimeType: string) => {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: "Download Started", description: `Downloading generated CV as ${filename}.` });
  };

  const handleDownloadMarkdown = () => {
    if (cvMarkdown) {
        triggerDownload('tailored_cv.md', cvMarkdown, 'text/markdown');
    }
  };

  const handleDownloadTxt = () => {
     if (cvMarkdown) {
        // Basic conversion: try to remove Markdown syntax for plain text
        // This is a simple approach and might not perfectly handle all cases
        const plainText = cvMarkdown
          .replace(/^#+\s*/gm, '') // Remove headings
          .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
          .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
          .replace(/^[-*+]\s+/gm, '') // Remove list bullets
          .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove URL part
          .replace(/<.*?>/g, '') // Remove potential HTML tags
          .replace(/\\`/g, '`') // Unescape backticks if needed
          .replace(/`/g, '') // Remove backticks
          .replace(/---/g, '\n') // Replace horizontal rules with newline
          .replace(/\n{3,}/g, '\n\n'); // Collapse multiple blank lines


        triggerDownload('tailored_cv.txt', plainText, 'text/plain');
    }
  };


  if (isLoading) {
    return (
      <Card className="shadow-md animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex justify-end space-x-2">
             <Skeleton className="h-10 w-24" />
             <Skeleton className="h-10 w-32" /> {/* Adjust for Markdown button */}
             <Skeleton className="h-10 w-32" /> {/* Adjust for Txt button */}
           </div>
          <Skeleton className="h-64 w-full" /> {/* Skeleton for Markdown display area */}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="shadow-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>CV Generation Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!cvMarkdown) {
    return null; // Don't render anything if there's no result, error, or loading state
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Generated ATS-Friendly CV</CardTitle>
        <CardDescription>
          Review the generated CV below (formatted using Markdown). You can copy or download the text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="flex flex-wrap justify-end gap-2"> {/* Use flex-wrap and gap */}
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" /> Copy Markdown
            </Button>
            <Button variant="outline" onClick={handleDownloadMarkdown}>
              <FileCode className="mr-2 h-4 w-4" /> Download (.md)
            </Button>
             <Button variant="outline" onClick={handleDownloadTxt}>
              <FileText className="mr-2 h-4 w-4" /> Download (.txt)
            </Button>
             {/* Placeholder for future LaTeX download
              <Button variant="outline" disabled>
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-filetype-tex mr-2" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5zM1.6 11.85H0v.9h1.6v1.48h.87v-1.48h1.6v-.9h-1.6V10.3h-.87zM5.56 11.8h-.85v2.14h.85zM7.91 14h.87v-1.48h1.6v-.9h-1.6v-.68h.85v-.9H7.91zm4.08 0h.87v-1.48h1.6v-.9h-1.6v-.68h.85v-.9h-2.47v3.96z"/></svg>
                Download (.tex)
             </Button>
            */}
          </div>
        {/* Use ReactMarkdown to render the CV */}
        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none border border-input rounded-md p-4 bg-white min-h-[400px]">
          {/*
            Apply Tailwind typography plugin classes for styling
            prose-sm / prose / prose-lg / prose-xl control size
            max-w-none removes default max width constraint
            Added border, rounded, padding, bg for consistency
          */}
          <ReactMarkdown>{cvMarkdown}</ReactMarkdown>
        </div>

      </CardContent>
    </Card>
  );
}
