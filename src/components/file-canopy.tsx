"use client";

import { useState, useRef, type ChangeEvent, useEffect } from "react";
import {
  ref,
  uploadBytes,
  listAll,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { storage, auth } from "@/lib/firebase";
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
import { Upload, Download, Trash2, FileText, Loader, LogIn, LogOut } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface StoredFile {
  name: string;
  size: number;
  url: string;
  fullPath: string;
}

export default function FileCanopy() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchFiles = async (userId: string) => {
    setIsLoading(true);
    try {
      const storageRef = ref(storage, `files/${userId}/`);
      const result = await listAll(storageRef);
      const filesData = await Promise.all(
        result.items.map(async (fileRef) => {
          const url = await getDownloadURL(fileRef);
          const metadata = await getMetadata(fileRef);
          return {
            name: metadata.name,
            size: metadata.size,
            url: url,
            fullPath: fileRef.fullPath,
          };
        })
      );
      setFiles(filesData);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem fetching your files.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchFiles(currentUser.uid);
      } else {
        setFiles([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const chosenFile = event.target.files?.[0];
    if (!chosenFile) return;

    setIsUploading(true);
    try {
      const fileRef = ref(storage, `files/${user.uid}/${chosenFile.name}`);
      await uploadBytes(fileRef, chosenFile);
      await fetchFiles(user.uid); // Refresh the file list
      toast({
        title: "Success!",
        description: `"${chosenFile.name}" has been uploaded.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "destructive",
        title: "Upload failed.",
        description: "There was a problem uploading your file.",
      });
    } finally {
      setIsUploading(false);
       if(event.target) {
        event.target.value = "";
    }
    }
  };

  const handleDeleteInitiated = (file: StoredFile) => {
    setFileToDelete(file);
  };

  const handleDeleteConfirmed = async () => {
    if (!fileToDelete) return;

    try {
      const fileRef = ref(storage, fileToDelete.fullPath);
      await deleteObject(fileRef);
      setFiles((prevFiles) =>
        prevFiles.filter((f) => f.fullPath !== fileToDelete.fullPath)
      );
      setFileToDelete(null);
      toast({
        title: "File deleted.",
        description: `"${fileToDelete.name}" has been permanently deleted.`,
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "destructive",
        title: "Deletion failed.",
        description: "There was a problem deleting your file.",
      });
    }
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        variant: "destructive",
        title: "Sign-in failed.",
        description: "There was a problem signing you in.",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Sign-out failed.",
        description: "There was a problem signing you out.",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl">
        <Card className="w-full shadow-lg">
          <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 space-y-1.5">
              <CardTitle className="text-2xl font-headline">File Canopy</CardTitle>
              <CardDescription>
                Upload, store, and manage your files with ease.
              </CardDescription>
            </div>
            {user ? (
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.displayName}</span>
                 </div>
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
                <Button onClick={handleSignIn}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in with Google
                </Button>
            )}
          </CardHeader>
          <CardContent>
             {user && (
                <div className="mb-6 text-right">
                    <Button onClick={handleUploadClick} disabled={isUploading || isLoading}>
                    {isUploading ? (
                        <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                        </>
                    ) : (
                        <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                        </>
                    )}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isUploading}
                    />
                </div>
            )}
             {isLoading ? (
               <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted bg-background/50 p-12 text-center">
                 <Loader className="h-10 w-10 animate-spin text-muted-foreground" />
                 <p className="text-lg font-medium text-muted-foreground">Loading files...</p>
               </div>
            ) : !user ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted bg-background/50 p-12 text-center">
                    <div className="rounded-full border border-dashed p-4">
                        <LogIn className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">
                        Please sign in to manage your files.
                    </p>
                </div>
            ) : files.length === 0 ? (
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
                      <TableRow key={file.fullPath} className="group transition-colors">
                        <TableCell className="pl-4">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium truncate max-w-xs">{file.name}</TableCell>
                        <TableCell>{formatBytes(file.size)}</TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-2">
                             <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">
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
