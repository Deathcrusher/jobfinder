import type { Job } from "@/lib/jobs";

export type AgentPreferences = {
  includeKeywords: string[];
  excludeKeywords: string[];
  preferRemote: "any" | "remote" | "onsite";
};

const normalizeKeywords = (values: string[]) =>
  values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 1);

export const parseKeywords = (input: string) =>
  normalizeKeywords(input.split(/[,\n]/g));

const jobText = (job: Job) =>
  [job.title, job.company, job.location, job.summary, job.tags.join(" ")]
    .join(" ")
    .toLowerCase();

export const rankJobsForAgent = (
  jobs: Job[],
  preferences: AgentPreferences
) => {
  const includeKeywords = normalizeKeywords(preferences.includeKeywords);
  const excludeKeywords = normalizeKeywords(preferences.excludeKeywords);

  return jobs
    .map((job) => {
      const text = jobText(job);
      const includeMatches = includeKeywords.filter((keyword) =>
        text.includes(keyword)
      );
      const excludeMatches = excludeKeywords.filter((keyword) =>
        text.includes(keyword)
      );
      const remoteBoost =
        preferences.preferRemote === "any"
          ? 0
          : preferences.preferRemote === "remote" && job.isRemote
            ? 12
            : preferences.preferRemote === "onsite" && !job.isRemote
              ? 8
              : -8;
      const score =
        (job.rankScore ?? 0) +
        includeMatches.length * 15 +
        remoteBoost -
        excludeMatches.length * 30;

      return {
        job,
        score,
        includeMatches,
        excludeMatches,
      };
    })
    .filter(({ includeMatches, excludeMatches }) => {
      if (excludeMatches.length > 0) return false;
      if (includeKeywords.length === 0) return true;
      return includeMatches.length > 0;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ job, score }) => ({ ...job, agentScore: score }));
};
