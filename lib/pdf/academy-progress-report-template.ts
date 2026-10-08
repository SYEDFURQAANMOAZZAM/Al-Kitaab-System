
import type {
  StudentsMonthProgress,
} from "@/app/ServerActions/academyProgressReports/types";

import {
  formatLearning,
  groupLearnings,
  parseLearnings,
} from "@/app/ServerActions/getProgress/parser";

type AcademyStudentReport = StudentsMonthProgress & {
  studentName: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(date: string | Date) {
  const d = new Date(
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? `${date}T00:00:00Z`
      : date
  );

  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function renderProgress(
  progresses: AcademyStudentReport["days"][number]["progresses"]
) {
  if (!progresses.length) {
    return `<span class="muted">No progress recorded</span>`;
  }

  return progresses
    .map((progress) => {
      const groups = groupLearnings(
        parseLearnings(progress)
      );

      const learningHtml = groups.length
        ? groups
            .map((group) => {
              const items = group.learnings
                .map((learning) => {
                  const formatted = formatLearning(learning);

                  const fromParts = formatted ? formatted.fromParts : [];
                  const toParts = formatted ? formatted.toParts : [];
                  const renderParts = (parts: typeof fromParts) =>
                    parts.map((part) => `<span class="learning-label">${escapeHtml(part.label)}</span>:<span class="learning-value">${escapeHtml(part.value)}</span>`).join(' <span class="learning-part-arrow">-></span> ');
                  const content = `${renderParts(fromParts)}${fromParts.length && toParts.length ? "&nbsp;<strong>to</strong>&nbsp;" : ""}${renderParts(toParts)}`;

                  return `
                    <li>
                      <strong>${escapeHtml(group.status)}:</strong>
                      ${content}
                      <div class="learning-remark"><strong>Remark:</strong> <span class="learning-remark-value">${escapeHtml(learning.remark || "None")}</span></div>
                    </li>
                  `;
                })
                .join("");

              return `
                <div class="subject">
                  <div class="subject-name">
                    ${escapeHtml(group.subjectName)}
                  </div>
                  <ul>${items}</ul>
                </div>
              `;
            })
            .join("")
        : `<span class="muted">No learning recorded</span>`;

      return `
        <div class="progress-batch">
          <div class="batch-name">
            ${escapeHtml(progress.batchname ?? "Batch")}
          </div>
          ${learningHtml}
          ${
            progress.remarks
              ? `<div class="remarks"><strong>Remarks:</strong> ${escapeHtml(progress.remarks)}</div>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

function renderStudent(
  student: AcademyStudentReport
) {
  const progressDays = student.days
    .map(
      (day) => `
        <tr>
          <td class="progress-date">
            ${escapeHtml(formatDate(day.date))}
          </td>
          <td class="progress-content">
            ${renderProgress(day.progresses)}
          </td>
        </tr>
      `
    )
    .join("");

  const recordedDays = student.days.filter(
    (day) => day.progresses.length > 0
  ).length;

  const totalRecords = student.days.reduce(
    (sum, day) => sum + day.progresses.length,
    0
  );

  return `
    <section class="student-section">
      <header class="student-header">
        <h1>${escapeHtml(student.studentName)}</h1>
        <div class="subtitle">
          Monthly Progress Report
        </div>
      </header>

      <div class="summary">
        <div class="summary-card">
          <div class="summary-label">Days with Progress</div>
          <div class="summary-value">${recordedDays}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Progress Records</div>
          <div class="summary-value">${totalRecords}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Days in Month</div>
          <div class="summary-value">${student.days.length}</div>
        </div>
      </div>

      <h2>Daily Progress</h2>

      ${
        student.days.length
          ? `
            <table class="progress-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Daily Progress</th>
                </tr>
              </thead>
              <tbody>${progressDays}</tbody>
            </table>
          `
          : `<div class="empty">No progress for this month.</div>`
      }
    </section>
  `;
}

export function createAcademyProgressReportHtml(
  students: AcademyStudentReport[],
  year: number,
  month: number
) {
  const monthName = new Date(
    Date.UTC(year, month - 1, 1)
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const logoUrl = `${appUrl}/lightThemeLogo.jpeg`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Academy Progress Report</title>

        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            width: 190mm;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            line-height: 1.45;
            color: #1f2937;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cover-page {
            width: 190mm;
            height: 277mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-after: always;
            break-after: page;
            overflow: hidden;
          }

          .cover-logo {
            width: 65mm;
            height: 65mm;
            object-fit: contain;
            margin-bottom: 12mm;
          }

          .cover-academy {
            margin: 0;
            font-size: 30pt;
            line-height: 1.2;
            font-weight: 800;
            color: #111827;
          }

          .cover-divider {
            width: 35mm;
            height: 1mm;
            margin: 8mm 0;
            border-radius: 2mm;
            background: #374151;
          }

          .cover-title {
            margin: 0;
            font-size: 20pt;
            font-weight: 700;
          }

          .cover-month {
            margin-top: 3mm;
            font-size: 13pt;
            color: #6b7280;
          }

          .student-section {
            width: 190mm;
            page-break-before: always;
            break-before: page;
          }

          .student-section:first-of-type {
            page-break-before: auto;
            break-before: auto;
          }

          .student-header {
            margin-bottom: 5mm;
          }

          h1 {
            margin: 0;
            font-size: 25pt;
            line-height: 1.2;
            font-weight: 800;
            color: #111827;
            overflow-wrap: anywhere;
          }

          h2 {
            margin: 5mm 0 2.5mm;
            font-size: 14pt;
            line-height: 1.3;
            color: #111827;
            break-after: avoid;
            page-break-after: avoid;
          }

          .subtitle {
            margin-top: 2mm;
            font-size: 11pt;
            color: #6b7280;
          }

          .summary {
            display: flex;
            gap: 3mm;
            width: 100%;
            margin: 4mm 0 5mm;
          }

          .summary-card {
            flex: 1;
            min-width: 0;
            padding: 3mm;
            border: 1px solid #e5e7eb;
            border-radius: 2mm;
            background: #fff;
          }

          .summary-label {
            font-size: 9pt;
            color: #6b7280;
          }

          .summary-value {
            margin-top: 1mm;
            font-size: 18pt;
            font-weight: 700;
          }

          .progress-table {
            width: 190mm;
            table-layout: fixed;
            border-collapse: collapse;
          }

          .progress-table th,
          .progress-table td {
            border: 0.25mm solid #d1d5db;
            padding: 2mm;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          .progress-table th {
            background: #f3f4f6;
            font-size: 10pt;
            font-weight: 600;
            text-align: left;
          }

          .progress-table th:first-child,
          .progress-date {
            width: 32mm;
          }

          .progress-date {
            font-size: 8.5pt;
            font-weight: 600;
            text-align: center;
            background: #f9fafb;
          }

          .progress-content {
            font-size: 9.5pt;
            line-height: 1.45;
          }

          .progress-batch {
            margin-bottom: 2mm;
            padding-bottom: 1.5mm;
            border-bottom: 0.25mm solid #e5e7eb;
          }

          .progress-batch:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: 0;
          }

          .batch-name {
            margin-bottom: 1mm;
            font-size: 10pt;
            font-weight: 700;
            color: #374151;
          }

          .subject {
            margin: 1mm 0;
          }

          .subject-name {
            font-size: 9.5pt;
            font-weight: 600;
          }

          ul {
            margin: 0.5mm 0 1mm;
            padding-left: 4mm;
          }

          li {
            margin: 0.5mm 0;
            font-size: 9pt;
          }

          .learning-label { color: #374151; font-weight: 600; }
          .learning-value { color: #6b7280; font-weight: 400; }
          .learning-part-arrow {
            color: #374151;
            font-weight: 600;
            display: inline-block;
            margin: 0 1mm;
          }
          .learning-remark { margin-top: 0.5mm; color: #6b7280; font-size: 8pt; }
          .learning-remark strong { color: #374151; font-weight: 600; }
          .learning-remark-value { color: #6b7280; font-weight: 400; }

          .remarks {
            margin-top: 1.5mm;
            color: #4b5563;
            font-size: 9pt;
          }

          .muted {
            color: #6b7280;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .empty {
            padding: 5mm;
            border: 0.25mm solid #e5e7eb;
            text-align: center;
            color: #6b7280;
          }

          @media screen {
            html, body {
              margin: 0 auto;
            }
          }

          @media print {
            html, body {
              width: 190mm;
              margin: 0;
              padding: 0;
              overflow: visible;
            }
          }
        </style>
      </head>

      <body>
        <section class="cover-page">
          <img
            class="cover-logo"
            src="${escapeHtml(logoUrl)}"
            alt="Al-Kitaab Academy Logo"
          />
          <h1 class="cover-academy">AL-KITAAB ACADEMY</h1>
          <div class="cover-divider"></div>
          <h2 class="cover-title">Academy Progress Report</h2>
          <div class="cover-month">${escapeHtml(monthName)}</div>
          <p>${students.length} Students</p>
        </section>

        <main>
          ${students.map(renderStudent).join("")}
        </main>
      </body>
    </html>
  `;
}
