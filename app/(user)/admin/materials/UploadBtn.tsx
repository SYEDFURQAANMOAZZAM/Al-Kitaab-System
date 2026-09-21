"use client";

import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CloudUpload, Plus, X } from "lucide-react";

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.mp4";
const MAX_SIZE = 50 * 1024 * 1024;

export default function MaterialUploadDialog() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const validateFile = (selectedFile: File) => {
    setError("");

    if (selectedFile.size > MAX_SIZE) {
      setError("File size must be less than 50 MB.");
      return false;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "video/mp4",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only JPEG, PNG, PDF and MP4 files are allowed.");
      return false;
    }

    return true;
  };

  const handleFile = (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    // Later:
    // const formData = new FormData();
    // formData.append("file", file);
    // await uploadMaterial(formData);

    console.log("Uploading:", file);
  };

  return (
    <Dialog.Root>
      {/* Upload New button */}
      <Dialog.Trigger
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Upload New
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" />

        <Dialog.Popup
          className="
            fixed left-1/2 top-1/2 z-50
            w-[calc(100%-2rem)] max-w-lg
            -translate-x-1/2 -translate-y-1/2
            rounded-xl border bg-background
            p-6 shadow-xl
            outline-none
          "
        >
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                Upload Material
              </Dialog.Title>

              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Upload a study material for your students.
              </Dialog.Description>
            </div>

            <Dialog.Close
              className="
                rounded-md p-1.5
                text-muted-foreground
                transition hover:bg-muted hover:text-foreground
              "
              aria-label="Close"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          {/* Upload area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              rounded-xl border-2 border-dashed
              p-8 text-center transition
              ${
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/20"
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];

                if (selectedFile) {
                  handleFile(selectedFile);
                }
              }}
            />

            {!file ? (
              <>
                {/* Upload icon */}
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                  <CloudUpload className="size-5 text-muted-foreground" />
                </div>

                <p className="text-sm font-medium">
                  Choose a file or drag & drop it here
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG, PDF, and MP4 formats, up to 50 MB.
                </p>

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="
                    mt-5 inline-flex h-10 items-center
                    rounded-md border bg-background
                    px-5 text-sm font-medium
                    shadow-sm transition
                    hover:bg-muted
                  "
                >
                  Browse File
                </button>
              </>
            ) : (
              <div className="text-left">
                <p className="text-sm font-medium">Selected file</p>

                <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/40 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="ml-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close
              className="
                inline-flex h-10 items-center
                rounded-md border px-4
                text-sm font-medium
                hover:bg-muted
              "
            >
              Cancel
            </Dialog.Close>

            <button
              type="button"
              disabled={!file}
              onClick={handleUpload}
              className="
                inline-flex h-10 items-center
                rounded-md bg-primary
                px-5 text-sm font-semibold text-primary-foreground
                transition hover:bg-primary/90
                disabled:pointer-events-none
                disabled:opacity-50
              "
            >
              Upload Material
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}