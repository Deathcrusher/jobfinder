import * as cheerio from "cheerio";

import type { Job, JobSource, JobTag } from "@/lib/jobs";

type ScrapeSite = {
  source: JobSource;
  url: string;
  selectors?: {
    item: string;
    title?: string;
    link?: string;
    location?: string;
  };
};

const sites: ScrapeSite[] = [
  { source: "Jobs TT", url: "https://jobs.tt.com" },
  { source: "Tirolerjobs", url: "https://tirolerjobs.at" },
  { source: "Willkommen Tirol", url: "https://willkommen.tirol" },
  { source: "ÖH Jobbörse", url: "https://jobs.oehweb.at" },
  {
    source: "Uni Innsbruck",
    url: "https://www.uibk.ac.at/de/karriere/stellenangebote/",
  },
  {
    source: "MCI Career Center",
    url: "https://www.mci4me.at/en/services/career-center/job-portal",
  },
  { source: "Industrie Tirol", url: "https://www.industrie.tirol/karriere/" },
  { source: "Startup Tirol", url: "https://startup.tirol/ueber-uns/jobs/" },
  {
    source: "Tirol GV",
    url: "https://www.tirol.gv.at/buergerservice/karriereportal/",
  },
  {
    source: "Innsbruck GV",
    url: "https://www.innsbruck.gv.at/magistrat/personal/offene-stellen",
  },
  { source: "IKB", url: "https://www.ikb.at/karriere" },
  { source: "Tirol Kliniken", url: "https://karriere.tirol-kliniken.at" },
  { source: "AMS", url: "https://www.ams.at/allejobs" },
  { source: "MetaJob", url: "https://www.metajob.at" },
  { source: "Karriere.at", url: "https://www.karriere.at" },
  { source: "Indeed", url: "https://at.indeed.com" },
];

const innsbruckLocations = ["innsbruck", "tirol"];
const remoteKeywords = ["remote", "home office", "home-office", "homeoffice"];
const jobKeywords = [
  "job",
  "stelle",
  "stellen",
  "karriere",
  "career",
  "vacancy",
  "position",
  "jobportal",
];

const normalizeLocation = (value: string) => {
  const lowered = value.toLowerCase();
  if (remoteKeywords.some((keyword) => lowered.includes(keyword))) {
    return "Remote";
  }
  return value;
};

const buildTags = (title: string, location: string): JobTag[] => {
  const combined = `${title} ${location}`.toLowerCase();
  const tags = new Set<JobTag>();

  if (combined.includes("junior") || combined.includes("trainee")) {
    tags.add("quereinsteiger");
    tags.add("ohne-vorkenntnisse");
  }

  if (remoteKeywords.some((keyword) => combined.includes(keyword))) {
    tags.add("home-office");
  }

  if (
    combined.includes("backoffice") ||
    combined.includes("data") ||
    combined.includes("qa") ||
    combined.includes("accounting") ||
    combined.includes("finance") ||
    combined.includes("analytics")
  ) {
    tags.add("ohne-kundenkontakt");
  }

  if (
    combined.includes("beauty") ||
    combined.includes("cosmetic") ||
    combined.includes("wellness")
  ) {
    tags.add("beauty");
  }

  return Array.from(tags);
};

const toAbsoluteUrl = (href: string, baseUrl: string) => {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
};

const parseAnchors = (html: string, baseUrl: string) => {
  const $ = cheerio.load(html);
  const anchors = $("a[href]");
  const results: { title: string; url: string }[] = [];

  anchors.each((_, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().replace(/\s+/g, " ").trim();
    if (!href || text.length < 4) return;
    const url = toAbsoluteUrl(href, baseUrl);
    if (!url) return;
    const lowered = `${text} ${href}`.toLowerCase();
    if (!jobKeywords.some((keyword) => lowered.includes(keyword))) return;
    results.push({ title: text, url });
  });

  return results;
};

const parseBySelector = (html: string, baseUrl: string, selector: ScrapeSite["selectors"]) => {
  if (!selector) return [];
  const $ = cheerio.load(html);
  const items = $(selector.item);
  const results: { title: string; url: string; location?: string }[] = [];

  items.each((_, element) => {
    const titleElement = selector.title
      ? $(element).find(selector.title)
      : $(element);
    const linkElement = selector.link
      ? $(element).find(selector.link)
      : titleElement;
    const title = titleElement.text().replace(/\s+/g, " ").trim();
    const href = linkElement.attr("href");
    if (!title || !href) return;
    const url = toAbsoluteUrl(href, baseUrl);
    if (!url) return;
    const location = selector.location
      ? $(element).find(selector.location).text().replace(/\s+/g, " ").trim()
      : undefined;
    results.push({ title, url, location });
  });

  return results;
};

const scrapeSite = async (site: ScrapeSite): Promise<Job[]> => {
  try {
    const response = await fetch(site.url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const html = await response.text();
    const extracted =
      parseBySelector(html, site.url, site.selectors).length > 0
        ? parseBySelector(html, site.url, site.selectors)
        : parseAnchors(html, site.url);

    return extracted.slice(0, 20).map((item, index) => {
      const locationRaw = item.location ?? "";
      const location = normalizeLocation(locationRaw || "Tirol");
      const isRemote = location === "Remote";
      return {
        id: `${site.source.toLowerCase().replace(/\s+/g, "-")}-${index}-${item.url}`,
        title: item.title,
        company: site.source,
        location,
        isRemote,
        postedAt: new Date().toISOString(),
        source: site.source,
        tags: buildTags(item.title, location),
        url: item.url,
        summary: `Gefunden auf ${site.source}.`,
      } satisfies Job;
    });
  } catch {
    return [];
  }
};

export const scrapeJobs = async (): Promise<Job[]> => {
  const results = await Promise.allSettled(sites.map((site) => scrapeSite(site)));
  const jobs = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  const uniqueJobs = Array.from(
    new Map(jobs.map((job) => [`${job.title}-${job.url}`, job])).values()
  );
  return uniqueJobs;
};
