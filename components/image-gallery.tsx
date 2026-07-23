"use client";

import Image from "next/image";
import { Download, X } from "lucide-react";
import { useState } from "react";
import type { Message } from "@/lib/db";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ImageGallery({
  messages,
  className,
}: {
  messages: Message[];
  className?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const imageUrls: { url: string; prompt: string }[] = [];
  for (const msg of messages) {
    if (msg.role === "user") {
      const textPart = msg.parts.find((p) => p.type === "text");
      const lastPrompt = textPart?.type === "text" ? textPart.text : "";
      const nextMsg = messages[messages.indexOf(msg) + 1];
      if (nextMsg?.role === "assistant") {
        for (const part of nextMsg.parts) {
          if (part.type === "data-images") {
            const urls = (part.data as { urls?: string[] }).urls ?? [];
            for (const url of urls) {
              imageUrls.push({ url, prompt: lastPrompt });
            }
          }
        }
      }
    }
  }

  if (imageUrls.length === 0) return null;

  return (
    <>
      <div
        className={cn(
          "columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3",
          className,
        )}
      >
        {imageUrls.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer hover:ring-2 ring-primary/50 transition-all"
            onClick={() => setSelected(img.url)}
          >
            <Image
              src={img.url}
              alt={img.prompt}
              width={512}
              height={512}
              className="w-full h-auto block"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
              <span className="text-white text-xs line-clamp-2">
                {img.prompt}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selected}
              alt=""
              width={1024}
              height={1024}
              className="max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = selected;
                  a.download = "generated-image.png";
                  a.click();
                }}
              >
                <Download className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={() => setSelected(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
