import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildId() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_BUILD_ID ||
    "dev"
  );
}

export async function GET() {
  return NextResponse.json(
    { v: buildId() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
