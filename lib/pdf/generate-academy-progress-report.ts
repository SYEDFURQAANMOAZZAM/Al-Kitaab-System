
import puppeteer from "puppeteer-core";

import { getBrowserConfig } from "./browser-config";
import {
  createAcademyProgressReportHtml,
} from "./academy-progress-report-template";

import type {
  StudentsMonthProgress,
} from "@/app/ServerActions/academyProgressReports/types";

type AcademyStudentReport = StudentsMonthProgress & {
  studentName: string;
};

export async function generateAcademyProgressReport(
  students: AcademyStudentReport[],
  year: number,
  month: number
): Promise<Buffer> {
  if (students.length === 0) {
    throw new Error(
      "Cannot generate a report without students"
    );
  }

  const html = createAcademyProgressReportHtml(
    students,
    year,
    month
  );

  const browserConfig = await getBrowserConfig();

  const browser = await puppeteer.launch({
    ...browserConfig,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 60000,
    });

    await page.evaluate(async () => {
      await document.fonts.ready;

      const images = Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete) {
            return Promise.resolve();
          }

          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
