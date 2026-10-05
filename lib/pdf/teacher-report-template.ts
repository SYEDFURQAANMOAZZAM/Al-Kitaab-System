import type {
  TeacherPerformanceData,
  TeacherAttendanceStatus,
} from "@/app/ServerActions/TeacherPerformance/types";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getIndiaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

function getStatusClass(status: TeacherAttendanceStatus) {
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

function getStatusLabel(status: TeacherAttendanceStatus) {
  switch (status) {
    case "PRESENT":
      return "P";
    case "ABSENT":
      return "A";
    case "LEAVE":
      return "L";
    default:
      return "—";
  }
}

export function createTeacherReportHtml(
  data: TeacherPerformanceData,
  year: number,
  month: number
): string {
  const { batches, attendance } = data;

  const today = getIndiaToday();

  const isFutureMonth =
    year > today.year ||
    (year === today.year && month > today.month);

  const isCurrentMonth =
    year === today.year && month === today.month;

  const daysInMonth = new Date(year, month, 0).getDate();

  const totalDates = isFutureMonth
    ? 0
    : isCurrentMonth
      ? today.day
      : daysInMonth;

  const dates = Array.from(
    { length: totalDates },
    (_, index) => index + 1
  );

  const attendanceByDate = new Map(
    attendance.map((record) => [
      record.date,
      record.batchAttendance,
    ])
  );

  const monthName = new Date(
    Date.UTC(year, month - 1, 1)
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const batchCounts = new Map<
    string,
    { present: number; absent: number; leave: number }
  >();

  for (const batch of batches) {
    batchCounts.set(batch.id, {
      present: 0,
      absent: 0,
      leave: 0,
    });
  }

  for (const record of attendance) {
    for (const batch of batches) {
      const status = record.batchAttendance[batch.id];
      const counts = batchCounts.get(batch.id);

      if (!counts) continue;

      if (status === "PRESENT") counts.present++;
      if (status === "ABSENT") counts.absent++;
      if (status === "LEAVE") counts.leave++;
    }
  }

  const batchHeaders = batches
    .map((batch, index) => {
      const counts = batchCounts.get(batch.id)!;

      return `
        <th>
          <div class="batch-code">B${index + 1}</div>
          <div class="batch-title">${escapeHtml(batch.name)}</div>
          <div class="batch-stats">
            ${counts.present}P · ${counts.leave}L · ${counts.absent}A
          </div>
        </th>
      `;
    })
    .join("");

  const attendanceRows = dates
    .map((date) => {
      const dayAttendance = attendanceByDate.get(date);

      const cells = batches
        .map((batch) => {
          const status =
            dayAttendance?.[batch.id] ?? null;

          return `
            <td>
              <span class="status ${getStatusClass(status)}">
                ${getStatusLabel(status)}
              </span>
            </td>
          `;
        })
        .join("");

      const weekday = new Date(
        Date.UTC(year, month - 1, date)
      ).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      });

      return `
        <tr>
          <td class="date-cell">
            <strong>${date}</strong>
            <span class="weekday">${weekday}</span>
          </td>
          ${cells}
        </tr>
      `;
    })
    .join("");

  const totalPresent = data.presentDays;
  const totalAbsent = data.absentDays;
  const totalLeaves = data.leaves;
  const totalDays = data.totalDays;

  const emptyMessage = isFutureMonth
    ? "Attendance is not available for a future month."
    : batches.length === 0
      ? "No batches are assigned to this teacher."
      : "No attendance data for this month.";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const logoUrl = `${appUrl}/lightThemeLogo.jpeg`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Teacher Performance Report</title>

        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 277mm;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #1f2937;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Cover Page */

          .cover-page {
            width: 100%;
            height: 190mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            page-break-after: always;
            break-after: page;
          }

          .cover-logo {
            width: 55mm;
            height: 55mm;
            object-fit: contain;
            margin-bottom: 8mm;
          }

          .academy-title {
            margin: 0;
            font-size: 30pt;
            line-height: 1.2;
            font-weight: 800;
            color: #111827;
          }

          .cover-divider {
            width: 65mm;
            border: 0;
            border-top: 1mm solid #111827;
            margin: 7mm 0;
          }

          .cover-report-title {
            margin: 0;
            font-size: 21pt;
            line-height: 1.3;
            font-weight: 700;
            color: #374151;
          }

          .cover-month {
            margin-top: 3mm;
            font-size: 14pt;
            color: #6b7280;
          }

          /* Report Header */

          header {
            width: 100%;
            margin-bottom: 5mm;
          }

          .report-teacher-name {
            margin: 0;
            font-size: 28pt;
            line-height: 1.2;
            font-weight: 800;
            overflow-wrap: anywhere;
            color: #111827;
          }

          h1 {
            margin: 0;
            font-size: 24pt;
            line-height: 1.2;
            font-weight: 700;
            overflow-wrap: anywhere;
            color: #111827;
          }

          .subtitle {
            margin-top: 2mm;
            font-size: 12pt;
            color: #6b7280;
          }

          /* Summary Cards */

          .summary {
            display: flex;
            gap: 4mm;
            width: 100%;
            margin: 5mm 0 7mm;
          }

          .summary-card {
            flex: 1 1 0;
            min-width: 0;
            padding: 4mm;
            border: 1px solid #e5e7eb;
            border-radius: 2mm;
            background: #ffffff;
          }

          .summary-label {
            font-size: 10pt;
            color: #6b7280;
          }

          .summary-value {
            margin-top: 1mm;
            font-size: 20pt;
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

          h2 {
            margin: 5mm 0 3mm;
            font-size: 15pt;
            font-weight: 700;
            line-height: 1.3;
            color: #111827;
            break-after: avoid;
            page-break-after: avoid;
          }

          .section {
            width: 100%;
            margin-top: 3mm;
          }

          /* Batch Reference */

          .batch-reference {
            display: flex;
            flex-wrap: wrap;
            gap: 3mm 7mm;
            padding: 3mm;
            margin-bottom: 4mm;
            border: 1px solid #e5e7eb;
            border-radius: 2mm;
            background: #ffffff;
          }

          .reference-title {
            width: 100%;
            font-size: 10pt;
            font-weight: 700;
            color: #111827;
          }

          .reference-item {
            display: flex;
            gap: 1.5mm;
            align-items: baseline;
            font-size: 9.5pt;
            overflow-wrap: anywhere;
          }

          .reference-code {
            flex-shrink: 0;
            font-weight: 700;
            color: #111827;
          }

          .reference-name {
            color: #4b5563;
          }

          /* Attendance Table */

          .attendance-table {
            width: 100%;
            table-layout: auto;
            border-collapse: collapse;
            border-spacing: 0;
          }

          .attendance-table th,
          .attendance-table td {
            border: 0.25mm solid #d1d5db;
            padding: 2.2mm 1.2mm;
            text-align: center;
            vertical-align: middle;
            overflow-wrap: anywhere;
          }

          .attendance-table th {
            background: #f3f4f6;
            font-size: 10pt;
            font-weight: 600;
          }

          .attendance-table th:first-child,
          .attendance-table td:first-child {
            width: 18mm;
          }

          .batch-code {
            font-size: 9pt;
            color: #6b7280;
          }

          .batch-title {
            margin-top: 1mm;
            font-size: 10.5pt;
            font-weight: 700;
            line-height: 1.3;
            overflow-wrap: anywhere;
            min-width: 25mm;
          }

          .batch-stats {
            margin-top: 1mm;
            font-size: 8.5pt;
            font-weight: 400;
            color: #6b7280;
            line-height: 1.2;
          }

          .date-cell {
            font-size: 11pt;
            font-weight: 700;
            background: #f9fafb;
          }

          .weekday {
            display: block;
            margin-top: 0.5mm;
            font-size: 8pt;
            font-weight: 400;
            color: #6b7280;
          }

          /* Attendance Status */

          .status {
            display: inline-block;
            min-width: 7mm;
            padding: 1mm;
            border-radius: 1mm;
            font-size: 10pt;
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

          /* Legend */

          .legend {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4mm;
            margin-top: 4mm;
            font-size: 9pt;
            color: #6b7280;
          }

          .legend-item {
            display: flex;
            align-items: center;
            gap: 1.5mm;
          }

          /* Empty State */

          .empty {
            width: 100%;
            padding: 8mm;
            border: 0.25mm solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10pt;
          }

          /* Print Handling */

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @media screen {
            html,
            body {
              width: 277mm;
              max-width: 277mm;
              margin: 0 auto;
            }
          }

          @media print {
            html,
            body {
              width: 277mm;
              max-width: 277mm;
              min-width: 0;
              margin: 0;
              padding: 0;
              overflow: visible;
            }

            header,
            .summary,
            .section {
              max-width: 277mm;
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
          <img
            class="cover-logo"
            src="${escapeHtml(logoUrl)}"
            alt="Al-Kitaab Academy logo"
          />

          <h1 class="academy-title">AL-KITAAB ACADEMY</h1>

          <hr class="cover-divider" />

          <h2 class="cover-report-title">
            Teacher Performance Report
          </h2>

          <div class="cover-month">
            ${escapeHtml(monthName)}
          </div>
        </section>

        <header>
          <h1 class="report-teacher-name">
            ${escapeHtml(data.teacherName)}
          </h1>

          <div class="subtitle">
            Monthly Performance · ${escapeHtml(monthName)}
          </div>
        </header>

        <div class="summary">
          <div class="summary-card">
            <div class="summary-label">Assigned Batches</div>
            <div class="summary-value">${batches.length}</div>
          </div>

          <div class="summary-card">
            <div class="summary-label">Present Days</div>
            <div class="summary-value present-text">
              ${totalPresent}
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-label">Absent Days</div>
            <div class="summary-value absent-text">
              ${totalAbsent}
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-label">Leaves</div>
            <div class="summary-value leave-text">
              ${totalLeaves}
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-label">Total Records</div>
            <div class="summary-value">${totalDays}</div>
          </div>
        </div>

        <section class="section">
          <h2>Attendance</h2>

          ${
            batches.length > 0
              ? `
                <div class="batch-reference">
                  <div class="reference-title">
                    Batch Reference
                  </div>

                  ${batches
                    .map(
                      (batch, index) => `
                        <div class="reference-item">
                          <span class="reference-code">
                            B${index + 1} =
                          </span>

                          <span class="reference-name">
                            ${escapeHtml(batch.name)}
                          </span>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          ${
            !isFutureMonth && batches.length > 0 && dates.length > 0
              ? `
                <table class="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
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
                  ${escapeHtml(emptyMessage)}
                </div>
              `
          }

          <div class="legend">
            <strong>Legend:</strong>

            <span class="legend-item">
              <span class="status present">P</span>
              Present
            </span>

            <span class="legend-item">
              <span class="status absent">A</span>
              Absent
            </span>

            <span class="legend-item">
              <span class="status leave">L</span>
              Leave
            </span>

            <span class="legend-item">
              <span class="status none">—</span>
              No record
            </span>
          </div>
        </section>
      </body>
    </html>
  `;
}