function trimToWordLimit(text, limit) {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text.trim();
  return words.slice(0, limit).join(" ") + "…";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      authors,
      affiliation,
      discipline,
      presentationType,
      wordLimit,
      notes
    } = body;

    if (!title?.trim() || !authors?.trim() || !notes?.trim()) {
      return Response.json(
        { error: "Title, authors, and scientific information are required." },
        { status: 400 }
      );
    }

    const limit = Math.min(Number(wordLimit) || 250, 250);

    // Local demo mode: no API key, credits, or internet connection required.
    // This is intentionally simple while the interface is being developed.
    const cleanNotes = notes
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");

    const sentences = cleanNotes.match(/[^.!?]+[.!?]+/g) || [cleanNotes];
    const selected = sentences.slice(0, 7).join(" ");

    const abstract = trimToWordLimit(
      selected ||
        `This study examines ${title.toLowerCase()}. The work addresses an important scientific question within ${discipline || "the field"} and considers its implications for understanding the processes described in the study.`,
      limit
    );

    return Response.json({
      title: title.trim(),
      abstract,
      demo: true
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error?.message || "Generation failed." },
      { status: 500 }
    );
  }
}
