"use client";

import { Upload, X, ArrowLeft, Copy, Check } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";

export default function SendPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isSent, setIsSent] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isCopied, setIsCopied] = React.useState(false);

  const generateCode = () => {
    // Generate a 6-digit random code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSend = () => {
    if (files.length === 0) return;

    // Simulate upload/send process
    const newCode = generateCode();
    setCode(newCode);
    setIsSent(true);
    toast.success("Files ready to share!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendMore = () => {
    setIsSent(false);
    setFiles([]);
    setCode("");
  };

  const onFileValidate = React.useCallback(
    (file: File): string | null => {
      // Validate max files
      if (files.length >= 2) {
        return "You can only upload up to 2 files";
      }

      // Validate file type (only images)
      if (!file.type.startsWith("image/")) {
        return "Only image files are allowed";
      }

      // Validate file size (max 2MB)
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_SIZE) {
        return `File size must be less than ${MAX_SIZE / (1024 * 1024)}MB`;
      }

      return null;
    },
    [files]
  );

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast(message, {
      description: `"${
        file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name
      }" has been rejected`,
    });
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="relative">
          {!isSent && (
            <Link
              href="/"
              className="absolute left-6 top-6 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
          )}
          <CardTitle className="text-center text-2xl">
            {isSent ? "Ready to Receive" : "Send Files"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSent
              ? "Share this code with the receiver"
              : "Upload files to generate a share code"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSent ? (
            <div className="space-y-6">
              <FileUpload
                value={files}
                onValueChange={setFiles}
                onFileValidate={onFileValidate}
                onFileReject={onFileReject}
                accept="image/*"
                maxFiles={2}
                className="w-full"
                multiple
              >
                <FileUploadDropzone>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center rounded-full border p-2.5">
                      <Upload className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-sm">
                      Drag & drop files here
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Or click to browse (max 2 files)
                    </p>
                  </div>
                  <FileUploadTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-2 w-fit">
                      Browse files
                    </Button>
                  </FileUploadTrigger>
                </FileUploadDropzone>
                <FileUploadList>
                  {files.map((file) => (
                    <FileUploadItem key={file.name} value={file}>
                      <FileUploadItemPreview />
                      <FileUploadItemMetadata />
                      <FileUploadItemDelete asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <X />
                        </Button>
                      </FileUploadItemDelete>
                    </FileUploadItem>
                  ))}
                </FileUploadList>
              </FileUpload>

              <Button
                className="w-full"
                onClick={handleSend}
                disabled={files.length === 0}
              >
                Get Share Code
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="text-6xl font-bold tracking-widest font-mono py-8 select-all">
                  {code}
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter this code on the receiving device
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleCopyCode}
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
