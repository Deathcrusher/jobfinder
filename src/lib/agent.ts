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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const keywordVariants = (keyword: string) => {
  const normalized = normalizeText(keyword);
  const compact = normalized.replace(/\s+/g, "");
  return Array.from(new Set([normalized, compact])).filter(Boolean);
};

export const rankJobsForAgent = (
  jobs: Job[],
  preferences: AgentPreferences
) => {
  const includeKeywords = normalizeKeywords(preferences.includeKeywords);
  const excludeKeywords = normalizeKeywords(preferences.excludeKeywords);

  const fieldWeights = [
    { key: "title", weight: 20 },
    { key: "tags", weight: 18 },
    { key: "summary", weight: 10 },
    { key: "company", weight: 8 },
    { key: "location", weight: 6 },
  ] as const;

  return jobs
    .map((job) => {
      const fieldText = {
        title: normalizeText(job.title),
        tags: normalizeText(job.tags.join(" ")),
        summary: normalizeText(job.summary),
        company: normalizeText(job.company),
        location: normalizeText(job.location),
      };
      const flattenedText = normalizeText(jobText(job));
      const flattenedCompact = flattenedText.replace(/\s+/g, "");
      const matchesKeyword = (keyword: string) => {
        const variants = keywordVariants(keyword);
        return variants.some(
          (variant) =>
            flattenedText.includes(variant) || flattenedCompact.includes(variant)
        );
      };
      const includeMatches = includeKeywords.filter(matchesKeyword);
      const excludeMatches = excludeKeywords.filter(matchesKeyword);
      const remoteBoost =
        preferences.preferRemote === "any"
          ? 0
          : preferences.preferRemote === "remote" && job.isRemote
            ? 12
            : preferences.preferRemote === "onsite" && !job.isRemote
              ? 8
              : -8;
      const keywordScore = includeMatches.reduce((total, keyword) => {
        const variants = keywordVariants(keyword);
        const fieldScore = fieldWeights.reduce((sum, field) => {
          const text = fieldText[field.key];
          const compact = text.replace(/\s+/g, "");
          const matched = variants.some(
            (variant) => text.includes(variant) || compact.includes(variant)
          );
          return sum + (matched ? field.weight : 0);
        }, 0);
        return total + fieldScore;
      }, 0);
      const excludePenalty = excludeMatches.reduce((total, keyword) => {
        const variants = keywordVariants(keyword);
        const titleOrTags =
          variants.some((variant) =>
            fieldText.title.includes(variant)
          ) ||
          variants.some((variant) => fieldText.tags.includes(variant));
        return total + (titleOrTags ? 40 : 25);
      }, 0);
      const score =
        (job.rankScore ?? 0) +
        keywordScore +
        remoteBoost -
        excludePenalty;

      return {
        job,
        score,
        includeMatches,
        excludeMatches,
        remoteBoost,
      };
    })
    .filter(({ includeMatches, excludeMatches }) => {
      if (excludeMatches.length > 0) return false;
      if (includeKeywords.length === 0) return true;
      return includeMatches.length > 0;
    })
    .sort((a, b) => b.score - a.score)
    .map(({ job, score, includeMatches, remoteBoost }) => ({
      ...job,
      agentScore: score,
      agentMatches: includeMatches,
      agentRemoteBoost: remoteBoost,
    }));
};
