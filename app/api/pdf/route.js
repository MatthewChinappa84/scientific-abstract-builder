import { chromium } from "playwright";

export async function POST(request) {
  let browser;

  try {
    const body = await request.json();

    const {
      title,
      authors,
      discipline,
      presentationType,
      abstract
    } = body;

    if (
      !title?.trim() ||
      !authors?.trim() ||
      !abstract?.trim()
    ) {
      return Response.json(
        {
          error:
            "Title, authors, and abstract are required."
        },
        { status: 400 }
      );
    }

    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage({
      viewport: {
        width: 794,
        height: 1123
      }
    });

    const firstAuthor = authors.split(",")[0].trim();
    const remainingAuthors = authors.includes(",")
      ? ", " +
        authors
          .split(",")
          .slice(1)
          .join(",")
          .trim()
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            @page {
              size: A4;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: white;
              color: #111;
              font-family: Arial, Helvetica, sans-serif;
            }

            .page {
              width: 210mm;
              min-height: 297mm;
              padding: 14mm 18mm 18mm 18mm;
            }

            .top-rule {
              height: 1px;
              background: #111;
              width: 100%;
              margin-bottom: 30px;
            }

            h1 {
              font-size: 20px;
              line-height: 1.25;
              text-align: center;
              font-weight: 700;
              margin: 0 0 24px 0;
            }

            .authors {
              text-align: center;
              font-size: 14px;
              line-height: 1.4;
              margin-bottom: 25px;
            }

            .meta {
              text-align: center;
              font-size: 12px;
              line-height: 1.4;
              font-weight: 700;
              letter-spacing: 0.04em;
              margin-bottom: 38px;
            }

            .abstract {
              font-size: 14px;
              line-height: 1.46;
              text-align: justify;
              margin: 0;
            }
          </style>
        </head>

        <body>
          <div class="page">

            <div class="top-rule"></div>

            <h1>${escapeHtml(title.trim())}</h1>

            <div class="authors">
              <strong>${escapeHtml(firstAuthor)}</strong>${escapeHtml(
                remainingAuthors
              )}
            </div>

            <div class="meta">
              ${escapeHtml(
                discipline || "Earth Sciences"
              )}
              :
              ${escapeHtml(
                presentationType || "Poster Presentation"
              )}
            </div>

            <p class="abstract">
              ${escapeHtml(abstract.trim())}
            </p>

          </div>
        </body>
      </html>
    `;

    await page.setContent(html, {
      waitUntil: "networkidle"
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0"
      }
    });

    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="abstract.pdf"'
      }
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          error?.message || "PDF generation failed."
      },
      { status: 500 }
    );

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
