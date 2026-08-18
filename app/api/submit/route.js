export async function POST(request) {
  try {
    const body = await request.json();

    const {
      studentEmail,
      title,
      pdfBase64,
      fileName
    } = body;

    if (!studentEmail?.trim()) {
      return Response.json(
        {
          error: "Student email is required."
        },
        { status: 400 }
      );
    }

    if (!title?.trim()) {
      return Response.json(
        {
          error: "Abstract title is required."
        },
        { status: 400 }
      );
    }

    if (!pdfBase64) {
      return Response.json(
        {
          error: "PDF data is required."
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

    const appsScriptUrl =
      process.env.GOOGLE_APPS_SCRIPT_URL;

    const secretToken =
      process.env.GOOGLE_APPS_SCRIPT_TOKEN;

    if (!appsScriptUrl || !secretToken) {
      throw new Error(
        "Submission service is not configured."
      );
    }

    const url =
      `${appsScriptUrl}?token=${encodeURIComponent(secretToken)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        studentEmail: studentEmail.trim(),
        title: title.trim(),
        pdfBase64,
        fileName:
          fileName || "scientific-abstract.pdf"
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.error ||
        "Google submission service failed."
      );
    }

    return Response.json({
      success: true,
      message:
        "Your abstract has been successfully submitted."
    });

  } catch (error) {
    console.error(
      "Submission error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "Submission failed."
      },
      { status: 500 }
    );
  }
}
