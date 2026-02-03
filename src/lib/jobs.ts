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
  | "Company";

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

export const sampleJobs: Job[] = [
  {
    id: "oh-001",
    title: "Marketing Assistenz (m/w/d)",
    company: "ÖH Innsbruck",
    location: "Innsbruck",
    isRemote: false,
    postedAt: "2024-08-30",
    source: "ÖH Jobbörse",
    tags: ["quereinsteiger", "ohne-vorkenntnisse", "ohne-kundenkontakt"],
    url: "https://oeh-jobboerse.at/",
    summary:
      "Unterstützung im Social-Media-Team mit klaren Prozessen und internen Aufgaben.",
  },
  {
    id: "ka-021",
    title: "Backoffice Coordinator (m/w/d)",
    company: "Bergblick GmbH",
    location: "Innsbruck",
    isRemote: false,
    postedAt: "2024-08-28",
    source: "Karriere.at",
    tags: ["quereinsteiger", "ohne-vorkenntnisse", "ohne-kundenkontakt"],
    url: "https://www.karriere.at/",
    summary:
      "Datenpflege, Terminorganisation und interne Kommunikation.",
  },
  {
    id: "ss-314",
    title: "Junior QA Tester (m/w/d)",
    company: "Alpen Digital",
    location: "Remote",
    isRemote: true,
    postedAt: "2024-08-27",
    source: "StepStone",
    tags: ["quereinsteiger", "home-office", "ohne-vorkenntnisse"],
    url: "https://www.stepstone.at/",
    summary:
      "Software-Tests mit Checklisten, Remote-Onboarding inklusive.",
  },
  {
    id: "li-088",
    title: "Content Managerin Beauty (m/w/d)",
    company: "Glow Studio",
    location: "Innsbruck",
    isRemote: false,
    postedAt: "2024-08-26",
    source: "LinkedIn",
    tags: ["beauty", "quereinsteiger", "ohne-kundenkontakt"],
    url: "https://www.linkedin.com/jobs/",
    summary:
      "Pflege von Beauty-Content, Produktdaten und internen Kampagnen.",
  },
  {
    id: "ams-449",
    title: "Remote Sachbearbeitung (m/w/d)",
    company: "Tirol Service",
    location: "Remote",
    isRemote: true,
    postedAt: "2024-08-25",
    source: "AMS",
    tags: ["home-office", "quereinsteiger", "ohne-kundenkontakt"],
    url: "https://jobs.ams.at/",
    summary:
      "Interne Vorgänge dokumentieren und Abläufe nach Vorlage prüfen.",
  },
  {
    id: "co-777",
    title: "Beauty Produktdatenpflege (m/w/d)",
    company: "Alpen Beauty Tech",
    location: "Remote",
    isRemote: true,
    postedAt: "2024-08-24",
    source: "Company",
    tags: ["beauty", "home-office", "ohne-vorkenntnisse"],
    url: "https://example.com/",
    summary:
      "Produktdaten nach Vorlagen pflegen, komplett remote.",
  },
];

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
        new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
};
