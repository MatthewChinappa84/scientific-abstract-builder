import {
  PDFDocument,
  StandardFonts,
  rgb
} from "pdf-lib";

export async function POST(request) {
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

    const pdfDoc = await PDFDocument.create();

    // Use lightweight built-in Helvetica.
    const regularFont =
      await pdfDoc.embedFont(
        StandardFonts.Helvetica
      );

    const boldFont =
      await pdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );

    // A4
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    const page = pdfDoc.addPage([
      pageWidth,
      pageHeight
    ]);

    const left = 51;
    const right = 51;

    const contentWidth =
      pageWidth - left - right;

    const black = rgb(
      0.07,
      0.07,
      0.07
    );

    /*
     * Scientific notation support
     *
     * pdf-lib's built-in Helvetica uses WinAnsi,
     * so Unicode superscript/subscript characters
     * cannot be encoded directly.
     *
     * We therefore convert them into individually
     * positioned normal Helvetica characters.
     */

    const subscriptMap = {
      "₀": "0",
      "₁": "1",
      "₂": "2",
      "₃": "3",
      "₄": "4",
      "₅": "5",
      "₆": "6",
      "₇": "7",
      "₈": "8",
      "₉": "9",
      "₊": "+",
      "₋": "-",
      "₌": "=",
      "₍": "(",
      "₎": ")"
    };

    const superscriptMap = {
      "⁰": "0",
      "¹": "1",
      "²": "2",
      "³": "3",
      "⁴": "4",
      "⁵": "5",
      "⁶": "6",
      "⁷": "7",
      "⁸": "8",
      "⁹": "9",
      "⁺": "+",
      "⁻": "-",
      "⁼": "=",
      "⁽": "(",
      "⁾": ")",
      "ⁿ": "n"
    };

    function isSubscript(char) {
      return Object.prototype.hasOwnProperty.call(
        subscriptMap,
        char
      );
    }

    function isSuperscript(char) {
      return Object.prototype.hasOwnProperty.call(
        superscriptMap,
        char
      );
    }

    /*
     * Convert scientific Unicode notation into
     * ordinary Helvetica characters plus positioning
     * information.
     */
    function parseScientificText(text) {
      const chars = [...String(text)];

      return chars.map((char) => {
        if (isSubscript(char)) {
          return {
            text: subscriptMap[char],
            mode: "subscript"
          };
        }

        if (isSuperscript(char)) {
          return {
            text: superscriptMap[char],
            mode: "superscript"
          };
        }

        return {
          text: char,
          mode: "normal"
        };
      });
    }

    /*
     * Calculate width while accounting for
     * superscripts/subscripts.
     */
    function scientificTextWidth(
      text,
      font,
      fontSize
    ) {
      const parts =
        parseScientificText(text);

      let width = 0;

      for (const part of parts) {
        const size =
          part.mode === "normal"
            ? fontSize
            : fontSize * 0.65;

        width +=
          font.widthOfTextAtSize(
            part.text,
            size
          );
      }

      return width;
    }

    /*
     * Draw scientific text with superscripts
     * and subscripts positioned correctly.
     */
    function drawScientificText(
      text,
      x,
      y,
      font,
      fontSize
    ) {
      const parts =
        parseScientificText(text);

      let currentX = x;

      for (const part of parts) {
        let size = fontSize;
        let offsetY = 0;

        if (part.mode === "superscript") {
          size = fontSize * 0.65;
          offsetY = fontSize * 0.38;
        }

        if (part.mode === "subscript") {
          size = fontSize * 0.65;
          offsetY = -fontSize * 0.20;
        }

        page.drawText(
          part.text,
          {
            x: currentX,
            y: y + offsetY,
            size,
            font,
            color: black
          }
        );

        currentX +=
          font.widthOfTextAtSize(
            part.text,
            size
          );
      }

      return currentX;
    }

    /*
     * Wrap text while preserving scientific notation.
     */
    function wrapText(
      text,
      font,
      fontSize,
      maxWidth
    ) {
      const words = String(text)
        .replace(/\s+/g, " ")
        .trim()
        .split(" ");

      const lines = [];

      let current = "";

      for (const word of words) {
        const test =
          current
            ? `${current} ${word}`
            : word;

        const width =
          scientificTextWidth(
            test,
            font,
            fontSize
          );

        if (
          width <= maxWidth ||
          !current
        ) {
          current = test;
        } else {
          lines.push(current);
          current = word;
        }
      }

      if (current) {
        lines.push(current);
      }

      return lines;
    }

    function drawCenteredScientific(
      text,
      font,
      size,
      y
    ) {
      const width =
        scientificTextWidth(
          text,
          font,
          size
        );

      drawScientificText(
        text,
        (pageWidth - width) / 2,
        y,
        font,
        size
      );
    }

    // --------------------------------
    // TOP RULE
    // --------------------------------

    page.drawLine({
      start: {
        x: left,
        y: pageHeight - 40
      },
      end: {
        x: pageWidth - right,
        y: pageHeight - 40
      },
      thickness: 0.7,
      color: black
    });

    let y =
      pageHeight - 70;

    // --------------------------------
    // TITLE
    // --------------------------------

    const titleText =
      title
        .replace(/\s+/g, " ")
        .trim();

    const titleSize = 15;

    const titleLines =
      wrapText(
        titleText,
        boldFont,
        titleSize,
        contentWidth
      );

    for (const line of titleLines) {
      drawCenteredScientific(
        line,
        boldFont,
        titleSize,
        y
      );

      y -= 19;
    }

    y -= 10;

    // --------------------------------
    // AUTHORS
    // --------------------------------

    const authorParts =
      authors
        .split(",")
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);

    const firstAuthor =
      authorParts[0] || "";

    const remainingAuthors =
      authorParts
        .slice(1)
        .join(", ");

    const authorSize = 10.5;

    const remainingText =
      remainingAuthors
        ? `, ${remainingAuthors}`
        : "";

    const firstWidth =
      scientificTextWidth(
        firstAuthor,
        boldFont,
        authorSize
      );

    const remainingWidth =
      scientificTextWidth(
        remainingText,
        regularFont,
        authorSize
      );

    const totalWidth =
      firstWidth +
      remainingWidth;

    let authorX =
      (pageWidth - totalWidth) / 2;

    authorX =
      drawScientificText(
        firstAuthor,
        authorX,
        y,
        boldFont,
        authorSize
      );

    if (remainingText) {
      drawScientificText(
        remainingText,
        authorX,
        y,
        regularFont,
        authorSize
      );
    }

    y -= 22;

    // --------------------------------
    // DISCIPLINE / PRESENTATION TYPE
    // --------------------------------

    const meta =
      `${discipline || "Earth Science"} : ${
        presentationType ||
        "Poster Presentation"
      }`;

    drawCenteredScientific(
      meta,
      boldFont,
      9,
      y
    );

    y -= 30;

    // --------------------------------
    // ABSTRACT
    // --------------------------------

    const abstractText =
      abstract
        .replace(/\s+/g, " ")
        .trim();

    const abstractSize = 10.5;
    const lineHeight = 15.3;

    const abstractLines =
      wrapText(
        abstractText,
        regularFont,
        abstractSize,
        contentWidth
      );

    for (const line of abstractLines) {
      drawScientificText(
        line,
        left,
        y,
        regularFont,
        abstractSize
      );

      y -= lineHeight;
    }

    // --------------------------------
    // SAVE
    // --------------------------------

    const pdfBytes =
      await pdfDoc.save();

    return new Response(
      pdfBytes,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition":
            'attachment; filename="abstract.pdf"'
        }
      }
    );

  } catch (error) {
    console.error(
      "PDF generation error:",
      error
    );

    return Response.json(
      {
        error:
          error?.message ||
          "PDF generation failed."
      },
      { status: 500 }
    );
  }
}