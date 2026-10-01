import puppeteer from "puppeteer";

export async function generateStudentReportPdf(
  html: string
): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "load",
    });

    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,

      headerTemplate: "<div></div>",

      footerTemplate: `
        <div style="
          width: 100%;
          text-align: center;
          font-size: 8px;
          color: #6b7280;
        ">
          Page <span class="pageNumber"></span>
          of <span class="totalPages"></span>
        </div>
      `,

      margin: {
        top: "10mm",
        bottom: "15mm",
        left: "10mm",
        right: "10mm",
      },
    });

    return pdf;
  } finally {
    await browser.close();
  }
}
