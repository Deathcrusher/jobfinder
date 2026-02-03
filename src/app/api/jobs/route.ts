import { NextResponse } from "next/server";

import { getJobs } from "@/lib/jobs";

export const runtime = "nodejs";

export const GET = async () => {
  const jobs = await getJobs();
  return NextResponse.json(jobs);
};
