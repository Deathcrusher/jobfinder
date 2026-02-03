import type { Job } from "@/lib/jobs";

const scoreJob = (job: Job) => {
  let score = 0;
  if (job.isRemote) score += 15;
  score += job.tags.length * 5;
  if (job.tags.includes("quereinsteiger")) score += 10;
  if (job.tags.includes("ohne-vorkenntnisse")) score += 8;
  if (job.tags.includes("ohne-kundenkontakt")) score += 6;
  if (job.tags.includes("beauty")) score += 4;
  return score;
};

const applyHeuristicRanking = (jobs: Job[]) =>
  jobs.map((job) => ({ ...job, rankScore: scoreJob(job) }));

const parseScores = (payload: string) => {
  try {
    const data = JSON.parse(payload) as { id: string; score: number }[];
    return new Map(data.map((item) => [item.id, item.score]));
  } catch {
    return null;
  }
};

export const rankJobs = async (jobs: Job[]) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return applyHeuristicRanking(jobs);
  }

  const sliced = jobs.slice(0, 50);
  const input = sliced.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    summary: job.summary,
    tags: job.tags,
  }));

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Du bist ein Job-Ranking-Assistent. Bewerte Jobs für Quereinsteiger in Innsbruck oder Remote. Gib nur JSON zurück.",
          },
          {
            role: "user",
            content: `Bewerte jeden Job von 0-100 (höher ist besser). Gib eine JSON-Liste zurück wie [{"id":"...","score":87}].\n\nJobs:\n${JSON.stringify(
              input
            )}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return applyHeuristicRanking(jobs);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const scores = parseScores(content);
    if (!scores) {
      return applyHeuristicRanking(jobs);
    }

    return jobs.map((job) => ({
      ...job,
      rankScore: scores.get(job.id) ?? scoreJob(job),
    }));
  } catch {
    return applyHeuristicRanking(jobs);
  }
};
