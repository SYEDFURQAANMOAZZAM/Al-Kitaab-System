
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { existsSync } from "node:fs";
import { join } from "node:path";

import type { BatchPerformanceData } from "@/app/ServerActions/academyReports/types";
import { createAcademyAttendanceReportHtml } from "./academy-attendance-report-template";

export async function getBrowserConfig() {
  if (process.env.VERCEL === "1") {
    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    };
  }

  const customPath = process.env.CHROME_EXECUTABLE_PATH;

  if (customPath) {
    if (!existsSync(customPath)) {
      throw new Error(
        `Chrome not found at CHROME_EXECUTABLE_PATH: ${customPath}`
      );
    }

    return {
      executablePath: customPath,
      args:
        process.platform === "linux"
          ? ["--no-sandbox", "--disable-setuid-sandbox"]
          : [],
    };
  }

  let candidates: string[] = [];

  if (process.platform === "win32") {
    candidates = [
      join(
        process.env.PROGRAMFILES ?? "C:\\Program Files",
        "Google", "Chrome", "Application", "chrome.exe"
      ),
      join(
        process.env["PROGRAMFILES(X86)"] ??
          "C:\\Program Files (x86)",
        "Google", "Chrome", "Application", "chrome.exe"
      ),
      join(
        process.env.LOCALAPPDATA ?? "",
        "Google", "Chrome", "Application", "chrome.exe"
      ),
    ];
  } else if (process.platform === "darwin") {
    candidates = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      join(
        process.env.HOME ?? "",
        "Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      ),
    ];
  } else if (process.platform === "linux") {
    candidates = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/snap/bin/chromium",
    ];
  }

  const executablePath = candidates.find(
    (path) => path && existsSync(path)
  );

  if (!executablePath) {
    throw new Error(
      "Chrome or Chromium was not found. Install a browser or set CHROME_EXECUTABLE_PATH."
    );
  }

  return {
    executablePath,
    args:
      process.platform === "linux"
        ? ["--no-sandbox", "--disable-setuid-sandbox"]
        : [],
  };
}

type GenerateAcademyAttendanceReportInput = {
  batches: BatchPerformanceData[];
  year: number;
  month: number;
  academyName?: string;
  logoUrl?: string;
};

export async function generateAcademyAttendanceReport({
  batches,
  year,
  month,
  academyName,
  logoUrl,
}: GenerateAcademyAttendanceReportInput): Promise<Buffer> {
  const browserConfig = await getBrowserConfig();

  const browser = await puppeteer.launch({
    ...browserConfig,
    headless: true,
  });

  try {
    const page = await browser.newPage();

    const html = createAcademyAttendanceReportHtml({
      batches,
      year,
      month,
      academyName,
      logoUrl,
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: 30000,
    });

    await page.evaluate(async () => {
      await document.fonts.ready;

      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
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
