import type { StudentPerformanceData } from "@/app/ServerActions/studentPerformance/types";

import type { StudentMonthProgressDay } from "@/app/ServerActions/getProgress/types";

import {

  formatLearning,

  groupLearnings,

  parseLearnings,

} from "@/app/ServerActions/getProgress/parser";

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

function getDay(date: string | Date) {

  const d = new Date(

    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)

      ? `${date}T00:00:00Z`

      : date

  );

  return d.getUTCDate();

}

function statusClass(status: string | null) {

  switch (status) {

    case "PRESENT":

      return "present";

    case "ABSENT":

      return "absent";

    case "LEAVE":

      return "leave";

    default:

      return "none";

  }

}

function renderProgress(

  day: StudentMonthProgressDay,

  batches: StudentPerformanceData["batches"]

) {

  if (!day.progresses.length) {

    return `<span class="muted">No progress</span>`;

  }

  return day.progresses

    .map((progress) => {

      const batch = batches.find((b) => b.id === progress.batchId);

      const learnings = parseLearnings(progress);

      const groups = groupLearnings(learnings);

      const learningHtml = groups.length

        ? groups

            .map((group) => {

              const items = group.learnings

                .map((learning) => {

                  const formatted = formatLearning(learning);

                  if (!formatted) return "";

                  const renderParts = (parts: typeof formatted.fromParts) =>
                    parts.map((part) => `<span class="learning-label">${escapeHtml(part.label)}</span>:<span class="learning-value">${escapeHtml(part.value)}</span>`).join(' <span class="learning-part-arrow">&rarr;</span> ');
                  const learningContent = `${renderParts(formatted.fromParts)}${formatted.fromParts.length && formatted.toParts.length ? " <strong>to</strong> " : ""}${renderParts(formatted.toParts)}`;

                  return `

                    <li>

                      <strong>${escapeHtml(group.status)}:</strong>

                      ${learningContent}

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

            ${escapeHtml(batch?.name ?? "Batch")}

          </div>

          ${learningHtml}

        </div>

      `;

    })

    .join("");

}

export function createStudentReportHtml(

  performance: StudentPerformanceData,

  progress: StudentMonthProgressDay[],

  year: number,

  month: number

) {

  const { student, attendance, batches } = performance;

  const totalPresent = attendance.reduce(

    (sum, batch) => sum + batch.presentDays,

    0

  );

  const totalLeave = attendance.reduce(

    (sum, batch) => sum + batch.leaveDays,

    0

  );

  const totalAbsent = attendance.reduce(

    (sum, batch) => sum + batch.absentDays,

    0

  );

  const dates = Array.from(

    new Set(

      attendance.flatMap((batch) =>

        batch.records.map((record) => record.date)

      )

    )

  ).sort();

  const attendanceMaps = attendance.map(

    (batch) =>

      new Map(

        batch.records.map((record) => [

          record.date,

          record.status,

        ])

      )

  );

  const monthName = new Date(

    Date.UTC(year, month - 1, 1)

  ).toLocaleDateString("en-US", {

    month: "long",

    year: "numeric",

    timeZone: "UTC",

  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const logoUrl = `${appUrl}/lightThemeLogo.jpeg`;

  const batchHeaders = attendance

    .map(

      (batch, index) => `

        <th>

          <div class="batch-title">

            ${escapeHtml(batch.batchName)}

          </div>

          <div class="batch-stats">

            ${batch.presentDays}P ·

            ${batch.leaveDays}L ·

            ${batch.absentDays}A

          </div>

        </th>

      `

    )

    .join("");

  const attendanceRows = dates

    .map(

      (date) => `

        <tr>

          <td class="date-cell">${getDay(date)}</td>

          ${attendance

            .map((batch, index) => {

              const status =

                attendanceMaps[index].get(date) ?? null;

              return `

                <td>

                  <span class="status ${statusClass(status)}">

                    ${

                      status === "PRESENT"

                        ? "P"

                        : status === "ABSENT"

                          ? "A"

                          : status === "LEAVE"

                            ? "L"

                            : "—"

                    }

                  </span>

                </td>

              `;

            })

            .join("")}

        </tr>

      `

    )

    .join("");

  const progressRows = progress

    .map(

      (day) => `

        <tr>

          <td class="progress-date">

            ${escapeHtml(formatDate(day.date))}

          </td>

          <td class="progress-content">

            ${renderProgress(day, batches)}

          </td>

        </tr>

      `

    )

    .join("");

  return `

    <!DOCTYPE html>

    <html lang="en">

      <head>

        <meta charset="UTF-8" />

        <meta

          name="viewport"

          content="width=device-width, initial-scale=1.0"

        />

        <title>Student Performance Report</title>

        <style>

          /* Physical A4 portrait page: 210mm wide × 297mm high; 10mm margins. */

          @page {

            size: 210mm 297mm;

            margin: 10mm;

          }

          * {

            box-sizing: border-box;

          }

          html {

            width: 190mm;

            margin: 0;

            padding: 0;

          }

          body {

            width: 190mm;

            max-width: 190mm;

            margin: 0;

            padding: 0;

            font-family: Arial, Helvetica, sans-serif;

            font-size: 10pt;

            line-height: 1.45;

            color: #1f2937;

            background: #ffffff;

            -webkit-print-color-adjust: exact;

            print-color-adjust: exact;

          }

          /* Dedicated A4 cover page */
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
            display: block;
            width: 65mm;
            height: 65mm;
            object-fit: contain;
            margin: 0 0 12mm;
          }
          .cover-academy {
            margin: 0;
            font-size: 30pt;
            line-height: 1.2;
            font-weight: 800;
            color: #111827;
            letter-spacing: 0.3px;
          }
          .cover-divider {
            width: 35mm;
            height: 1mm;
            margin: 8mm 0;
            border-radius: 2mm;
            background: #374151;
          }
          .cover-report-title {
            margin: 0;
            font-size: 20pt;
            line-height: 1.3;
            font-weight: 700;
            color: #1f2937;
          }
          .cover-month {
            margin-top: 3mm;
            font-size: 13pt;
            font-weight: 500;
            color: #6b7280;
          }
          .report-content {
            width: 190mm;
            max-width: 190mm;
          }
          .report-header {
            width: 100%;
            margin-bottom: 5mm;
          }
          .report-student-name {
            margin: 0;
            font-size: 28pt;
            line-height: 1.2;
            font-weight: 800;
            color: #111827;
            overflow-wrap: anywhere;
          }
          header {

            width: 100%;

            margin-bottom: 5mm;

          }

          h1 {

            margin: 0;

            font-size: 24pt;

            line-height: 1.2;

            font-weight: 700;

            overflow-wrap: anywhere;

          }

          h2 {

            margin: 5mm 0 2.5mm;

            font-size: 14pt;

            font-weight: 700;

            line-height: 1.3;

            color: #111827;

            break-after: avoid;

            page-break-after: avoid;

          }

          .subtitle {

            margin-top: 2mm;

            font-size: 12pt;

            color: #6b7280;

          }

          /* Summary cards */

          .summary {

            display: flex;

            flex-direction: row;

            gap: 3mm;

            width: 100%;

            margin: 4mm 0 5mm;

          }

          .summary-card {

            flex: 1 1 0;

            min-width: 0;

            padding: 3mm;

            border: 1px solid #e5e7eb;

            border-radius: 2mm;

            background: #ffffff;

          }

          .summary-label {

            font-size: 9pt;

            color: #6b7280;

          }

          .summary-value {

            margin-top: 1mm;

            font-size: 18pt;

            font-weight: 700;

            line-height: 1.2;

          }

          .present-text {

            color: #059669;

          }

          .leave-text {

            color: #d97706;

          }

          .absent-text {

            color: #dc2626;

          }

          /* Sections */

          .section {

            width: 100%;

            max-width: 190mm;

            margin-top: 3mm;

          }

          /* Attendance table */

          .attendance-table {

            width: 190mm;

            max-width: 190mm;

            table-layout: auto;

            border-collapse: collapse;

            border-spacing: 0;

          }

          .attendance-table th,

          .attendance-table td {

            border: 0.25mm solid #d1d5db;

            padding: 2mm 0.8mm;

            text-align: center;

            vertical-align: middle;

            overflow-wrap: anywhere;

          }

          .attendance-table th {

            background: #f3f4f6;

            font-weight: 600;

            font-size: 9pt;

          }

          .attendance-table th:first-child,

          .attendance-table td:first-child {

            width: 8mm;

          }

.batch-title {

            margin-top: 1mm;

            font-size: 10pt;

            font-weight: 500;

            line-height: 1.25;

            overflow-wrap: anywhere;

            min-width: 28mm;

          }

          .batch-stats {

            margin-top: 1mm;

            font-size: 8pt;

            font-weight: 400;

            color: #6b7280;

            line-height: 1.2;

          }

          .date-cell {

            font-size: 9pt;

            font-weight: 700;

            background: #f9fafb;

          }

          .status {

            display: inline-block;

            min-width: 5mm;

            padding: 0.8mm;

            border-radius: 1mm;

            font-size: 9pt;

            font-weight: 700;

            line-height: 1.4;

          }

          .present {

            color: #047857;

            background: #d1fae5;

          }

          .leave {

            color: #b45309;

            background: #fef3c7;

          }

          .absent {

            color: #b91c1c;

            background: #fee2e2;

          }

          .none {

            color: #9ca3af;

            background: #f9fafb;

          }

          .progress-section {

            break-before: page;

            page-break-before: always;

          }

          /* Progress table */

          .progress-table {

            width: 190mm;

            max-width: 190mm;

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

          }

          .progress-table th:first-child,

          .progress-table .progress-date {

            width: 32mm;

            font-size: 9pt;

          }

          .progress-date {

            font-size: 8pt;

            font-weight: 600;

            background: #f9fafb;

            text-align: center;

          }

          .progress-content {

            text-align: left;

            font-size: 9.5pt;

            line-height: 1.45;

            overflow-wrap: anywhere;

          }

          .progress-batch {

            margin-bottom: 2mm;

            padding-bottom: 1.5mm;

            border-bottom: 0.25mm solid #e5e7eb;

            break-inside: auto;

            page-break-inside: auto;

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

            break-inside: auto;

            page-break-inside: auto;

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

            overflow-wrap: anywhere;

          }

          .learning-label { color: #374151; font-weight: 600; }
          .learning-value { color: #6b7280; font-weight: 400; }
          .learning-part-arrow { color: #9ca3af; }

          .muted {

            color: #6b7280;

          }

          /* Page-break behavior */

          thead {

            display: table-header-group;

          }

          tfoot {

            display: table-footer-group;

          }

          tr {

            break-inside: avoid;

            page-break-inside: avoid;

          }

          .empty {

            width: 100%;

            padding: 5mm;

            border: 0.25mm solid #e5e7eb;

            text-align: center;

            color: #6b7280;

            font-size: 9pt;

          }

          @media screen {

            html,

            body {

              width: 190mm;

              max-width: 190mm;

              margin: 0 auto;

            }

          }

          @media print {

            html,

            body {

              width: 190mm;

              max-width: 190mm;

              min-width: 0;

              margin: 0;

              padding: 0;

              overflow: visible;

            }

            .section,

            .summary,

            header {

              max-width: 190mm;

            }

            h1,

            h2 {

              break-after: avoid;

              page-break-after: avoid;

            }

          }

        </style>

      </head>

      <body>
        <section class="cover-page">
          <img class="cover-logo" src="${escapeHtml(logoUrl)}" alt="Al-Kitaab Academy Logo" />
          <h1 class="cover-academy">AL-KITAAB ACADEMY</h1>
          <div class="cover-divider"></div>
          <h2 class="cover-report-title">Student Report</h2>
          <div class="cover-month">${escapeHtml(monthName)}</div>
        </section>

        <main class="report-content">
          <header class="report-header">
            <h1 class="report-student-name">${escapeHtml(student.name)}</h1>
            <div class="subtitle">
              Student Performance Report · ${escapeHtml(monthName)}
            </div>
          </header>
          <div class="summary">

          <div class="summary-card">

            <div class="summary-label">Present</div>

            <div class="summary-value present-text">

              ${totalPresent}

            </div>

          </div>

          <div class="summary-card">

            <div class="summary-label">Leave</div>

            <div class="summary-value leave-text">

              ${totalLeave}

            </div>

          </div>

          <div class="summary-card">

            <div class="summary-label">Absent</div>

            <div class="summary-value absent-text">

              ${totalAbsent}

            </div>

          </div>

          <div class="summary-card">

            <div class="summary-label">Batches</div>

            <div class="summary-value">

              ${batches.length}

            </div>

          </div>

        </div>

        <section class="section">

          <h2>Attendance</h2>

          ${

            dates.length && attendance.length

              ? `

                <table class="attendance-table">

                  <thead>

                    <tr>

                      <th>Day</th>

                      ${batchHeaders}

                    </tr>

                  </thead>

                  <tbody>

                    ${attendanceRows}

                  </tbody>

                </table>

              `

              : `

                <div class="empty">

                  No attendance data for this month.

                </div>

              `

          }

        </section>

        <section class="section progress-section">

          <h2>Daily Progress</h2>

          ${

            progress.length

              ? `

                <table class="progress-table">

                  <thead>

                    <tr>

                      <th>Date</th>

                      <th>Daily Progress</th>

                    </tr>

                  </thead>

                  <tbody>

                    ${progressRows}

                  </tbody>

                </table>

              `

              : `

                <div class="empty">

                  No progress for this month.

                </div>

              `

          }

        </section>
        </main>
      </body>

    </html>

  `;

}
