"use client";

import React, { useState } from "react";
import { IKContext, IKUpload } from "imagekitio-next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;

const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit/auth");
    if (!response.ok) {
      throw new Error(`Authentication error: ${response.statusText}`);
    }
    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

interface ImageKitUploaderProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
  className?: string;
  buttonText?: string;
}

export function ImageKitUploader({
  onUploadSuccess,
  folder = "/uiujef",
  className,
  buttonText = "Upload Image"
}: ImageKitUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onError = (err: any) => {
    setIsUploading(false);
    setProgress(0);
    toast.error("Image upload failed: " + (err?.message || "Unknown error"));
  };

  const onSuccess = (res: any) => {
    setIsUploading(false);
    setProgress(0);
    toast.success("Image uploaded successfully!");
    if (res.url) {
      onUploadSuccess(res.url);
    }
  };

  const onUploadStart = () => {
    setIsUploading(true);
    setProgress(0);
  };

  const onUploadProgress = (evt: any) => {
    if (evt.lengthComputable) {
      setProgress(Math.round((evt.loaded / evt.total) * 100));
    }
  };

  return (
    <IKContext
      urlEndpoint={urlEndpoint}
      publicKey={publicKey}
      authenticator={authenticator}
    >
      <div className={cn("relative group cursor-pointer inline-block", className)}>
        <IKUpload
          fileName={`upload_${Date.now()}.png`}
          folder={folder}
          useUniqueFileName={true}
          validateFile={(file) => {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
              toast.error("File size must be less than 5MB");
              return false;
            }
            if (!file.type.startsWith('image/')) {
              toast.error("File must be an image");
              return false;
            }
            return true;
          }}
          onError={onError}
          onSuccess={onSuccess}
          onUploadStart={onUploadStart}
          onUploadProgress={onUploadProgress}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept="image/*"
        />
        
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-[#F26522] bg-[#F26522]/10 border border-[#F26522]/20 rounded-xl transition-all group-hover:bg-[#F26522]/20">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading {progress}%</span>
            </>
          ) : (
            <span>{buttonText}</span>
          )}
        </div>
      </div>
    </IKContext>
  );
}
