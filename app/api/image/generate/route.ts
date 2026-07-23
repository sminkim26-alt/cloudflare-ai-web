import { models } from "@/lib/models";

const imageModels = models
  .filter((m) => m.type === "Text to Image")
  .map((m) => m.id);

const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get("prompt");
  const model = searchParams.get("model");

  if (!prompt) {
    return new Response("Missing prompt parameter", { status: 400 });
  }

  const selectedModel =
    model && imageModels.includes(model) ? model : IMAGE_MODEL;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${selectedModel}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CF_WORKERS_AI_TOKEN}`,
        },
        method: "POST",
        body: JSON.stringify({ prompt }),
      },
    );

    if (!res.ok) {
      return new Response("Image generation failed", { status: 500 });
    }

    if (
      selectedModel === "@cf/lykon/dreamshaper-8-lcm" ||
      selectedModel === "@cf/bytedance/stable-diffusion-xl-lightning"
    ) {
      return new Response(res.body, {
        headers: { "Content-Type": "image/png" },
      });
    }

    const data = (await res.json()) as { result: { image: string } };
    const binaryString = atob(data.result.image);
    const bytes = Uint8Array.from(binaryString, (m) => m.codePointAt(0) ?? 0);
    return new Response(bytes, {
      headers: { "Content-Type": "image/png" },
    });
  } catch {
    return new Response("Image generation error", { status: 500 });
  }
}
