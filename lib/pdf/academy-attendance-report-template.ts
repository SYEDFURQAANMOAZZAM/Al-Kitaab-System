import type {
  BatchPerformanceData,
  AttendanceStatus,
} from "@/app/ServerActions/academyReports/types";

type AcademyAttendanceTemplateInput = {
  batches: BatchPerformanceData[];
  academyName?: string;
  logoUrl?: string;
  year: number;
  month: number;
};

/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMonth(year: number, month: number): string {
  return new Date(
    Date.UTC(year, month - 1, 1),
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getMonthDays(year: number, month: number): string[] {
  const total = new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();

  return Array.from(
    { length: total },
    (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const m = String(month).padStart(2, "0");

      return `${year}-${m}-${day}`;
    },
  );
}

function formatDate(date: string): string {
  return new Date(
    `${date}T00:00:00.000Z`,
  ).toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* =========================================================
   ATTENDANCE STATUS
========================================================= */

function renderStatus(
  status?: AttendanceStatus | null,
): string {
  const map: Record<
    NonNullable<AttendanceStatus>,
    [string, string]
  > = {
    PRESENT: ["P", "present"],
    ABSENT: ["A", "absent"],
    LEAVE: ["L", "leave"],
  };

  if (!status) {
    return `<span class="status not-marked">—</span>`;
  }

  const [label, className] = map[status];

  return `<span class="status ${className}">${label}</span>`;
}

function renderLegend(): string {
  return `
    <div class="legend">
      <span><b class="present">P</b> Present</span>
      <span><b class="absent">A</b> Absent</span>
      <span><b class="leave">L</b> Leave</span>
      <span><b class="not-marked">—</b> Not marked</span>
    </div>
  `;
}

/* =========================================================
   ATTENDANCE TAKEN TABLE
========================================================= */

function renderAttendanceTaken(
  batch: BatchPerformanceData,
  days: string[],
): string {
  const takenMap = new Map(
    batch.attendanceTaken.map((item) => [
      String(item.date).slice(0, 10),
      item.taken,
    ]),
  );

  return `
    <table class="taken-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Attendance</th>
        </tr>
      </thead>

      <tbody>
        ${days
          .map((date) => {
            const taken =
              takenMap.get(date) ?? false;

            return `
              <tr>
                <td>${formatDate(date)}</td>

                <td class="${taken ? "taken" : "not-taken"}">
                  ${taken ? "✓ Taken" : "× Not taken"}
                </td>
              </tr>
            `;
          })
          .join("")}
      </tbody>
    </table>
  `;
}

/* =========================================================
   ATTENDANCE MATRIX
========================================================= */

function renderMatrix(
  people:
    | BatchPerformanceData["students"]
    | BatchPerformanceData["teachers"],
  days: string[],
  label: "Student" | "Teacher",
): string {
  const rows = people
    .map(
      (person) => `
        <tr>
          <td class="name">
            ${escapeHtml(person.name)}
          </td>

          <td class="count">
            ${person.presentDays}/${person.eligibleDays}
          </td>

          ${days
            .map(
              (date) => `
                <td class="day">
                  ${renderStatus(
                    person.attendance[date] ?? null,
                  )}
                </td>
              `,
            )
            .join("")}
        </tr>
      `,
    )
    .join("");

  return `
    <table class="matrix">
      <thead>
        <tr>
          <th class="name">${label}</th>
          <th class="count">P/E</th>

          ${days
            .map(
              (date) =>
                `<th class="day-heading">${Number(
                  date.slice(8, 10),
                )}</th>`,
            )
            .join("")}
        </tr>
      </thead>

      <tbody>
        ${
          rows ||
          `
            <tr>
              <td
                colspan="${days.length + 2}"
                class="empty"
              >
                No ${label.toLowerCase()}s available.
              </td>
            </tr>
          `
        }
      </tbody>
    </table>

    ${renderLegend()}
  `;
}

/* =========================================================
   REPORT HEADER
========================================================= */

function renderReportHeader(
  academyName: string,
  monthName: string,
): string {
  return `
    <header class="report-header">
      <h1>${escapeHtml(academyName)}</h1>

      <p>
        Academy Attendance Report ·
        ${escapeHtml(monthName)}
      </p>
    </header>
  `;
}

/* =========================================================
   BRANCH HEADER
========================================================= */

function renderBranchHeader(
  branchName: string,
): string {
  return `
    <header class="branch-header">
      <h2>${escapeHtml(branchName)}</h2>

      <span>Branch</span>
    </header>
  `;
}

/* =========================================================
   BATCH
========================================================= */

function renderBatch(
  batch: BatchPerformanceData,
  days: string[],
  index: number,
  isFirstBatchInBranch: boolean,
): string {
  return `
    <section
      class="batch-section ${
        isFirstBatchInBranch
          ? "first-batch"
          : ""
      }"
    >

      <header class="batch-header">
        <h2>
          ${index + 1}.
          ${escapeHtml(batch.batch.name)}
        </h2>

        <span>Monthly Attendance</span>
      </header>

      <h3>Attendance Taken</h3>

      ${renderAttendanceTaken(batch, days)}

      <h3>Teacher Attendance</h3>

      ${renderMatrix(
        batch.teachers,
        days,
        "Teacher",
      )}

      <h3>Student Attendance</h3>

      ${renderMatrix(
        batch.students,
        days,
        "Student",
      )}

    </section>
  `;
}

/* =========================================================
   BRANCH
========================================================= */

function renderBranch(
  branch: {
    id: string;
    name: string;
    batches: BatchPerformanceData[];
  },
  days: string[],
  startingBatchIndex: number,
  isFirstBranch: boolean,
): string {
  return `
    <section
      class="branch-section ${
        isFirstBranch
          ? "first-branch"
          : ""
      }"
    >

      ${renderBranchHeader(branch.name)}

      ${branch.batches
        .map((batch, index) =>
          renderBatch(
            batch,
            days,
            startingBatchIndex + index,
            index === 0,
          ),
        )
        .join("")}

    </section>
  `;
}

/* =========================================================
   GROUP BATCHES BY BRANCH
========================================================= */

function groupBatchesByBranch(
  batches: BatchPerformanceData[],
) {
  const branches = new Map<
    string,
    {
      id: string;
      name: string;
      batches: BatchPerformanceData[];
    }
  >();

  for (const batch of batches) {
    const branch = batch.branch;

    const existing = branches.get(
      branch.id,
    );

    if (existing) {
      existing.batches.push(batch);
    } else {
      branches.set(branch.id, {
        id: branch.id,
        name: branch.name,
        batches: [batch],
      });
    }
  }

  return Array.from(branches.values())
    .sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    .map((branch) => ({
      ...branch,

      batches: [...branch.batches].sort(
        (a, b) =>
          a.batch.name.localeCompare(
            b.batch.name,
          ),
      ),
    }));
}

/* =========================================================
   EMPTY REPORT
========================================================= */

function renderEmptyReport(
  academyName: string,
  monthName: string,
): string {
  return `
    <section class="empty-report">

      ${renderReportHeader(
        academyName,
        monthName,
      )}

      <p class="empty-message">
        No batch attendance data is available
        for this month.
      </p>

    </section>
  `;
}

/* =========================================================
   STYLES
========================================================= */

function styles(): string {
  return `
    <style>

      /* =====================================================
         PAGE
      ===================================================== */

      @page {
        size: A4 landscape;
        margin: 8mm;
      }

      @page cover {
        size: A4 landscape;
        margin: 15mm;
      }


      /* =====================================================
         COVER
      ===================================================== */

      .cover {
        page: cover;

        width: 267mm;
        height: 180mm;

        display: flex;
        flex-direction: column;

        justify-content: center;
        align-items: center;

        text-align: center;

        break-after: page;
        page-break-after: always;
      }


      /* =====================================================
         GLOBAL
      ===================================================== */

      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        color: #1f2937;

        font-size: 8pt;
        line-height: 1.35;

        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }


      /* =====================================================
         COVER CONTENT
      ===================================================== */

      .cover-logo {
        width: 55mm;
        height: 55mm;

        object-fit: contain;

        margin-bottom: 12mm;
      }

      .academy-name {
        font-size: 30pt;
        font-weight: 800;

        margin: 0;

        color: #111827;
      }

      .divider {
        width: 35mm;
        height: 1mm;

        background: #1f2937;

        margin: 10mm auto;
      }

      .cover-subtitle {
        font-size: 20pt;
        font-weight: 700;

        margin: 0;
      }

      .cover-period {
        font-size: 14pt;

        color: #4b5563;

        margin-top: 5mm;
      }


      /* =====================================================
         REPORT HEADER
      ===================================================== */

      .report-header {
        border-bottom:
          0.4mm solid #d1d5db;

        padding-bottom: 4mm;
        margin-bottom: 5mm;
      }

      .report-header h1 {
        margin: 0;
        font-size: 19pt;
      }

      .report-header p {
        margin: 2mm 0 0;
        color: #6b7280;
      }


      /* =====================================================
         BRANCH
      ===================================================== */

      /*
       * Every branch starts on a new page.
       *
       * The first branch follows the cover directly.
       */
      .branch-section {
        break-before: page;
        page-break-before: always;
      }

      .branch-section.first-branch {
        break-before: auto;
        page-break-before: auto;
      }

      .branch-header {
        display: flex;

        justify-content: space-between;
        align-items: baseline;

        border-bottom:
          0.5mm solid #9ca3af;

        margin-bottom: 5mm;
        padding-bottom: 2.5mm;
      }

      .branch-header h2 {
        margin: 0;

        font-size: 18pt;
        font-weight: 700;

        color: #111827;
      }

      .branch-header span {
        color: #6b7280;
        font-size: 8pt;
      }


      /* =====================================================
         BATCH
      ===================================================== */

      /*
       * Every batch starts on a new page.
       */
      .batch-section {
        break-before: page;
        page-break-before: always;

        margin-bottom: 10mm;
      }

      /*
       * First batch belongs to the branch header,
       * so it starts directly below the branch header.
       */
      .batch-section.first-batch {
        break-before: auto;
        page-break-before: auto;
      }


      /*
       * A batch may contain enough rows to require
       * multiple physical pages.
       *
       * We therefore allow the batch itself to split.
       */
      .batch-section {
        break-inside: auto;
        page-break-inside: auto;
      }


      .batch-header {
        display: flex;

        justify-content: space-between;
        align-items: baseline;

        border-bottom:
          0.4mm solid #d1d5db;

        margin-bottom: 4mm;
        padding-bottom: 2mm;
      }

      .batch-header h2 {
        font-size: 16pt;
        margin: 0;
      }

      .batch-header span {
        color: #6b7280;
      }


      /* =====================================================
         SECTION HEADINGS
      ===================================================== */

      h3 {
        font-size: 11pt;

        margin: 4mm 0 2mm;

        break-after: avoid;
        page-break-after: avoid;
      }


      /* =====================================================
         TABLES
      ===================================================== */

      table {
        width: 100%;

        border-collapse: collapse;

        table-layout: fixed;
      }

      th,
      td {
        border:
          0.25mm solid #d1d5db;

        padding: 1mm 0.5mm;

        text-align: center;
        vertical-align: middle;

        overflow: hidden;
      }

      th {
        background: #f3f4f6;

        color: #374151;

        font-weight: 700;
      }


      /* =====================================================
         ATTENDANCE TAKEN
      ===================================================== */

      .taken-table {
        width: 95mm;
        font-size: 8pt;
      }

      .taken-table th,
      .taken-table td {
        height: 7mm;

        text-align: left;

        padding: 1mm 3mm;
      }

      .taken {
        color: #047857;
        font-weight: 700;
      }

      .not-taken {
        color: #b91c1c;
        font-weight: 700;
      }


      /* =====================================================
         MATRIX
      ===================================================== */

      .matrix {
        font-size: 6.5pt;
        line-height: 1.1;
      }

      .matrix th,
      .matrix td {
        height: 7mm;
        padding: 0.5mm 0.2mm;
      }

      .matrix .name {
        width: 48mm;

        text-align: left;

        padding-left: 2mm;

        font-size: 7.5pt;
        font-weight: 600;

        overflow-wrap: anywhere;
      }

      .matrix .count {
        width: 13mm;
        white-space: nowrap;
      }

      .matrix .day {
        padding: 0;
      }


      /* =====================================================
         STATUS
      ===================================================== */

      .status {
        font-weight: 700;
      }

      .present {
        color: #047857;
      }

      .absent {
        color: #b91c1c;
      }

      .leave {
        color: #b45309;
      }

      .not-marked {
        color: #9ca3af;
      }


      /* =====================================================
         LEGEND
      ===================================================== */

      .legend {
        display: flex;

        gap: 5mm;

        margin: 2mm 0 4mm;

        color: #6b7280;

        font-size: 7pt;
      }


      /* =====================================================
         EMPTY
      ===================================================== */

      .empty {
        text-align: center;

        color: #6b7280;

        padding: 4mm;
      }

      .empty-report {
        break-before: auto;
        page-break-before: auto;
      }

      .empty-message {
        margin-top: 8mm;

        color: #6b7280;

        font-size: 10pt;

        text-align: center;
      }


      /* =====================================================
         PRINT TABLE BEHAVIOR
      ===================================================== */

      /*
       * Repeat table headers when a table spans pages.
       */
      thead {
        display: table-header-group;
      }

      /*
       * Do not split an individual row.
       */
      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }


      /* =====================================================
         FOOTER
      ===================================================== */

      .footer {
        margin-top: 4mm;

        padding-top: 2mm;

        border-top:
          0.25mm solid #d1d5db;

        text-align: right;

        color: #6b7280;

        font-size: 7pt;
      }

    </style>
  `;
}

/* =========================================================
   MAIN TEMPLATE
========================================================= */

export function createAcademyAttendanceReportHtml({
  batches,
  academyName = "AL-KITAAB ACADEMY",
  logoUrl,
  year,
  month,
}: AcademyAttendanceTemplateInput): string {
  const monthName = formatMonth(
    year,
    month,
  );

  const days = getMonthDays(
    year,
    month,
  );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const logo =
    logoUrl ??
    `${appUrl}/lightThemeLogo.jpeg`;


  /* =======================================================
     GROUP BATCHES BY BRANCH

     Example:

     Branch A
       Batch 1
       Batch 2

     Branch B
       Batch 3
       Batch 4
  ======================================================= */

  const groupedBranches =
    groupBatchesByBranch(batches);

  let batchNumber = 0;


  /* =======================================================
     RENDER BRANCHES
  ======================================================= */

  const batchContent =
    groupedBranches.length > 0
      ? groupedBranches
          .map(
            (branch, branchIndex) => {
              const content =
                renderBranch(
                  branch,
                  days,
                  batchNumber,
                  branchIndex === 0,
                );

              batchNumber +=
                branch.batches.length;

              return content;
            },
          )
          .join("")
      : renderEmptyReport(
          academyName,
          monthName,
        );


  /* =======================================================
     HTML
  ======================================================= */

  return `
    <!DOCTYPE html>

    <html lang="en">

      <head>
        <meta charset="UTF-8" />

        <title>
          ${escapeHtml(academyName)}
          - Academy Attendance Report
        </title>

        ${styles()}
      </head>


      <body>

        <!-- ===============================================
             COVER PAGE
        ================================================ -->

        <section class="cover">

          <img
            class="cover-logo"
            src="${escapeHtml(logo)}"
            alt="${escapeHtml(academyName)} logo"
          />

          <h1 class="academy-name">
            ${escapeHtml(academyName)}
          </h1>

          <div class="divider"></div>

          <h2 class="cover-subtitle">
            Academy Attendance Report
          </h2>

          <div class="cover-period">
            ${escapeHtml(monthName)}
          </div>

        </section>


        <!-- ===============================================
             BRANCHES + BATCHES
        ================================================ -->

        ${batchContent}


        <!-- ===============================================
             FOOTER
        ================================================ -->

        ${
          batches.length > 0
            ? `
              <div class="footer">
                Academy Attendance Report ·
                ${escapeHtml(monthName)}
              </div>
            `
            : ""
        }

      </body>

    </html>
  `;
}