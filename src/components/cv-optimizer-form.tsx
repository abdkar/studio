
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

// Define accepted file types more broadly for input element
const ACCEPTED_CV_TYPES = '.txt,.pdf,.doc,.docx';
const ACCEPTED_JD_TYPES = '.txt,.pdf,.doc,.docx'; // Allow same types for JD upload

// More specific types for validation logic
const VALID_CV_MIME_TYPES = [
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

      try {
          console.log(`[CvOptimizerForm] Calling parsePdfAction for ${inputType}...`);
          const result = await parsePdfAction(formData);
          console.log(`[CvOptimizerForm] parsePdfAction result for ${inputType}:`, result);

          if (result.success) {
              if (result.text && result.text.length > 0) {
                  textSetter(result.text);
                  fileSetter(file.name); // Keep file name on success
                  console.log(`[CvOptimizerForm] ${inputType} PDF parsed successfully. Text length: ${result.text.length}`);
                  toast({
                      title: `${inputType} PDF Parsed Successfully`,
                      description: `Content extracted from ${file.name}.`,
                  });
                  return result.text; // Return extracted text
              } else {
                  textSetter('');
                  fileSetter(null); // Clear file name if no text
                  console.warn(`[CvOptimizerForm] ${inputType} PDF parsed but no text found. File: ${file.name}. Error from action: ${result.error}`);
                  toast({
                      variant: "default",
                      title: `${inputType} PDF Parsed, No Text Found`,
                      description: result.error || `Could not extract text. The PDF might be image-based or corrupted. Please paste the text manually.`,
                      duration: 9000,
                  });
                  return null;
              }
          } else {
              console.error(`[CvOptimizerForm] ${inputType} PDF parsing failed. Error: ${result.error}`);
              textSetter('');
              fileSetter(null);
              toast({
                  variant: "destructive",
                  title: `${inputType} PDF Parsing Failed`,
                  description: result.error || `Could not extract text from PDF. Please ensure it's a valid PDF and try pasting manually.`,
                  duration: 9000,
              });
              return null;
          }
      } catch (error) {
          console.error(`[CvOptimizerForm] Error calling parsePdfAction client-side for ${inputType}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
          textSetter('');
          fileSetter(null);
          toast({
              variant: "destructive",
              title: `${inputType} PDF Parsing Error`,
              description: `An unexpected error occurred: ${errorMessage}. Please paste the text manually.`,
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
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      textSetter(text);
      fileSetter(file.name);
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
       fileSetter(null);
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

    console.log(`[CvOptimizerForm] ${inputType} File selected: ${file.name}, Type: ${file.type}`);

    // Reset previous text content
    textSetter('');
    fileSetter(null);

    if (!validMimeTypes.includes(file.type)) {
      console.warn(`[CvOptimizerForm] Invalid file type for ${inputType}: ${file.type}`);
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: `Please upload a supported ${inputType} file type: ${acceptedExtensions}.`,
      });
      return;
    }

    // Set the file name immediately for visual feedback
     fileSetter(file.name);

    if (file.type === 'text/plain') {
      readTextFile(file, isCv);
    } else if (file.type === 'application/pdf') {
      await parsePdf(file, isCv);
    } else if (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log(`[CvOptimizerForm] DOC/DOCX file uploaded for ${inputType}: ${file.name}. Prompting user to paste.`);
      textSetter(''); // Clear any potentially parsed text (though we don't parse docx)
      toast({
        variant: "default",
        title: "Word File Uploaded",
        description: `Uploaded ${file.name}. Please copy the text from your Word document and paste it into the ${inputType} text area. Automatic extraction is not supported for DOC/DOCX files.`,
        duration: 9000,
      });
    }
  };

  // Specific change handlers for file inputs
  const handleCvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(event.target.files?.[0] ?? null, true);
    if (cvFileInputRef.current) cvFileInputRef.current.value = ''; // Reset input
  };

  const handleJdFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelected(event.target.files?.[0] ?? null, false);
    if (jdFileInputRef.current) jdFileInputRef.current.value = ''; // Reset input
     setJdInputMethod('upload'); // Switch tab on file selection
  };

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, isCv: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCv) setIsCvDragging(true); else setIsJdDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, isCv: boolean) => {
    e.preventDefault();
    e.stopPropagation();
     if (isCv) setIsCvDragging(false); else setIsJdDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isCv: boolean) => {
    e.preventDefault();
    e.stopPropagation();
     if (isCv) setIsCvDragging(false); else setIsJdDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0], isCv);
      e.dataTransfer.clearData();
       if (!isCv) setJdInputMethod('upload'); // Switch JD tab on drop
    }
  };


  // Function to clear CV input
   const clearCvInput = useCallback(() => {
     onCvTextChange('');
     setCvFileName(null);
     if (cvFileInputRef.current) {
       cvFileInputRef.current.value = '';
     }
     toast({ title: "CV Input Cleared" });
   }, [onCvTextChange, setCvFileName, cvFileInputRef, toast]);

   // Function to clear Job Description input
   const clearJdInput = useCallback(() => {
       onJobDescTextChange('');
       setJdFileName(null);
        if (jdFileInputRef.current) {
          jdFileInputRef.current.value = '';
       }
       // Reset other JD inputs if needed (e.g., URL field)
       toast({ title: "Job Description Input Cleared" });
   }, [onJobDescTextChange, setJdFileName, jdFileInputRef, toast]);


  // --- Render ---
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* --- Upload CV Card --- */}
      <Card
         className={`shadow-md transition-all ${isCvDragging ? 'border-primary ring-2 ring-primary' : ''}`}
         onDragOver={(e) => handleDragOver(e, true)}
         onDragLeave={(e) => handleDragLeave(e, true)}
         onDrop={(e) => handleDrop(e, true)}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl">Upload Your CV</CardTitle>
            <CardDescription>Drag and drop your file or click to browse</CardDescription>
          </div>
           {(cvText || cvFileName) && (
             <Button variant="ghost" size="icon" onClick={clearCvInput} aria-label="Clear CV Input" className="text-muted-foreground hover:text-destructive">
               <Trash2 className="h-4 w-4" />
             </Button>
           )}
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg h-48 cursor-pointer hover:border-primary transition-colors"
            onClick={() => cvFileInputRef.current?.click()}
          >
            {isParsingCv ? (
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            ) : cvFileName ? (
                <>
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <p className="text-sm font-medium text-center text-foreground">{cvFileName}</p>
                  <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
                </>
            ) : (
                <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-center text-muted-foreground">
                         {isCvDragging ? 'Drop your CV file here' : `Upload or drag and drop your files (${ACCEPTED_CV_TYPES})`}
                    </p>
                </>
            )}
            <Input
              ref={cvFileInputRef}
              id="cv-file-input"
              type="file"
              accept={ACCEPTED_CV_TYPES}
              onChange={handleCvFileChange}
              className="hidden"
              disabled={isProcessingInput || isParsingCv}
            />
          </div>
           {/* Optionally, show text area if CV text exists but no file is loaded */}
           {cvText && !cvFileName && !isParsingCv && (
                <Textarea
                    placeholder="CV text loaded..."
                    className="mt-4 min-h-[100px] resize-y bg-white"
                    value={cvText}
                    onChange={(e) => onCvTextChange(e.target.value)} // Allow editing pasted text
                    disabled={isProcessingInput}
                />
            )}
        </CardContent>
      </Card>

      {/* --- Job Description Card --- */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
           <div>
             <CardTitle className="text-xl">Job Description</CardTitle>
             <CardDescription>Provide the job description using one of the methods below</CardDescription>
           </div>
           {(jobDescText || jdFileName) && ( // Show clear button if text or file exists
               <Button variant="ghost" size="icon" onClick={clearJdInput} aria-label="Clear Job Description Input" className="text-muted-foreground hover:text-destructive">
                   <Trash2 className="h-4 w-4" />
               </Button>
            )}
        </CardHeader>
        <CardContent>
          <Tabs value={jdInputMethod} onValueChange={(value) => setJdInputMethod(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="paste">Paste Text</TabsTrigger>
              <TabsTrigger value="url" disabled>Add URL</TabsTrigger> {/* Disabled for now */}
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            <TabsContent value="paste">
              <Textarea
                placeholder="Paste the job description text here..."
                className="min-h-[200px] resize-y bg-white"
                value={jobDescText}
                onChange={(e) => onJobDescTextChange(e.target.value)}
                disabled={isProcessingInput || isParsingJd}
              />
              <p className="text-xs text-muted-foreground mt-2">
                 The system will analyze this job description to identify relevant keywords to enhance your CV.
              </p>
            </TabsContent>
            <TabsContent value="url">
              {/* Placeholder for URL input - Currently disabled */}
              <Input type="url" placeholder="Enter job description URL (feature coming soon)" disabled />
               <p className="text-xs text-muted-foreground mt-2">
                  Pasting the URL here will allow the system to fetch and analyze the content (feature under development).
              </p>
            </TabsContent>
            <TabsContent value="upload">
                <div
                 className={`flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/30 rounded-lg h-48 cursor-pointer hover:border-primary transition-colors ${isJdDragging ? 'border-primary ring-2 ring-primary' : ''}`}
                 onClick={() => jdFileInputRef.current?.click()}
                 onDragOver={(e) => handleDragOver(e, false)}
                 onDragLeave={(e) => handleDragLeave(e, false)}
                 onDrop={(e) => handleDrop(e, false)}
                >
                   {isParsingJd ? (
                        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                   ) : jdFileName ? (
                       <>
                         <FileText className="h-12 w-12 text-primary mb-4" />
                         <p className="text-sm font-medium text-center text-foreground">{jdFileName}</p>
                         <p className="text-xs text-muted-foreground mt-1">Click or drag to replace</p>
                       </>
                   ) : (
                       <>
                           <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                           <p className="text-sm text-center text-muted-foreground">
                                {isJdDragging ? 'Drop your JD file here' : `Upload or drag and drop your files (${ACCEPTED_JD_TYPES})`}
                           </p>
                       </>
                   )}
                   <Input
                     ref={jdFileInputRef}
                     id="jd-file-input"
                     type="file"
                     accept={ACCEPTED_JD_TYPES}
                     onChange={handleJdFileChange}
                     className="hidden"
                     disabled={isProcessingInput || isParsingJd}
                   />
               </div>
               <p className="text-xs text-muted-foreground mt-2">
                  Upload TXT or PDF for automatic text extraction. For DOC/DOCX, please paste the text manually in the 'Paste Text' tab.
              </p>
            </TabsContent>
          </Tabs>
          {/* Button removed - will be placed on the main page */}
          {/* <Button className="w-full mt-4" disabled={isProcessingInput || !jobDescText}>Use This Job Description</Button> */}
        </CardContent>
      </Card>
    </div>
  );
}
