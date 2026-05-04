import { NextRequest, NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { requireAdmin } from "@/lib/api-auth";

export const runtime = "nodejs";

interface Body {
  title?: string;
  body?: string;
  labels?: string[];
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireAdmin(req);
  if (errorResponse) return errorResponse;

  const token = process.env.GITHUB_TOKEN;
  const repoFull = process.env.GITHUB_REPO;
  if (!token || !repoFull) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN, GITHUB_REPO 환경변수가 필요합니다." },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "잘못된 본문" }, { status: 400 });
  }
  if (!body.title) {
    return NextResponse.json({ error: "title 필수" }, { status: 400 });
  }

  const [owner, repo] = repoFull.split("/");
  const octokit = new Octokit({ auth: token });

  try {
    const res = await octokit.issues.create({
      owner,
      repo,
      title: body.title,
      body: body.body ?? "",
      labels: body.labels ?? ["bug", "from-feedback-widget"],
    });
    return NextResponse.json({
      ok: true,
      issueNumber: res.data.number,
      url: res.data.html_url,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "GitHub API 실패" },
      { status: 500 },
    );
  }
}
