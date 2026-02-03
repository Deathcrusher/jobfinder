export type JobTag =
  | "quereinsteiger"
  | "home-office"
  | "ohne-vorkenntnisse"
  | "ohne-kundenkontakt"
  | "beauty";

export type JobSource =
  | "Karriere.at"
  | "StepStone"
  | "LinkedIn"
  | "ÖH Jobbörse"
  | "AMS"
  | "Company"
  | "Remotive"
  | "Arbeitnow"
  | "Jobs TT"
  | "Tirolerjobs"
  | "Willkommen Tirol"
  | "Uni Innsbruck"
  | "MCI Career Center"
  | "Industrie Tirol"
  | "Startup Tirol"
  | "Tirol GV"
  | "Innsbruck GV"
  | "IKB"
  | "Tirol Kliniken"
  | "MetaJob"
  | "Indeed";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  postedAt: string;
  source: JobSource;
  tags: JobTag[];
  url: string;
  summary: string;
  rankScore?: number;
};

export const jobFilters: { id: JobTag; label: string; description: string }[] = [
  {
    id: "quereinsteiger",
    label: "Quereinsteiger",
    description: "Ideal für einen Neustart ohne klassische Ausbildung.",
  },
  {
    id: "home-office",
    label: "Home-Office",
    description: "Flexible Jobs mit Remote-Anteil.",
  },
  {
    id: "ohne-vorkenntnisse",
    label: "Ohne Vorkenntnisse",
    description: "Einstiegsrollen mit kurzer Einarbeitung.",
  },
  {
    id: "ohne-kundenkontakt",
    label: "Ohne Kundenkontakt",
    description: "Fokus auf Backoffice oder interne Aufgaben.",
  },
  {
    id: "beauty",
    label: "Beautyjobs",
    description: "Kosmetik, Studio, Wellness oder Beauty-Tech.",
  },
];

const innsbruckLocations = ["Innsbruck", "Innsbruck-Land", "Tirol"];

type RemotiveResponse = {
  jobs: RemotiveJob[];
};

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  candidate_required_location: string;
  publication_date: string;
  tags: string[];
  job_url: string;
  description: string;
  category: string;
};

type ArbeitnowResponse = {
  data: ArbeitnowJob[];
};

type ArbeitnowJob = {
  slug: string;
  title: string;
  company_name: string;
  location: string;
  created_at: string;
  tags: string[];
  description: string;
  remote: boolean;
  url: string;
};

const remotiveEndpoint = "https://remotive.com/api/remote-jobs";
const arbeitnowEndpoint = "https://www.arbeitnow.com/api/job-board-api";

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const buildSummary = (job: RemotiveJob) => {
  const cleaned = stripHtml(job.description);
  if (!cleaned) {
    return `${job.title} bei ${job.company_name}.`;
  }
  return cleaned.length > 200 ? `${cleaned.slice(0, 197)}…` : cleaned;
};

const deriveTags = (job: RemotiveJob, isRemote: boolean): JobTag[] => {
  const tagSet = new Set<JobTag>();
  const combined = [
    job.title,
    job.company_name,
    job.category,
    ...job.tags,
  ]
    .join(" ")
    .toLowerCase();

  if (isRemote) {
    tagSet.add("home-office");
  }

  if (
    combined.includes("junior") ||
    combined.includes("entry") ||
    combined.includes("trainee") ||
    combined.includes("assistant")
  ) {
    tagSet.add("quereinsteiger");
    tagSet.add("ohne-vorkenntnisse");
  }

  if (
    combined.includes("backoffice") ||
    combined.includes("data") ||
    combined.includes("qa") ||
    combined.includes("accounting") ||
    combined.includes("finance") ||
    combined.includes("analytics") ||
    combined.includes("engineering")
  ) {
    tagSet.add("ohne-kundenkontakt");
  }

  if (
    combined.includes("beauty") ||
    combined.includes("cosmetic") ||
    combined.includes("wellness") ||
    combined.includes("skincare")
  ) {
    tagSet.add("beauty");
  }

  return Array.from(tagSet);
};

const normalizeLocation = (value: string) =>
  value.toLowerCase().includes("remote") ||
  value.toLowerCase().includes("anywhere")
    ? "Remote"
    : value;

const normalizeDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : value;
};

export const getJobs = async (): Promise<Job[]> => {
  try {
    const [{ scrapeJobs }, remotiveResponse, arbeitnowResponse] = await Promise.all([
      import("@/lib/scrapers"),
      fetch(remotiveEndpoint, { next: { revalidate: 3600 } }),
      fetch(arbeitnowEndpoint, { next: { revalidate: 3600 } }),
    ]);

    const remotiveData = remotiveResponse.ok
      ? ((await remotiveResponse.json()) as RemotiveResponse)
      : { jobs: [] };

    const arbeitnowData = arbeitnowResponse.ok
      ? ((await arbeitnowResponse.json()) as ArbeitnowResponse)
      : { data: [] };

    const remotiveJobs = remotiveData.jobs.map((job) => {
      const location = normalizeLocation(job.candidate_required_location);
      const isRemote = location === "Remote";
      return {
        id: `remotive-${job.id}`,
        title: job.title,
        company: job.company_name,
        location,
        isRemote,
        postedAt: normalizeDate(job.publication_date),
        source: "Remotive",
        tags: deriveTags(job, isRemote),
        url: job.job_url,
        summary: buildSummary(job),
      } satisfies Job;
    });

    const arbeitnowJobs = arbeitnowData.data.map((job) => {
      const location = normalizeLocation(job.location);
      const isRemote = job.remote || location === "Remote";
      return {
        id: `arbeitnow-${job.slug}`,
        title: job.title,
        company: job.company_name,
        location: isRemote ? "Remote" : location,
        isRemote,
        postedAt: normalizeDate(job.created_at),
        source: "Arbeitnow",
        tags: deriveTags(
          {
            id: 0,
            title: job.title,
            company_name: job.company_name,
            candidate_required_location: location,
            publication_date: job.created_at,
            tags: job.tags,
            job_url: job.url,
            description: job.description,
            category: job.tags[0] ?? "General",
          },
          isRemote
        ),
        url: job.url,
        summary: buildSummary({
          id: 0,
          title: job.title,
          company_name: job.company_name,
          candidate_required_location: location,
          publication_date: job.created_at,
          tags: job.tags,
          job_url: job.url,
          description: job.description,
          category: job.tags[0] ?? "General",
        }),
      } satisfies Job;
    });

    const scrapedJobs = await scrapeJobs();
    const combinedJobs = [...remotiveJobs, ...arbeitnowJobs, ...scrapedJobs];
    const uniqueJobs = Array.from(
      new Map(
        combinedJobs.map((job) => [
          `${job.title}-${job.company}-${job.url}`,
          job,
        ])
      ).values()
    );

    const { rankJobs } = await import("@/lib/ranking");
    return await rankJobs(uniqueJobs);
  } catch (error) {
    console.error("Failed to load jobs", error);
    return [];
  }
};

export const matchesLocationRules = (job: Job) => {
  if (job.isRemote) return true;
  return innsbruckLocations.some((place) => job.location.includes(place));
};

export const filterJobs = (jobs: Job[], activeTags: JobTag[]) => {
  return jobs
    .filter(matchesLocationRules)
    .filter((job) =>
      activeTags.length === 0
        ? true
        : activeTags.every((tag) => job.tags.includes(tag))
    )
    .sort(
      (a, b) =>
        (b.rankScore ?? 0) - (a.rankScore ?? 0) ||
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
};
