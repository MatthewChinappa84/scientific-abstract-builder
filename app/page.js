"use client";

import { useMemo, useState } from "react";

const initial = {
  title: "",
  authors: "",
  studentEmail: "",
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const inputWords = useMemo(() => wordCount(form.notes), [form.notes]);

  const outputWords = useMemo(
    () => (result ? wordCount(result.abstract) : 0),
    [result]
  );

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function loadExample() {
    setForm({
      title:
        "The effects of turbulence and CO₂ exchange on water chemistry and fluxes at the air-water interface",
      authors:
        "Jade Arnold, Julia Mullarney, Deniz Özkundakci, Adam Hartland",
      studentEmail: "",
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
    setSubmitMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generate() {
    setError("");
    setSubmitMessage("");

    if (
      !form.title.trim() ||
      !form.authors.trim() ||
      !form.studentEmail.trim() ||
      !form.notes.trim()
    ) {
      setError(
        "Please provide a title, authors, student email, and completed abstract."
      );
      return;
    }

    const emailPattern =
      /^[A-Za-z0-9]+@students\.waikato\.ac\.nz$/;

    if (!emailPattern.test(form.studentEmail.trim())) {
      setError(
        "Please enter a valid University of Waikato student email address."
      );
      return;
    }

    if (inputWords > 250) {
      setError(
        `Your abstract contains ${inputWords} words. Please reduce it to 250 words or fewer before formatting.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Formatting failed.");
      }

      setResult(data);

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyAbstract() {
    if (result?.abstract) {
      await navigator.clipboard.writeText(result.abstract);
    }
  }

  async function submitAbstract() {
    setError("");
    setSubmitMessage("");

    if (!result) {
      setError("Please format your abstract before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      // Generate the final conference PDF
      const pdfResponse = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: result.title || form.title,
          authors: form.authors,
          discipline: form.discipline,
          presentationType: form.presentationType,
          abstract: result.abstract
        })
      });

      if (!pdfResponse.ok) {
        const pdfError = await pdfResponse.json().catch(() => null);

        throw new Error(
          pdfError?.error || "PDF generation failed."
        );
      }

      const pdfBlob = await pdfResponse.blob();

      // Convert PDF to Base64 for secure server-side submission
      const arrayBuffer = await pdfBlob.arrayBuffer();

      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      const chunkSize = 0x8000;

      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(
          ...bytes.subarray(i, i + chunkSize)
        );
      }

      const pdfBase64 = btoa(binary);

      // Submit PDF to Google Drive + email system
      const submitResponse = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentEmail: form.studentEmail.trim(),
          title: result.title || form.title,
          pdfBase64,
          fileName: `${form.authors.split(",")[0].trim().replace(/[^A-Za-z0-9]+/g, "_")}_${(result.title || form.title).trim().replace(/[^A-Za-z0-9]+/g, "_").slice(0, 80)}.pdf`
        })
      });

      const submitData = await submitResponse.json();

      if (!submitResponse.ok) {
        throw new Error(
          submitData.error || "Submission failed."
        );
      }

      setSubmitMessage(
        "Your abstract has been successfully submitted. A PDF copy has been sent to your email."
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="site">
      <div className="top-rule" />

      <header className="header">
        <div>
          <div className="brand">SCIENTIFIC ABSTRACT BUILDER</div>

          <h1>Conference Abstract</h1>

          <p>
            Enter your conference details and paste or type your completed
            abstract below.
          </p>
        </div>

        <button className="text-button" onClick={loadExample}>
          Load example
        </button>
      </header>

      <section className="builder">

        {/* CONFERENCE DETAILS */}
        <div className="section">
          <div className="section-label">01</div>

          <div className="section-content">
            <h2>Conference details</h2>

            <div className="grid two">

              {/* TITLE */}
              <label className="field">
                <span className="label">
                  Title <b>*</b>
                </span>

                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Title of your study"
                />
              </label>

              {/* AUTHORS */}
              <label className="field">
                <span className="label">
                  Authors <b>*</b>
                </span>

                <input
                  value={form.authors}
                  onChange={(e) => set("authors", e.target.value)}
                  placeholder="Author One, Author Two, Author Three"
                />
              </label>

              {/* STUDENT EMAIL */}
              <label className="field">
                <span className="label">
                  Student Email <b>*</b>
                </span>

                <input
                  type="email"
                  value={form.studentEmail}
                  onChange={(e) =>
                    set("studentEmail", e.target.value)
                  }
                  placeholder="e.g. 1234567@students.waikato.ac.nz"
                />

                <span className="field-help">
                  Use your University of Waikato student email.
                </span>
              </label>

              {/* DISCIPLINE */}
              <label className="field">
                <span className="label">Discipline</span>

                <select
                  value={form.discipline}
                  onChange={(e) =>
                    set("discipline", e.target.value)
                  }
                >
                  <option>Earth Sciences</option>
                  <option>Climate / Environmental Science</option>
                  <option>Earth / Geoscience</option>
                  <option>Physical Science</option>
                  <option>Life Science</option>
                  <option>Engineering</option>
                  <option>Other</option>
                </select>
              </label>

              {/* PRESENTATION TYPE */}
              <label className="field">
                <span className="label">Presentation type</span>

                <select
                  value={form.presentationType}
                  onChange={(e) =>
                    set("presentationType", e.target.value)
                  }
                >
                  <option>Poster Presentation</option>
                  <option>Oral Presentation</option>
                </select>
              </label>

              {/* WORD LIMIT */}
              <label className="field">
                <span className="label">Word limit</span>

                <select
                  value={form.wordLimit}
                  onChange={(e) =>
                    set("wordLimit", Number(e.target.value))
                  }
                >
                  <option value="250">250 words</option>
                </select>
              </label>

            </div>
          </div>
        </div>

        {/* ABSTRACT */}
        <div className="section">
          <div className="section-label">02</div>

          <div className="section-content">
            <h2>Abstract</h2>

            <p className="section-note">
              Paste or type your completed abstract. The builder will format it
              for the conference template.
            </p>

            <label className="field">
              <span className="label">
                Abstract <b>*</b>
              </span>

              <textarea
                rows={18}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Paste or type your completed abstract here."
              />
            </label>

            <div
              className={`input-footer ${
                inputWords > 250 ? "word-limit-error" : ""
              }`}
            >
              {inputWords} / 250 words
            </div>

            {inputWords > 250 && (
              <div className="word-limit-message">
                Your abstract is over the 250-word limit. You can continue
                editing, but you must reduce it to 250 words or fewer before
                formatting.
              </div>
            )}
          </div>
        </div>

        {/* FORMAT */}
        <div className="submit-area">
          <div>
            <div className="submit-title">Format Abstract</div>

            <div className="submit-note">
              The abstract will be formatted using the conference template.
            </div>
          </div>

          <div className="submit-actions">
            <button className="text-button" onClick={clearAll}>
              Clear
            </button>

            <button
              className="primary"
              onClick={generate}
              disabled={loading || submitting || inputWords > 250}
            >
              {loading ? "Formatting…" : "Format Abstract"}
            </button>
          </div>
        </div>

        {error && (
          <div className="message error">
            {error}
          </div>
        )}

      </section>

      {/* PREVIEW */}
      {result && (
        <section className="preview-section">

          <div className="preview-head">

            <div>
              <div className="eyebrow">
                FORMATTED ABSTRACT
              </div>

              <div className="preview-count">
                {outputWords} / {form.wordLimit} words
              </div>
            </div>

            <div className="preview-actions">

              <button
                className="text-button"
                onClick={copyAbstract}
              >
                Copy abstract
              </button>

              <button
                className="text-button"
                onClick={() => window.print()}
              >
                Print / Save PDF
              </button>

              <button
                className="primary small"
                onClick={generate}
                disabled={loading || submitting || inputWords > 250}
              >
                {loading ? "Formatting…" : "Reformat"}
              </button>

            </div>
          </div>

          <article className="paper">

            <h2>
              {result.title || form.title}
            </h2>

            <div className="paper-authors">
              <strong>
                {form.authors.split(",")[0].trim()}
              </strong>

              {form.authors.includes(",")
                ? ", " +
                  form.authors
                    .split(",")
                    .slice(1)
                    .join(",")
                    .trim()
                : ""}
            </div>

            <div className="paper-meta">
              {form.discipline} : {form.presentationType}
            </div>

            <p className="paper-abstract">
              {result.abstract}
            </p>

          </article>

          {/* FINAL SUBMISSION */}
          <div className="final-submit-area">

            <div>
              <div className="submit-title">
                Submit Abstract
              </div>

              <div className="submit-note">
                Your formatted abstract will be saved as a PDF and submitted
                to the conference.
              </div>
            </div>

            <button
              className="primary"
              onClick={submitAbstract}
              disabled={submitting}
            >
              {submitting
                ? "Submitting…"
                : "Submit Abstract"}
            </button>

          </div>

          {submitMessage && (
            <div className="message success">
              {submitMessage}
            </div>
          )}

        </section>
      )}

      <footer>
        Scientific Abstract Builder · Local MVP
      </footer>
    </main>
  );
}
