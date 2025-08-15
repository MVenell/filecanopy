"use client";

import { useState, useRef, type ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Upload, Download, Trash2, FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  file: File;
}

export default function FileCanopy() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosenFiles = Array.from(event.target.files ?? []);
    if (chosenFiles.length > 0) {
      const newFile = chosenFiles[0];
      const uploadedFile: UploadedFile = {
        id: crypto.randomUUID(),
        name: newFile.name,
        size: newFile.size,
        type: newFile.type,
        url: URL.createObjectURL(newFile),
        file: newFile,
      };
      setFiles((prevFiles) => [...prevFiles, uploadedFile]);
    }
    // Reset file input to allow re-uploading the same file
    if(event.target) {
        event.target.value = "";
    }
  };

  const handleDeleteInitiated = (file: UploadedFile) => {
    setFileToDelete(file);
  };

  const handleDeleteConfirmed = () => {
    if (fileToDelete) {
      setFiles((prevFiles) =>
        prevFiles.filter((f) => f.id !== fileToDelete.id)
      );
      // Revoke the object URL to free up memory
      URL.revokeObjectURL(fileToDelete.url);
      setFileToDelete(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl">
        <Card className="w-full shadow-lg">
          <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-2xl font-headline">File Canopy</CardTitle>
              <CardDescription>
                Upload, store, and manage your files with ease.
              </CardDescription>
            </div>
            <Button onClick={handleUploadClick} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted bg-background/50 p-12 text-center">
                <div className="rounded-full border border-dashed p-4">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  No files uploaded yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the "Upload File" button to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] pl-4">
                        <span className="sr-only">Icon</span>
                      </TableHead>
                      <TableHead>File Name</TableHead>
                      <TableHead className="w-[120px]">Size</TableHead>
                      <TableHead className="w-[150px] text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id} className="group transition-colors">
                        <TableCell className="pl-4">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium truncate max-w-xs">{file.name}</TableCell>
                        <TableCell>{formatBytes(file.size)}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-2">
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={file.url} download={file.name}>
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download</span>
                                    </Button>
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Download</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteInitiated(file)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <AlertDialog
          open={!!fileToDelete}
          onOpenChange={(open) => !open && setFileToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your file "{fileToDelete?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirmed}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
