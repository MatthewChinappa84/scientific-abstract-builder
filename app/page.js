"use client";

import { useMemo, useState } from "react";

const initial = {
  title: "",
  authors: "",
  affiliation: "",
  discipline: "Earth Sciences",
  presentationType: "Poster Presentation",
  wordLimit: 250,
  notes: ""
};

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function Home() {
  const [form, setForm] = useState(initial);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputWords = useMemo(() => wordCount(form.notes), [form.notes]);
  const outputWords = useMemo(() => result ? wordCount(result.abstract) : 0, [result]);

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function loadExample() {
    setForm({
      title: "The effects of turbulence and CO₂ exchange on water chemistry and fluxes at the air-water interface",
      authors: "Jade Arnold, Julia Mull arney, Deniz Özkundakci, Adam Hartland".replace("Julia Mull arney", "Julia Mullarney"),
      affiliation: "",
      discipline: "Earth Sciences",
      presentationType: "Poster Presentation",
      wordLimit: 250,
      notes: `From an earth system perspective, river environments are home to many species (plant, animal and microbe) and these systems often supply drinking water. River flow connects a catchment with the ocean, and along this route the flowing water performs countless vital ecosystem and environmental services including transport. There is widespread acceptance that in the current climate conditions, atmospheric CO₂ is steadily increasing; however, the consequences of this stressor for freshwater ecosystems are relatively less understood than for seawater systems. In order to detect, predict or measure changing climate impacts on the system we must understand the baseline and variability of present-day aquatic CO₂ conditions. The ability to predict variability in river CO₂ concentrations and fluxes across multiple spatial and temporal scales remains challenging. We will resolve and elucidate the key controls on CO₂ concentrations and fluxes in a large temperate river system. We will undertake flow-following measurements of CO₂ concentrations, water quality parameters, flow velocities, and the dissipation rate of turbulent kinetic energy in the Waikato River. By understanding the hierarchy of controls for the Waikato River we will gain insights that are relevant to other river systems. Studies on rivers are needed to help advance global understanding of CO₂ mixing mechanisms and exchanges, and the role played by large temperate rivers in the carbon cycle and healthy ecosystem functioning.`
    });
  }

  function clearAll() {
    setForm(initial);
    setResult(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generate() {
    setError("");
    if (!form.title.trim() || !form.authors.trim() || !form.notes.trim()) {
      setError("Please provide a title, authors, and the scientific information for the abstract.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setResult(data);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyAbstract() {
    if (result?.abstract) await navigator.clipboard.writeText(result.abstract);
  }

  return (
    <main className="site">
      <div className="top-rule" />

      <header className="header">
        <div>
          <div className="brand">SCIENTIFIC ABSTRACT BUILDER</div>
          <h1>Conference Abstract</h1>
          <p>Enter your conference details and paste or type your completed abstract below.</p>
        </div>
        <button className="text-button" onClick={loadExample}>Load example</button>
      </header>

      <section className="builder">
        <div className="section">
          <div className="section-label">01</div>
          <div className="section-content">
            <h2>Conference details</h2>
            <div className="grid two">
              <label className="field">
                <span className="label">Title <b>*</b></span>
                <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Title of your study" />
              </label>
              <label className="field">
                <span className="label">Authors <b>*</b></span>
                <input value={form.authors} onChange={e => set("authors", e.target.value)} placeholder="Author One, Author Two, Author Three" />
              </label>
              <label className="field">
                <span className="label">Affiliation</span>
                <input value={form.affiliation} onChange={e => set("affiliation", e.target.value)} placeholder="University or institution" />
              </label>
              <label className="field">
                <span className="label">Discipline</span>
                <select value={form.discipline} onChange={e => set("discipline", e.target.value)}>
                  <option>Earth Sciences</option>
                  <option>Climate / Environmental Science</option>
                  <option>Earth / Geoscience</option>
                  <option>Physical Science</option>
                  <option>Life Science</option>
                  <option>Engineering</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Presentation type</span>
                <select value={form.presentationType} onChange={e => set("presentationType", e.target.value)}>
                  <option>Poster Presentation</option>
                  <option>Oral Presentation</option>
                  <option>Conference Abstract</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Word limit</span>
                <select value={form.wordLimit} onChange={e => set("wordLimit", Number(e.target.value))}>
                  <option value="250">250 words</option>
                  <option value="300">250 words</option>
                  </select>
              </label>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-label">02</div>
          <div className="section-content">
            <h2>Abstract</h2>
            <p className="section-note">Paste or type your completed abstract. The builder will format it for the conference template.</p>
            <label className="field">
              <span className="label">Your information <b>*</b></span>
              <textarea
                rows={18}
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Paste or type your completed abstract here."
              />
            </label>
            <div className="input-footer">{inputWords} words provided</div>
          </div>
        </div>

        <div className="submit-area">
          <div>
            <div className="submit-title">Format Abstract</div>
            <div className="submit-note">One continuous academic narrative — no Methods or Results headings.</div>
          </div>
          <div className="submit-actions">
            <button className="text-button" onClick={clearAll}>Clear</button>
            <button className="primary" onClick={generate} disabled={loading}>
              {loading ? "Generating…" : "Format Abstract"}
            </button>
          </div>
        </div>

        {error && <div className="message error">{error}</div>}
      </section>

      {result && (
        <section className="preview-section">
          <div className="preview-head">
            <div>
              <div className="eyebrow">GENERATED ABSTRACT</div>
              <div className="preview-count">{outputWords} / {form.wordLimit} words · Demo mode</div>
            </div>
            <div className="preview-actions">
              <button className="text-button" onClick={copyAbstract}>Copy abstract</button>
              <button className="text-button" onClick={() => window.print()}>Print / Save PDF</button>
              <button className="primary small" onClick={generate} disabled={loading}>Regenerate</button>
            </div>
          </div>

          <article className="paper">
            <h2>{result.title || form.title}</h2>
            <div className="paper-authors">{form.authors}</div>
            {form.affiliation && <div className="paper-affiliation">{form.affiliation}</div>}
            <div className="paper-meta">{form.discipline} : {form.presentationType}</div>
            <p className="paper-abstract">{result.abstract}</p>
            <div className="paper-page-number">1</div>
          </article>
        </section>
      )}

      <footer>Scientific Abstract Builder · Local MVP</footer>
    </main>
  );
}
