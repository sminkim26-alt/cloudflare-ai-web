export async function GET() {
  const results: Record<string, string> = {};

  results.CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID ? "set" : "missing";
  results.CF_WORKERS_AI_TOKEN = process.env.CF_WORKERS_AI_TOKEN ? "set" : "missing";
  results.VERCEL_OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN ? "set" : "missing";

  try {
    const { workersai } = await import("@/app/api");
    results.workersai_import = "ok";
  } catch (e: any) {
    results.workersai_import = "FAILED: " + e.message;
  }

  try {
    const { executeCode } = await import("ai-sdk-tool-code-execution");
    results.executeCode_import = "ok";
  } catch (e: any) {
    results.executeCode_import = "FAILED: " + e.message;
  }

  try {
    const ai = await import("ai");
    results.ai_import = "ok";
  } catch (e: any) {
    results.ai_import = "FAILED: " + e.message;
  }

  return Response.json(results);
}
