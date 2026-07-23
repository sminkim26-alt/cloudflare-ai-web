export async function GET() {
  return Response.json({
    CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID ? "set" : "missing",
    CF_WORKERS_AI_TOKEN: process.env.CF_WORKERS_AI_TOKEN ? "set" : "missing",
    VERCEL_OIDC_TOKEN: process.env.VERCEL_OIDC_TOKEN ? "set" : "missing",
    NODE_ENV: process.env.NODE_ENV,
  });
}
