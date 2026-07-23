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

const IMAGE_MODELS = [
  "@cf/black-forest-labs/flux-1-schnell",
  "@cf/leonardo/lucid-origin",
  "@cf/bytedance/stable-diffusion-xl-lightning",
] as const;

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  return Uint8Array.from(binaryString, (m) => m.codePointAt(0) ?? 0);
}

function dataUrlFromBase64(base64: string) {
  return `data:image/png;base64,${base64}`;
}

async function generateImage(prompt: string, imageModel?: string) {
  const model = imageModel && IMAGE_MODELS.includes(imageModel as any)
    ? imageModel
    : "@cf/black-forest-labs/flux-1-schnell";

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${model}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CF_WORKERS_AI_TOKEN}`,
      },
      method: "POST",
      body: JSON.stringify({ prompt }),
    },
  );

  if (!res.ok) {
    throw new Error(`Image generation failed: ${res.status}`);
  }

  if (
    model === "@cf/lykon/dreamshaper-8-lcm" ||
    model === "@cf/bytedance/stable-diffusion-xl-lightning"
  ) {
    const buffer = await res.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(buffer)),
    );
    return dataUrlFromBase64(base64);
  }

  const data = (await res.json()) as {
    result: { image: string };
  };
  return dataUrlFromBase64(data.result.image);
}

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
            "Generate an image using Cloudflare Workers AI. Use this when the user asks to create, draw, or generate an image, picture, logo, or artwork.",
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
          execute: async ({ prompt }: { prompt: string }): Promise<{ imageUrl: string } | { error: string }> => {
            try {
              const imageUrl = await generateImage(prompt);
              return { imageUrl };
            } catch (error: any) {
              return { error: error.message };
            }
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
      "After generating an image, show it to the user using markdown image syntax: ![description](imageUrl).",
    ].join("\n"),
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
