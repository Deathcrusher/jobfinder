"use client";

import { useEffect, useMemo, useState } from "react";
import {
  parseKeywords,
  rankJobsForAgent,
  type AgentPreferences,
} from "@/lib/agent";
import { filterJobs, jobFilters, type Job, type JobTag } from "@/lib/jobs";

const heroFilters: JobTag[] = [
  "quereinsteiger",
  "home-office",
  "ohne-vorkenntnisse",
  "ohne-kundenkontakt",
];

type AgentJob = Job & { agentScore?: number };

export default function Home() {
  const [activeTags, setActiveTags] = useState<JobTag[]>([]);
  const [jobsData, setJobsData] = useState<Job[]>([]);
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentInclude, setAgentInclude] = useState("quereinsteiger, assistenz");
  const [agentExclude, setAgentExclude] = useState("vertrieb, call center");
  const [agentRemotePreference, setAgentRemotePreference] =
    useState<AgentPreferences["preferRemote"]>("any");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as Job[];
        setJobsData(data);
      } catch (error) {
        console.error("Failed to load jobs", error);
      }
    };

    fetchJobs();
  }, []);

  const jobs = useMemo<AgentJob[]>(() => {
    const baseJobs = filterJobs(jobsData, activeTags, "any");
    if (!agentEnabled) return baseJobs;
    return rankJobsForAgent(baseJobs, {
      includeKeywords: parseKeywords(agentInclude),
      excludeKeywords: parseKeywords(agentExclude),
      preferRemote: agentRemotePreference,
    });
  }, [
    activeTags,
    agentEnabled,
    agentExclude,
    agentInclude,
    agentRemotePreference,
    jobsData,
  ]);

  const toggleTag = (tag: JobTag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => setActiveTags([]);
  const resetFilters = () => setActiveTags(heroFilters);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-200">
            Connie&apos;s Jobfinder
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
                Die all-in-one Jobplattform für Quereinsteiger in Innsbruck & Remote
              </h1>
              <p className="max-w-2xl text-base text-slate-300">
                Fokus auf Home-Office, ohne Vorkenntnisse, ohne Kundenkontakt und optional
                Beautyjobs. Alle Treffer sind Innsbruck/Tirol oder Remote.
              </p>
              <div className="flex flex-wrap gap-2">
                {heroFilters.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-teal-400/40 bg-teal-500/10 px-3 py-1 text-xs text-teal-100"
                  >
                    {jobFilters.find((filter) => filter.id === tag)?.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              <p className="font-medium text-white">Standortregel</p>
              <p>
                Wenn nicht Innsbruck/Tirol, dann nur Remote-Jobs. Ergebnisse werden
                automatisch sortiert nach Aktualität.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Filter</h2>
              <p className="text-sm text-slate-300">
                Wähle passende Kriterien für Connie. Bei mehreren Filtern zählt
                mindestens einer.
              </p>
            </div>
            <div className="space-y-4">
              {jobFilters.map((filter) => {
                const isActive = activeTags.includes(filter.id);
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => toggleTag(filter.id)}
                    className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-teal-400 bg-teal-500/15 text-white"
                        : "border-white/10 bg-slate-900/60 text-slate-200 hover:border-white/30"
                    }`}
                  >
                    <span className="text-sm font-semibold">{filter.label}</span>
                    <span className="text-xs text-slate-300">
                      {filter.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Standardfilter setzen
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200"
              >
                Alle Filter löschen
              </button>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Aktuelle Jobs ({jobs.length})
                </h2>
                <p className="text-sm text-slate-300">
                  Sortiert nach Aktualität. Ergebnisse zeigen nur Innsbruck/Tirol oder
                  Remote-Jobs.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {jobs.map((job) => (
                <article
                  key={job.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-teal-200">
                        {job.source}
                      </p>
                      <h3 className="text-lg font-semibold text-white">
                        {job.title}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-teal-400/50 px-4 py-2 text-xs font-semibold text-teal-100 transition hover:bg-teal-500/20"
                    >
                      Zum Job
                    </a>
                  </div>
                  <p className="mt-4 text-sm text-slate-200">{job.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200"
                      >
                        {jobFilters.find((filter) => filter.id === tag)?.label}
                      </span>
                    ))}
                    {job.agentScore !== undefined ? (
                      <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs text-teal-100">
                        Agent-Score: {Math.round(job.agentScore ?? 0)}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                      {job.isRemote ? "Remote" : "Vor Ort"}
                    </span>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400">
                      {new Date(job.postedAt).toLocaleDateString("de-AT")}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
        <section className="mt-10 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:grid-cols-[1.1fr_1.5fr]">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-teal-200">
                Job-Agent
              </p>
              <h2 className="text-xl font-semibold text-white">
                Dein persönlicher AI-Job-Agent
              </h2>
              <p className="text-sm text-slate-300">
                Lass Connie Jobs nach deinem Profil filtern und priorisieren.
                Schlüsselwörter werden in Titel, Summary, Tags und Standort gesucht.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={agentEnabled}
                onChange={(event) => setAgentEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-white/30 bg-slate-900"
              />
              Agent aktivieren
            </label>
            <div className="space-y-2 text-xs text-slate-400">
              <p>Beispiele: assistenz, kundensupport, marketing, quereinsteiger.</p>
              <p>Ausschlüsse: vertrieb, cold calling, call center.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-white">
                Wunschrollen & Keywords
              </label>
              <textarea
                value={agentInclude}
                onChange={(event) => setAgentInclude(event.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-400"
                placeholder="z. B. assistenz, office, quereinsteiger"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-white">Ausschlüsse</label>
              <textarea
                value={agentExclude}
                onChange={(event) => setAgentExclude(event.target.value)}
                rows={2}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-400"
                placeholder="z. B. vertrieb, call center"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-white">
                Remote-Präferenz
              </label>
              <select
                value={agentRemotePreference}
                onChange={(event) =>
                  setAgentRemotePreference(
                    event.target.value as AgentPreferences["preferRemote"]
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none focus:border-teal-400"
              >
                <option value="any">Egal</option>
                <option value="remote">Remote bevorzugt</option>
                <option value="onsite">Vor Ort bevorzugt</option>
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
              <p className="font-semibold text-white">Agent-Logik</p>
              <p className="mt-2 text-xs text-slate-300">
                Der Agent priorisiert Jobs mit passenden Stichwörtern und blendet
                ausgeschlossene Begriffe aus. Remote-Präferenz beeinflusst die
                Sortierung.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-400">
          <p>
            Hinweis: Die Plattform lädt Jobs von Remotive, Arbeitnow und Tiroler
            Jobportalen (z. B. Jobs TT, Karriere.at, ÖH).
          </p>
          <p>
            Standortfilter: Innsbruck/Tirol oder Remote-only. Der Job-Agent ergänzt
            das Ranking nach deinem Profil, sobald er aktiviert ist.
          </p>
        </div>
      </footer>
    </div>
  );
}
