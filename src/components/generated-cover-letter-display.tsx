'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea for display
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Download, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type GeneratedCoverLetterDisplayProps = {
  coverLetterText: string | null;
  isLoading: boolean;
  error: string | null;
};

export function GeneratedCoverLetterDisplay({ coverLetterText, isLoading, error }: GeneratedCoverLetterDisplayProps) {
  const { toast } = useToast();

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
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-64 w-full" /> {/* Skeleton for textarea display area */}
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
    return null; // Don't render if no result, error, or loading
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
           <Mail className="h-6 w-6 text-primary" /> Generated Cover Letter
        </CardTitle>
        <CardDescription>
          Review the generated cover letter text below. You can copy or download it as a .txt file.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy Text
          </Button>
          <Button variant="outline" onClick={handleDownloadTxt}>
            <Download className="mr-2 h-4 w-4" /> Download (.txt)
          </Button>
        </div>

        {/* Display the cover letter text in a read-only Textarea */}
        <Textarea
          readOnly
          value={coverLetterText}
          className="min-h-[400px] resize-y bg-white text-foreground font-mono text-sm" // Use mono font for better readability of plain text
          aria-label="Generated Cover Letter Text"
        />
      </CardContent>
    </Card>
  );
}
