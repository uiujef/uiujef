"use client";

import React from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CloudinaryUploaderProps {
  onUploadSuccess: (url: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: any) => void;
  onUploadClose?: () => void;
  folder?: string;
  className?: string;
  buttonText?: string;
  multiple?: boolean;
  resourceType?: "image" | "video" | "auto";
}

export function CloudinaryUploader({
  onUploadSuccess,
  onUploadStart,
  onUploadError,
  onUploadClose,
  folder = "uiujef",
  className,
  buttonText = "Upload Image",
  multiple = false,
  resourceType = "image"
}: CloudinaryUploaderProps) {
  return (
    <div className={cn("relative group inline-block w-full", className)}>
      <CldUploadWidget
        uploadPreset="uiujef_preset"
        options={{
          autoUpload: false,
          folder: folder,
          maxFiles: multiple ? 50 : 1,
          resourceType: resourceType,
          clientAllowedFormats: resourceType === "image" ? ["png", "jpeg", "jpg", "webp", "gif"] : undefined,
          maxFileSize: 10 * 1024 * 1024,
          showCompletedButton: true,
        }}
        onSuccess={(result: any) => {
          toast.success("Image uploaded successfully!");
          if (result?.info?.secure_url) {
            onUploadSuccess(result.info.secure_url);
          }
        }}
        onError={(error: any) => {
          console.error("Cloudinary Upload Error:", error);
          toast.error("Image upload failed. Check console for details.");
          if (onUploadError) onUploadError(error);
        }}
        onUploadAdded={() => {
          if (onUploadStart) onUploadStart();
        }}
        onClose={() => {
          if (onUploadClose) onUploadClose();
        }}
      >
        {({ open, isLoading }) => (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              open();
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20 rounded-xl transition-all hover:bg-[#F26522]/20 w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        )}
      </CldUploadWidget>
    </div>
  );
}
