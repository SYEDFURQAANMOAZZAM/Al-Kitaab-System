
import puppeteer from "puppeteer";

import { createBatchReportHtml } from "./batch-report-template";

import type {
  BatchPerformanceData,
} from "@/app/ServerActions/batchPerformance/types";

import type {
  BatchStudentMonthProgress,
} from "@/app/ServerActions/getProgress/types";

type GenerateBatchReportInput = {
  performance: BatchPerformanceData;
  progress: BatchStudentMonthProgress[];
  year: number;
  month: number;
};

export async function generateBatchReportPdf(
  input: GenerateBatchReportInput
): Promise<Uint8Array> {
  const html = createBatchReportHtml(input);

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
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="
          width: 100%;
          padding: 0 12mm;
          font-family: Arial, sans-serif;
          font-size: 8px;
          color: #71717a;
          display: flex;
          justify-content: flex-end;
        ">
          <span>
            Page <span class="pageNumber"></span>
            of <span class="totalPages"></span>
          </span>
        </div>
      `,
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
