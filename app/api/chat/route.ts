import type { LanguageModelV3 } from "@ai-sdk/provider";
import {
  convertToModelMessages,
  extractReasoningMiddleware,
  jsonSchema,
  stepCountIs,
  streamText,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";
import { aigateway, google, workersai } from "@/app/api";
import type { Message } from "@/lib/db";
import type { Model } from "@/lib/models";
import { executeCode } from "ai-sdk-tool-code-execution";

const chatSchema = z.object({
  messages: z.array(z.any()).min(1),
  model: z.string().min(1),
  provider: z.enum(["workers-ai", "google"]),
  search: z.boolean().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return new Response("Invalid request data", { status: 400 });
  }

  const { messages, model, provider, search } = parsed.data as {
    messages: Message[];
    model: Model["id"];
    provider: Model["provider"];
    search?: boolean;
  };

  let providerModel: LanguageModelV3;
  const tools = {};
  switch (provider) {
    case "google":
      providerModel = aigateway([google.chat(model)]);

      Object.assign(tools, {
        ...(search ? { google_search: google.tools.googleSearch({}) } : {}),
      });
      break;
    case "workers-ai":
      providerModel = wrapLanguageModel({
        model: workersai.chat(model),
        middleware: extractReasoningMiddleware({
          tagName: "think",
          startWithReasoning: model === "@cf/qwen/qwq-32b",
        }),
      });

      Object.assign(tools, {
        generate_image: {
          description:
            "Generate an image using Cloudflare Workers AI. Use this when the user asks to create, draw, or generate an image, picture, logo, or artwork. The imageUrl in the result is a relative URL path to display as a markdown image.",
          inputSchema: jsonSchema({
            type: "object",
            properties: {
              prompt: {
                type: "string",
                description: "A detailed text description of the image to generate",
              },
            },
            required: ["prompt"],
          }),
          execute: async ({ prompt }: { prompt: string }) => {
            const encoded = encodeURIComponent(prompt);
            const imageUrl = `/api/image/generate?prompt=${encoded}`;
            return { imageUrl };
          },
        },
      });

      if (process.env.VERCEL_OIDC_TOKEN) {
        Object.assign(tools, {
          executeCode: executeCode(),
        });
      }
      break;
    default:
      return new Response(`Unsupported provider: ${provider}`, { status: 400 });
  }

  const result = streamText({
    model: providerModel,
    messages: await convertToModelMessages(messages),
    system: [
      "You are a helpful assistant. Follow the user's instructions carefully. Respond using Markdown.",
      "When the user asks you to generate, create, draw, or make an image, picture, logo, illustration, or artwork, use the generate_image tool.",
      "After the generate_image tool returns a result with an imageUrl field, you MUST display it using markdown image syntax like this: ![description](THE_ACTUAL_URL_VALUE_FROM_IMAGE_URL_FIELD). Use the exact URL string from the imageUrl field, not the field name itself.",
    ].join("\n"),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
