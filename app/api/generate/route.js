function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      title,
      authors,
      studentEmail,
      discipline,
      presentationType,
      notes
    } = body;

    if (
      !title?.trim() ||
      !authors?.trim() ||
      !studentEmail?.trim() ||
      !notes?.trim()
    ) {
      return Response.json(
        {
          error:
            "Title, authors, student email, and completed abstract are required."
        },
        { status: 400 }
      );
    }

    const emailPattern =
      /^[A-Za-z0-9]+@students\.waikato\.ac\.nz$/;

    if (!emailPattern.test(studentEmail.trim())) {
      return Response.json(
        {
          error:
            "Please enter a valid University of Waikato student email address."
        },
        { status: 400 }
      );
    }

    const cleanNotes = notes
      .replace(/\s+/g, " ")
      .trim();

    const count = wordCount(cleanNotes);

    if (count > 250) {
      return Response.json(
        {
          error: `Your abstract contains ${count} words. Please reduce it to 250 words or fewer.`
        },
        { status: 400 }
      );
    }

    return Response.json({
      title: title.trim(),
      abstract: cleanNotes,
      studentEmail: studentEmail.trim(),
      discipline: discipline || "Earth Sciences",
      presentationType:
        presentationType || "Poster Presentation",
      wordCount: count
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error?.message || "Formatting failed."
      },
      { status: 500 }
    );
  }
}
