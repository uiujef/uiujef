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
  folder?: string;
  className?: string;
  buttonText?: string;
}

export function CloudinaryUploader({
  onUploadSuccess,
  onUploadStart,
  onUploadError,
  folder = "uiujef",
  className,
  buttonText = "Upload Image"
}: CloudinaryUploaderProps) {
  return (
    <div className={cn("relative group inline-block w-full", className)}>
      <CldUploadWidget
        uploadPreset="uiujef_preset"
        options={{
          folder: folder,
          maxFiles: 1,
          resourceType: "image",
          clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "gif"],
          maxFileSize: 5 * 1024 * 1024,
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
        onOpen={() => {
          if (onUploadStart) onUploadStart();
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
