import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface FileUploadProps {
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
    maxSizeMB?: number; // MB
    acceptedFileTypes?: Record<string, string[]>;
    className?: string;
}

export function FileUpload({
    onFilesChange,
    maxFiles = 5,
    maxSizeMB = 10,
    acceptedFileTypes = {
        "application/pdf": [".pdf"],
        "text/plain": [".txt", ".md"],
        "text/markdown": [".md"],
    },
    className,
}: FileUploadProps) {
    const [files, setFiles] = React.useState<File[]>([]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
            setFiles(newFiles);
            onFilesChange(newFiles);
        },
        [files, maxFiles, onFilesChange]
    );

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        onFilesChange(newFiles);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedFileTypes,
        maxSize: maxSizeMB * 1024 * 1024,
        maxFiles,
    });

    return (
        <div className={cn("w-full space-y-4", className)}>
            {/* Warning */}
            <div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning/5 p-4 text-sm text-warning-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <div>
                    <p className="font-medium text-warning">Files are temporary</p>
                    <p className="mt-1 text-text-secondary">
                        Uploaded documents will be automatically deleted after 5 days. They
                        are only used to improve audience analysis. Export your results to
                        keep them permanently.
                    </p>
                </div>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-bg-secondary p-8 transition-colors hover:border-accent/50 hover:bg-accent/5",
                    isDragActive && "border-accent bg-accent/5"
                )}
            >
                <input {...getInputProps()} />
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <UploadCloud className="h-6 w-6 text-accent" />
                </div>
                <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-text-primary">
                        Click to upload or drag and drop
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                        PDF, TXT, MD (max {maxSizeMB}MB each)
                    </p>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <ul className="space-y-2">
                    {files.map((file, index) => (
                        <li
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-md border border-border bg-white p-3 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-secondary">
                                    <FileText className="h-4 w-4 text-text-secondary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB • Expires in 5 days
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFile(index)}
                                className="h-8 w-8 text-text-secondary hover:text-error"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
