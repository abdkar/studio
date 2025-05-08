
'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parsePdfAction } from '@/actions/parse-pdf';
import { Loader2, Upload, FileText, Link, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Define accepted file types for the HTML input element
const ACCEPTED_CV_TYPES = '.txt,.pdf,.doc,.docx';
const ACCEPTED_JD_TYPES = '.txt,.pdf,.doc,.docx';

// Define MIME types for validation logic
const VALID_CV_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];
const VALID_JD_MIME_TYPES = [ // Allow same types for JD upload
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

type CvOptimizerFormProps = {
  cvText: string;
  jobDescText: string;
  onCvTextChange: (value: string) => void;
  onJobDescTextChange: (value: string) => void;
  isProcessingInput: boolean; // Received from parent for disabling elements
  setIsProcessingInput: (value: boolean) => void; // Function to set parent's loading state
};

export function CvOptimizerForm({
  cvText,
  jobDescText,
  onCvTextChange,
  onJobDescTextChange,
  isProcessingInput,
  setIsProcessingInput,
}: CvOptimizerFormProps) {
  const { toast } = useToast();
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null); // Ref for JD file input
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [jdFileName, setJdFileName] = useState<string | null>(null); // State for JD file name
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isParsingJd, setIsParsingJd] = useState(false); // State for JD parsing
  const [jdInputMethod, setJdInputMethod] = useState<'paste' | 'url' | 'upload'>('paste'); // Default to paste

  // --- Drag and Drop State ---
  const [isCvDragging, setIsCvDragging] = useState(false);
  const [isJdDragging, setIsJdDragging] = useState(false); // Drag state for JD

  // --- PDF Parsing Logic ---
  const parsePdf = async (file: File, isCv: boolean): Promise<string | null> => {
      const formData = new FormData();
      formData.append('pdfFile', file);
      const parsingSetter = isCv ? setIsParsingCv : setIsParsingJd;
      const textSetter = isCv ? onCvTextChange : onJobDescTextChange;
      const fileSetter = isCv ? setCvFileName : setJdFileName;
      const inputType = isCv ? 'CV' : 'Job Description';

      parsingSetter(true);
      setIsProcessingInput(true); // Signal global processing start
      console.log(`[CvOptimizerForm] Starting PDF parsing for ${inputType}: ${file.name}`);
      fileSetter(file.name); // Show filename while parsing

      try {
          console.log(`[CvOptimizerForm] Calling parsePdfAction for ${inputType}...`);
          const result = await parsePdfAction(formData);
          console.log(`[CvOptimizerForm] parsePdfAction result for ${inputType}:`, result);

          if (result.success) {
              if (result.text && result.text.length > 0) {
                  textSetter(result.text);
                  // File name is already set
                  console.log(`[CvOptimizerForm] ${inputType} PDF parsed successfully. Text length: ${result.text.length}`);
                  toast({
                      title: `${inputType} PDF Parsed Successfully`,
                      description: `Content extracted from ${file.name}.`,
                  });
                  return result.text; // Return extracted text
              } else {
                  // Parsing succeeded, but no text extracted
                  textSetter(''); // Clear text area
                  // Keep file name displayed, but show a warning toast
                  console.warn(`[CvOptimizerForm] ${inputType} PDF parsed but no text found. File: ${file.name}. Action message: ${result.error}`);
                  toast({
                      variant: "default", // Use default variant for warnings
                      title: `${inputType} Parsed: No Text Found`,
                      description: result.error || `Could not extract text from ${file.name}. The PDF might be image-based or empty. Please paste the text manually.`,
                      duration: 9000,
                  });
                  return null; // Indicate no text was extracted
              }
          } else {
              // Parsing failed explicitly
              console.error(`[CvOptimizerForm] ${inputType} PDF parsing failed. Error: ${result.error}`);
              textSetter(''); // Clear text area
              fileSetter(null); // Clear file name on failure
              toast({
                  variant: "destructive",
                  title: `${inputType} PDF Parsing Failed`,
                  description: result.error || `Could not extract text from ${file.name}. Please ensure it's a valid, unencrypted PDF and try pasting manually.`,
                  duration: 9000,
              });
              return null;
          }
      } catch (error) {
          // Catch errors from the `parsePdfAction` call itself (network, etc.)
          console.error(`[CvOptimizerForm] Error calling parsePdfAction client-side for ${inputType}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          textSetter('');
          fileSetter(null); // Clear file name on failure
          toast({
              variant: "destructive",
              title: `${inputType} Processing Error`,
              description: `An unexpected error occurred while processing the PDF: ${errorMessage}. Please paste the text manually.`,
              duration: 9000,
          });
          return null;
      } finally {
          console.log(`[CvOptimizerForm] ${inputType} PDF parsing finished.`);
          parsingSetter(false);
          setIsProcessingInput(false); // Signal global processing end
      }
  };

  // --- Text File Reading ---
  const readTextFile = (file: File, isCv: boolean) => {
    const textSetter = isCv ? onCvTextChange : onJobDescTextChange;
    const fileSetter = isCv ? setCvFileName : setJdFileName;
    const inputType = isCv ? 'CV' : 'Job Description';

    console.log(`[CvOptimizerForm] Reading TXT file for ${inputType}: ${file.name}`);
    setIsProcessingInput(true); // Indicate processing
    fileSetter(file.name); // Show filename immediately

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      textSetter(text);
      // Filename is already set
      console.log(`[CvOptimizerForm] ${inputType} TXT file read successfully. Length: ${text?.length ?? 0}`);
      toast({
        title: `${inputType} TXT File Loaded`,
        description: `Content loaded successfully from ${file.name}.`,
      });
      setIsProcessingInput(false); // End processing
    };
    reader.onerror = (e) => {
       console.error(`[CvOptimizerForm] Error reading ${inputType} TXT file:`, e);
       textSetter('');
       fileSetter(null); // Clear filename on error
       toast({
        variant: "destructive",
        title: "File Read Error",
        description: `Could not read the selected .txt file for ${inputType}.`,
      });
      setIsProcessingInput(false); // End processing
    }
    reader.readAsText(file);
  };

  // --- Generic File Handler ---
  const handleFileSelected = async (file: File | null, isCv: boolean) => {
    if (!file) return;

    const inputType = isCv ? 'CV' : 'Job Description';
    const fileSetter = isCv ? setCvFileName : setJdFileName;
    const textSetter = isCv ? onCvTextChange : onJobDescTextChange;
    const validMimeTypes = isCv ? VALID_CV_MIME_TYPES : VALID_JD_MIME_TYPES;
    const acceptedExtensions = isCv ? ACCEPTED_CV_TYPES : ACCEPTED_JD_TYPES;

    console.log(`[CvOptimizerForm] ${inputType} File selected: ${file.name}, Type: ${file.type}, Size: ${file.size}`);

    // Reset previous text content immediately
    textSetter('');
    fileSetter(null); // Clear name initially, will be set again if processing starts

     // Basic MIME type check
    if (!validMimeTypes.includes(file.type)) {
      console.warn(`[CvOptimizerForm] Invalid file type for ${inputType}: ${file.type}. Attempting name check.`);
      // Fallback check based on extension if MIME type is generic (like application/octet-stream)
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !acceptedExtensions.includes(`.${extension}`)) {
          console.error(`[CvOptimizerForm] Invalid file extension as well for ${inputType}: .${extension}`);
          toast({
              variant: "destructive",
              title: "Invalid File Type",
              description: `Unsupported file type (${file.type || `.${extension}`}). Please use ${acceptedExtensions.replace(/,/g, ', ')}.`,
              duration: 7000,
          });
          return; // Stop processing if both MIME and extension are invalid
      }
       console.log(`[CvOptimizerForm] Proceeding based on valid extension .${extension} despite generic MIME type.`);
    }


    // Set the file name immediately for visual feedback while processing starts
    fileSetter(file.name);

    // --- Handle specific file types ---
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      readTextFile(file, isCv);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
       const extractedText = await parsePdf(file, isCv);
       if (extractedText === null) {
           // Parsing failed, state handled within parsePdf, filename might be cleared
       } else if (extractedText === '') {
            // PDF parsed, no text found, state handled, filename remains, text area empty
       } else {
           // Success with text, state handled
       }
        if (!isCv && extractedText !== null) { // If JD was parsed (even if empty text)
            setJdInputMethod('paste'); // Switch to paste tab to show/edit extracted text
        }

    } else if (file.type === 'application/msword' || file.name.endsWith('.doc') ||
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
      console.log(`[CvOptimizerForm] Word document uploaded for ${inputType}: ${file.name}. Prompting user to paste.`);
      textSetter(''); // Clear text area as we don't extract automatically
      // Keep the file name displayed to show the upload happened
      toast({
        variant: "default", // Use default/info style
        title: "Word File Uploaded",
        description: `Uploaded ${file.name}. Automatic text extraction for Word files isn't supported. Please copy the content and paste it into the text area.`,
        duration: 10000, // Longer duration for this message
      });
       setIsProcessingInput(false); // Stop global processing indicator for Word files
        if (!isCv) {
            setJdInputMethod('paste'); // Switch to paste tab
        }
    } else {
       console.warn(`[CvOptimizerForm] Unhandled valid file type combination for ${inputType}: ${file.name} (Type: ${file.type}). Prompting user.`);
       textSetter(''); // Clear text area
       toast({
        variant: "default",
        title: "File Uploaded",
        description: `Uploaded ${file.name}. Could not automatically process this file type. Please paste the content manually.`,
        duration: 9000,
      });
       setIsProcessingInput(false); // Stop global processing indicator
        if (!isCv) {
            setJdInputMethod('paste'); // Switch to paste tab
        }
    }
  };

  // Specific change handlers for file inputs
  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(event.target.files?.[0] ?? null, true);
    if (cvFileInputRef.current) cvFileInputRef.current.value = '';
  };

  const handleJdFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(event.target.files?.[0] ?? null, false);
     if (jdFileInputRef.current) jdFileInputRef.current.value = '';
     // setJdInputMethod('upload'); // No need to force tab, handleFileSelected might switch to 'paste'
  };

  // Function to clear CV input
   const clearCvInput = useCallback(() => {
     onCvTextChange('');
     setCvFileName(null);
     if (cvFileInputRef.current) {
       cvFileInputRef.current.value = '';
     }
     toast({ title: "CV Input Cleared" });
   }, [onCvTextChange, toast]);

   // Function to clear Job Description input
   const clearJdInput = useCallback(() => {
       onJobDescTextChange('');
       setJdFileName(null);
        if (jdFileInputRef.current) {
          jdFileInputRef.current.value = '';
       }
       setJdInputMethod('paste'); // Reset to paste tab
       toast({ title: "Job Description Input Cleared" });
   }, [onJobDescTextChange, toast]);

   const cvIsProcessing = isParsingCv;
   const jdIsProcessing = isParsingJd;


  // --- Render ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* --- Upload CV Card --- */}
      <Card className={`shadow-md transition-all ${isCvDragging ? 'border-primary ring-2 ring-primary' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Upload Your CV</CardTitle>
            <CardDescription>TXT, PDF, DOC, DOCX - Drag &amp; drop or click</CardDescription>
          </div>
           {(cvText || cvFileName) && (
             <Button variant="ghost" size="icon" onClick={clearCvInput} aria-label="Clear CV Input" className="text-muted-foreground hover:text-destructive" disabled={cvIsProcessing || isProcessingInput}>
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
        </CardHeader>
        <CardContent>
          <div
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg h-48 hover:border-primary transition-colors relative ${cvIsProcessing || isProcessingInput ? 'cursor-not-allowed' : 'cursor-pointer'} ${isCvDragging ? 'border-primary ring-2 ring-primary' : 'border-muted-foreground/30'}`}
            onClick={() => !(cvIsProcessing || isProcessingInput) && cvFileInputRef.current?.click()}
            aria-disabled={cvIsProcessing || isProcessingInput}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!(cvIsProcessing || isProcessingInput)) setIsCvDragging(true);}}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsCvDragging(false);}}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsCvDragging(false);
                if (cvIsProcessing || isProcessingInput) return;
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileSelected(e.dataTransfer.files[0], true);
                    e.dataTransfer.clearData();
                }
            }}
          >
              {(cvIsProcessing || (isProcessingInput && !jdIsProcessing)) && (
                  <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10 rounded-lg">
                      <Loader2 className="h-12 w-12 text-primary animate-spin mb-2" />
                      <p className="text-sm text-primary">Processing...</p>
                  </div>
              )}
              {!(cvIsProcessing || (isProcessingInput && !jdIsProcessing)) && cvFileName ? (
                  <>
                    <FileText className="h-12 w-12 text-primary mb-4" />
                    <p className="text-sm font-medium text-center text-foreground break-all px-2">{cvFileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
                  </>
              ) : !(cvIsProcessing || (isProcessingInput && !jdIsProcessing)) ? (
                  <>
                      <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-sm text-center text-muted-foreground">
                           {isCvDragging ? 'Drop your CV file here' : `Upload or drag and drop file`}
                      </p>
                       <p className="text-xs text-muted-foreground mt-1">(.txt, .pdf, .doc, .docx)</p>
                  </>
              ) : null}
            <Input
              ref={cvFileInputRef}
              id="cv-file-input"
              type="file"
              accept={ACCEPTED_CV_TYPES}
              onChange={handleCvFileChange}
              className="hidden"
              disabled={cvIsProcessing || isProcessingInput}
            />
          </div>
           <Textarea
              placeholder={cvFileName ? "CV text extracted/loaded. Edit here if needed." : "Or paste your CV text here..."}
              className="mt-4 min-h-[100px] resize-y bg-white"
              value={cvText}
              onChange={(e) => onCvTextChange(e.target.value)}
              disabled={cvIsProcessing || isProcessingInput}
           />
        </CardContent>
      </Card>

      {/* --- Job Description Card --- */}
       <Card className={`shadow-md transition-all ${isJdDragging ? 'border-primary ring-2 ring-primary' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <div>
             <CardTitle className="text-xl">Job Description</CardTitle>
             <CardDescription>Provide the job description using one of the methods below</CardDescription>
           </div>
           {(jobDescText || jdFileName) && (
               <Button variant="ghost" size="icon" onClick={clearJdInput} aria-label="Clear Job Description Input" className="text-muted-foreground hover:text-destructive" disabled={jdIsProcessing || isProcessingInput}>
                   <Trash2 className="h-4 w-4" />
               </Button>
            )}
        </CardHeader>
        <CardContent>
          <Tabs value={jdInputMethod} onValueChange={(value) => setJdInputMethod(value as 'paste' | 'url' | 'upload')} className="w-full">
             <TabsList className="grid w-full grid-cols-3 mb-4">
               <TabsTrigger value="paste" disabled={jdIsProcessing || isProcessingInput}>Paste Text</TabsTrigger>
               <TabsTrigger value="url" disabled>Add URL</TabsTrigger>
               <TabsTrigger value="upload" disabled={jdIsProcessing || isProcessingInput}>Upload File</TabsTrigger>
             </TabsList>
            <TabsContent value="paste">
              <Textarea
                placeholder="Paste the job description text here..."
                className="min-h-[200px] resize-y bg-white"
                value={jobDescText}
                onChange={(e) => onJobDescTextChange(e.target.value)}
                disabled={jdIsProcessing || isProcessingInput}
              />
              <p className="text-xs text-muted-foreground mt-2">
                 The system will analyze this job description to identify relevant keywords to enhance your CV without adding skills you don't possess.
              </p>
            </TabsContent>
            <TabsContent value="url">
              <Input type="url" placeholder="Enter job description URL (feature coming soon)" disabled />
               <p className="text-xs text-muted-foreground mt-2">
                  Pasting the URL will allow fetching the content (feature under development).
              </p>
            </TabsContent>
            <TabsContent value="upload">
                 <div
                   className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg h-48 hover:border-primary transition-colors relative ${jdIsProcessing || isProcessingInput ? 'cursor-not-allowed' : 'cursor-pointer'} ${isJdDragging ? 'border-primary ring-2 ring-primary' : 'border-muted-foreground/30'}`}
                   onClick={() => !(jdIsProcessing || isProcessingInput) && jdFileInputRef.current?.click()}
                   aria-disabled={jdIsProcessing || isProcessingInput}
                   onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if(!(jdIsProcessing || isProcessingInput)) setIsJdDragging(true);}}
                   onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsJdDragging(false);}}
                   onDrop={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       setIsJdDragging(false);
                       if (jdIsProcessing || isProcessingInput) return;
                       if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                           handleFileSelected(e.dataTransfer.files[0], false);
                           e.dataTransfer.clearData();
                           // No need to setJdInputMethod here, handleFileSelected might switch to 'paste'
                       }
                   }}
                 >
                      {(jdIsProcessing || (isProcessingInput && !cvIsProcessing)) && (
                          <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center z-10 rounded-lg">
                              <Loader2 className="h-12 w-12 text-primary animate-spin mb-2" />
                              <p className="text-sm text-primary">Processing...</p>
                          </div>
                      )}
                    {!(jdIsProcessing || (isProcessingInput && !cvIsProcessing)) && jdFileName ? (
                          <>
                            <FileText className="h-12 w-12 text-primary mb-4" />
                            <p className="text-sm font-medium text-center text-foreground break-all px-2">{jdFileName}</p>
                            <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
                          </>
                      ) : !(jdIsProcessing || (isProcessingInput && !cvIsProcessing)) ? (
                          <>
                              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                              <p className="text-sm text-center text-muted-foreground">
                                   {isJdDragging ? 'Drop your JD file here' : `Upload or drag and drop file`}
                              </p>
                               <p className="text-xs text-muted-foreground mt-1">(.txt, .pdf, .doc, .docx)</p>
                          </>
                      ) : null}
                   <Input
                     ref={jdFileInputRef}
                     id="jd-file-input"
                     type="file"
                     accept={ACCEPTED_JD_TYPES}
                     onChange={handleJdFileChange}
                     className="hidden"
                     disabled={jdIsProcessing || isProcessingInput}
                   />
               </div>
                <p className="text-xs text-muted-foreground mt-2">
                   Upload TXT or PDF for automatic text extraction. For DOC/DOCX, please copy and paste the content from the file into the 'Paste Text' tab.
               </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
