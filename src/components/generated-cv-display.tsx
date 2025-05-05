'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type GeneratedCvDisplayProps = {
  cvText: string | null;
  isLoading: boolean;
  error: string | null;
};

export function GeneratedCvDisplay({ cvText, isLoading, error }: GeneratedCvDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (cvText) {
      navigator.clipboard.writeText(cvText)
        .then(() => {
          toast({ title: "Copied to Clipboard", description: "Generated CV text copied successfully." });
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
          toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy text to clipboard." });
        });
    }
  };

  const handleDownload = () => {
    if (cvText) {
        const blob = new Blob([cvText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'tailored_cv.txt'; // Filename for the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up the object URL
         toast({ title: "Download Started", description: "Downloading generated CV as tailored_cv.txt." });
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
             <Skeleton className="h-10 w-24" />
           </div>
          <Skeleton className="h-64 w-full" /> {/* Skeleton for textarea */}
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

  if (!cvText) {
    return null; // Don't render anything if there's no result, error, or loading state
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">Generated ATS-Friendly CV</CardTitle>
        <CardDescription>
          Review the generated CV below. You can copy or download the text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" /> Copy Text
            </Button>
             <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download (.txt)
            </Button>
          </div>
        <Textarea
          value={cvText}
          readOnly // Make it read-only as it's a display area
          className="min-h-[400px] resize-y bg-white border border-input rounded-md p-4 text-sm font-mono" // Use mono font for better text structure view
          aria-label="Generated CV Text"
        />

      </CardContent>
    </Card>
  );
}
