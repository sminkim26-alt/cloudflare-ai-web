"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState, ViewTransition } from "react";
import ChatInput, { type onSendMessageProps } from "@/components/chat-input";
import ChatLayout from "@/components/chat-layout";
import ImageGallery from "@/components/image-gallery";
import SuggestionChips from "@/components/suggestion-chips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { useImage } from "@/hooks/use-image";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { models } from "@/lib/models";

const Page = () => {
  const { chatListRef, showToBottom, scrollToBottom } = useScrollToBottom();
  const { status, sendPrompt, messages, regenerate } = useImage({
    onUnauthorized: () => setAuthDialogOpen(true),
  });
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  const onSendMessage = async ({ text }: onSendMessageProps) => {
    scrollToBottom();
    await sendPrompt(text);
    setTimeout(() => scrollToBottom(), 200);
  };

  const hasImages = messages.some(
    (m) =>
      m.role === "assistant" &&
      m.parts.some((p) => p.type === "data-images"),
  );

  return (
    <ChatLayout
      chatListRef={chatListRef}
      showToBottom={showToBottom}
      scrollToBottom={scrollToBottom}
      authDialogOpen={authDialogOpen}
      setAuthDialogOpen={setAuthDialogOpen}
      bottomBar={
        <ViewTransition name="chat-input">
          <ChatInput
            models={models.filter((i) => i.type === "Text to Image")}
            className="mx-auto max-w-2xl bg-background shadow-xl"
            onSendMessage={onSendMessage}
            status={status}
            modalKey="CF_AI_MODEL_IMAGE"
            onRetry={regenerate}
          />
        </ViewTransition>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center pt-4">
          <TabsList>
            <TabsTrigger value="create">Create an image</TabsTrigger>
            <TabsTrigger value="myimages">My images</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="create">
          {!hasImages && status === "ready" ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="size-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Sparkles className="size-7 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Images</h1>
                <p className="text-muted-foreground max-w-md">
                  Create anything you can imagine with AI. Pick a suggestion or
                  describe your own.
                </p>
              </div>
              <SuggestionChips
                onSelect={(text) => {
                  scrollToBottom();
                  sendPrompt(text);
                }}
              />
            </div>
          ) : (
            <div className="max-w-5xl mx-auto pt-10 pb-60 px-4 space-y-6">
              {messages.map((msg) => {
                if (msg.role === "user") {
                  const textPart = msg.parts.find((p) => p.type === "text");
                  if (textPart?.type === "text") {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-secondary px-4 py-2 rounded-2xl rounded-br-sm max-w-[80%] text-sm">
                          {textPart.text}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })}

              <ImageGallery messages={messages} />

              {status === "submitted" && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="size-5 animate-spin text-primary" />
                  <TextShimmer duration={1.5}>Generating your image...</TextShimmer>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="myimages">
          <div className="max-w-5xl mx-auto pt-10 pb-60 px-4">
            <div className="flex flex-col items-center gap-3 text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight">My images</h1>
              <p className="text-muted-foreground">
                All your generated images in one place.
              </p>
            </div>
            {messages.some((m) =>
              m.role === "assistant" &&
              m.parts.some((p) => p.type === "data-images"),
            ) ? (
              <ImageGallery messages={messages} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Sparkles className="size-10 mb-4 opacity-50" />
                <p>No images yet. Create your first image!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ChatLayout>
  );
};

export default Page;
