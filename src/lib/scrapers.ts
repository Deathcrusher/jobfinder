import * as cheerio from "cheerio";

import type { Job, JobSource, JobTag } from "@/lib/jobs";

type ScrapeSite = {
  source: JobSource;
  urls: string[];
  limit: number;
  selectors?: {
    item: string;
    title?: string;
    link?: string;
    location?: string;
  };
};

type ExtractedItem = {
  title: string;
  url: string;
  location?: string;
};

const sites: ScrapeSite[] = [
  {
    source: "Jobs TT",
    urls: [
      "https://jobs.tt.com/jobs/innsbruck",
      "https://jobs.tt.com/jobs/innsbruck?page=2",
    ],
    limit: 40,
    selectors: {
      item: "[data-testid='job-card'], .job-card, .jobs-item",
      title: "[data-testid='job-title'], .job-card__title, h2",
      link: "a[href]",
      location: "[data-testid='job-location'], .job-card__location, .location",
    },
  },
  {
    source: "Tirolerjobs",
    urls: [
      "https://tirolerjobs.at/jobs/innsbruck",
      "https://tirolerjobs.at/jobs/innsbruck?page=2",
    ],
    limit: 40,
    selectors: {
      item: ".job-listing, .job-card, .job-listing-item",
      title: ".job-title, h2, h3",
      link: "a[href]",
      location: ".job-location, .location, .job-meta__location",
    },
  },
  {
    source: "Willkommen Tirol",
    urls: [
      "https://willkommen.tirol/jobs/",
      "https://willkommen.tirol/jobs/page/2/",
    ],
    limit: 30,
    selectors: {
      item: ".job-listing, article.job, .job-card",
      title: "h2, h3, .job-title",
      link: "a[href]",
      location: ".job-location, .location, .job-meta",
    },
  },
  {
    source: "ÖH Jobbörse",
    urls: [
      "https://jobs.oehweb.at/jobs",
      "https://jobs.oehweb.at/jobs?page=2",
    ],
    limit: 30,
    selectors: {
      item: ".job-listing, .job, .job-card",
      title: "h2, h3, .job-title",
      link: "a[href]",
      location: ".job-location, .location",
    },
  },
  {
    source: "Uni Innsbruck",
    urls: [
      "https://www.uibk.ac.at/de/karriere/stellenangebote/",
      "https://www.uibk.ac.at/de/karriere/stellenangebote/?page=2",
    ],
    limit: 25,
    selectors: {
      item: ".job-listing, .c-teaser, .job-item",
      title: "h2, h3, .c-teaser__title",
      link: "a[href]",
      location: ".c-teaser__meta, .job-location",
    },
  },
  {
    source: "MCI Career Center",
    urls: [
      "https://www.mci4me.at/en/services/career-center/job-portal",
      "https://www.mci4me.at/en/services/career-center/job-portal?filter=&page=2",
    ],
    limit: 25,
    selectors: {
      item: ".job-listing, .job-item, .mci-job",
      title: "h2, h3, .job-title",
      link: "a[href]",
      location: ".job-location, .job-meta",
    },
  },
  {
    source: "Industrie Tirol",
    urls: [
      "https://www.industrie.tirol/karriere/",
      "https://www.industrie.tirol/karriere/?page=2",
    ],
    limit: 25,
    selectors: {
      item: ".job-listing, .job-item, .career-item",
      title: "h2, h3, .career-title",
      link: "a[href]",
      location: ".career-location, .job-location",
    },
  },
  {
    source: "Startup Tirol",
    urls: [
      "https://startup.tirol/jobs/",
      "https://startup.tirol/jobs/page/2/",
    ],
    limit: 25,
    selectors: {
      item: ".job-listing, .job-item, article",
      title: "h2, h3, .job-title",
      link: "a[href]",
      location: ".job-location, .entry-meta",
    },
  },
  {
    source: "Tirol GV",
    urls: [
      "https://www.tirol.gv.at/buergerservice/karriereportal/stellenangebote/",
      "https://www.tirol.gv.at/buergerservice/karriereportal/stellenangebote/?page=2",
    ],
    limit: 30,
    selectors: {
      item: ".job-listing, .job-item, .c-teaser",
      title: "h2, h3, .c-teaser__title",
      link: "a[href]",
      location: ".c-teaser__meta, .job-location",
    },
  },
  {
    source: "Innsbruck GV",
    urls: [
      "https://www.innsbruck.gv.at/magistrat/personal/offene-stellen",
      "https://www.innsbruck.gv.at/magistrat/personal/offene-stellen?page=2",
    ],
    limit: 30,
    selectors: {
      item: ".job-listing, .job-item, .c-teaser",
      title: "h2, h3, .c-teaser__title",
      link: "a[href]",
      location: ".c-teaser__meta, .job-location",
    },
  },
  {
    source: "IKB",
    urls: [
      "https://www.ikb.at/karriere/stellenangebote",
      "https://www.ikb.at/karriere/stellenangebote?page=2",
    ],
    limit: 25,
    selectors: {
      item: ".job-listing, .job-item, .c-teaser",
      title: "h2, h3, .c-teaser__title",
      link: "a[href]",
      location: ".c-teaser__meta, .job-location",
    },
  },
  {
    source: "Tirol Kliniken",
    urls: [
      "https://karriere.tirol-kliniken.at/stellenangebote",
      "https://karriere.tirol-kliniken.at/stellenangebote?page=2",
    ],
    limit: 40,
    selectors: {
      item: ".job-listing, .job-item, .vacancy",
      title: "h2, h3, .vacancy-title",
      link: "a[href]",
      location: ".vacancy-location, .job-location",
    },
  },
  {
    source: "AMS",
    urls: [
      "https://www.ams.at/allejobs?bundesland=tirol",
      "https://www.ams.at/allejobs?bundesland=tirol&page=2",
    ],
    limit: 40,
    selectors: {
      item: ".job-listing, .job-item, .ams-job",
      title: "h2, h3, .job-title",
      link: "a[href]",
      location: ".job-location, .location",
    },
  },
  {
    source: "MetaJob",
    urls: [
      "https://www.metajob.at/jobs/innsbruck",
      "https://www.metajob.at/jobs/innsbruck?page=2",
    ],
    limit: 40,
    selectors: {
      item: ".job-listing, .job-item, .job-card",
      title: "h2, h3, .job-title",
      link: "a[href]",
      location: ".job-location, .location",
    },
  },
  {
    source: "Karriere.at",
    urls: [
      "https://www.karriere.at/jobs/innsbruck",
      "https://www.karriere.at/jobs/innsbruck?page=2",
    ],
    limit: 50,
    selectors: {
      item: "[data-qa='job-entry'], .m-jobList__item, .job-card",
      title: "[data-qa='job-title'], h2, h3",
      link: "a[href]",
      location: "[data-qa='job-location'], .m-jobList__location, .location",
    },
  },
  {
    source: "Indeed",
    urls: [
      "https://at.indeed.com/jobs?q=&l=Innsbruck%2C+Tirol&start=0",
      "https://at.indeed.com/jobs?q=&l=Innsbruck%2C+Tirol&start=10",
    ],
    limit: 50,
    selectors: {
      item: "a.tapItem, .job_seen_beacon, [data-testid='job-card']",
      title: "h2.jobTitle, [data-testid='job-title']",
      link: "a[href]",
      location: "[data-testid='text-location'], .companyLocation",
    },
  },
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

const parseAnchors = (html: string, baseUrl: string): ExtractedItem[] => {
  const $ = cheerio.load(html);
  const anchors = $("a[href]");
  const results: ExtractedItem[] = [];

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

const parseBySelector = (
  html: string,
  baseUrl: string,
  selector: ScrapeSite["selectors"]
): ExtractedItem[] => {
  if (!selector) return [];
  const $ = cheerio.load(html);
  const items = $(selector.item);
  const results: ExtractedItem[] = [];

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
    const htmlPages = await Promise.all(
      site.urls.map(async (url) => {
        const response = await fetch(url, { next: { revalidate: 3600 } });
        if (!response.ok) return null;
        return response.text();
      })
    );
    const extracted = htmlPages.flatMap((html, index) => {
      if (!html) return [];
      const baseUrl = site.urls[index] ?? site.urls[0];
      const bySelector = parseBySelector(html, baseUrl, site.selectors);
      return bySelector.length > 0 ? bySelector : parseAnchors(html, baseUrl);
    });
    const uniqueExtracted = Array.from(
      new Map(
        extracted.map((item) => [`${item.title}-${item.url}`, item])
      ).values()
    ).slice(0, site.limit);

    return uniqueExtracted.map((item, index) => {
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
