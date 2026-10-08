import type {
  AttendanceStatus,
  BatchPerformanceData,
  StudentPerformance,
  TeacherPerformance,
} from "@/app/ServerActions/batchPerformance/types";

import type {
  BatchStudentMonthProgress,
} from "@/app/ServerActions/getProgress/types";

import {
  formatLearning,
  groupLearnings,
  parseLearnings,
} from "@/app/ServerActions/getProgress/parser";

type BatchReportTemplateInput = {
  performance: BatchPerformanceData;
  progress: BatchStudentMonthProgress[];
  year: number;
  month: number;
};

const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;
const PAGE_MARGIN_MM = 8;

const CONTENT_WIDTH_MM =
  A4_LANDSCAPE_WIDTH_MM - PAGE_MARGIN_MM * 2;

const CONTENT_HEIGHT_MM =
  A4_LANDSCAPE_HEIGHT_MM - PAGE_MARGIN_MM * 2;

const STUDENT_ROW_HEIGHT_MM = 7;
const MIN_STUDENT_SECTION_SPACE_MM = 80;
const MAX_STUDENTS_ON_CONTINUATION_PAGE = 16;

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value;

  return new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00.000Z`
      : value,
  );
}

function dateKey(value: Date | string): string {
  return toDate(value).toISOString().slice(0, 10);
}

function formatMonth(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    },
  );
}

function formatDate(value: Date | string): string {
  return toDate(value).toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getMonthDays(year: number, month: number): string[] {
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: count }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const monthText = String(month).padStart(2, "0");

    return `${year}-${monthText}-${day}`;
  });
}

function statusLabel(status: AttendanceStatus | null) {
  switch (status) {
    case "PRESENT":
      return {
        label: "P",
        className: "present",
        title: "Present",
      };

    case "ABSENT":
      return {
        label: "A",
        className: "absent",
        title: "Absent",
      };

    case "LEAVE":
      return {
        label: "L",
        className: "leave",
        title: "Leave",
      };

    default:
      return {
        label: "—",
        className: "not-marked",
        title: "Not marked",
      };
  }
}

function renderStatus(status: AttendanceStatus | null): string {
  const item = statusLabel(status);

  return `<span class="status ${item.className}" title="${item.title}">${item.label}</span>`;
}

function renderLegend(): string {
  return `
    <div class="legend">
      <span><b class="present-text">P</b> Present</span>
      <span><b class="absent-text">A</b> Absent</span>
      <span><b class="leave-text">L</b> Leave</span>
      <span><b class="not-marked-text">—</b> Not marked</span>
    </div>
  `;
}

function renderAttendanceTaken(
  attendanceTaken: BatchPerformanceData["attendanceTaken"],
  days: string[],
): string {
  const takenByDate = new Map(
    attendanceTaken.map((item) => [dateKey(item.date), item.taken]),
  );

  const rows = days
    .map((date) => {
      const taken = takenByDate.get(date) ?? false;

      return `
        <tr>
          <td class="taken-date">${formatDate(date)}</td>
          <td class="taken-result">
            ${
              taken
                ? `<span class="taken"><span class="check-icon">✓</span> Taken</span>`
                : `<span class="not-taken"><span class="cross-icon">×</span> Not taken</span>`
            }
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="attendance-taken-section">
      <div class="section-heading">
        <h2>Attendance Taken</h2>
        <p>Daily record of whether batch attendance was entered.</p>
      </div>

      <table class="taken-table">
        <colgroup>
          <col class="taken-date-col" />
          <col class="taken-result-col" />
        </colgroup>

        <thead>
          <tr>
            <th>Date</th>
            <th>Attendance</th>
          </tr>
        </thead>

        <tbody>${rows}</tbody>
      </table>
    </section>
  `;
}

function renderAttendanceMatrix(
  people: Array<TeacherPerformance | StudentPerformance>,
  days: string[],
  type: "teacher" | "student",
): string {
  const isTeacher = type === "teacher";

  const nameClass = isTeacher
    ? "teacher-name-cell"
    : "student-name-cell";

  const tableClass = isTeacher
    ? "teacher-table"
    : "student-table";

  const label = isTeacher ? "Teacher" : "Student";

  const dayHeaders = days
    .map(
      (date) =>
        `<th class="day-heading">${Number(date.slice(8, 10))}</th>`,
    )
    .join("");

  const rows = people
    .map((person) => {
      const name = escapeHtml(person.name);
      const presentDays = person.presentDays;
      const eligibleDays = person.eligibleDays;

      return `
        <tr>
          <td class="${nameClass}" title="${name}">
            ${name}
          </td>

          <td class="count-cell">
            ${presentDays}/${eligibleDays}
          </td>

          ${days
            .map(
              (date) => `
                <td class="day-cell">
                  ${renderStatus(person.attendance[date] ?? null)}
                </td>
              `,
            )
            .join("")}
        </tr>
      `;
    })
    .join("");

  return `
    <table class="${tableClass}">
      <colgroup>
        <col class="person-name-col" />
        <col class="person-count-col" />
        ${days.map(() => `<col class="person-day-col" />`).join("")}
      </colgroup>

      <thead>
        <tr>
          <th class="${nameClass}">${label}</th>
          <th class="count-cell">P/E</th>
          ${dayHeaders}
        </tr>
      </thead>

      <tbody>
        ${
          rows ||
          `<tr>
            <td colspan="${days.length + 2}" class="empty-cell">
              No ${label.toLowerCase()}s available.
            </td>
          </tr>`
        }
      </tbody>
    </table>
  `;
}

function renderTeacherAttendance(
  teachers: TeacherPerformance[],
  days: string[],
): string {
  return `
    <section class="teacher-section">
      <div class="section-heading">
        <h2>Teacher Attendance</h2>
        <p>Daily attendance for the selected month.</p>
      </div>

      ${renderAttendanceMatrix(teachers, days, "teacher")}

      ${renderLegend()}
    </section>
  `;
}

function renderStudentAttendance(
  students: StudentPerformance[],
  days: string[],
  pageLabel: string,
): string {
  return `
    <section class="student-attendance-section">
      <div class="section-heading">
        <h2>Student Attendance</h2>
        <p>
          ${escapeHtml(pageLabel)}
          · P/E shows present days / eligible days.
        </p>
      </div>

      ${renderAttendanceMatrix(students, days, "student")}

      ${renderLegend()}
    </section>
  `;
}

function renderProgressForDay(
  progressRecord: NonNullable<
    BatchStudentMonthProgress["days"][number]["progress"]
  >,
): string {
  const learnings = parseLearnings(progressRecord);
  const groups = groupLearnings(learnings);

  if (!groups.length) {
    return `<span class="muted">No learning recorded</span>`;
  }

  return groups
    .map((group) => {
      const items = group.learnings
        .map((learning) => {
          const formatted = formatLearning(learning);

          const fromParts = formatted ? formatted.fromParts : [];
          const toParts = formatted ? formatted.toParts : [];
          const renderParts = (parts: typeof fromParts) =>
            parts.map((part) => `<span class="learning-label">${escapeHtml(part.label)}</span>:<span class="learning-value">${escapeHtml(part.value)}</span>`).join(' <span class="learning-part-arrow">→</span> ');
          const learningContent = `${renderParts(fromParts)}${fromParts.length && toParts.length ? "&nbsp;<strong>to</strong>&nbsp;" : ""}${renderParts(toParts)}`;

          return `
            <li>
              <strong>${escapeHtml(group.status)}:</strong>
              ${learningContent}
              <div class="learning-remark"><strong>Remark:</strong> <span class="learning-remark-value">${escapeHtml(learning.remark || "None")}</span></div>
            </li>
          `;
        })
        .join("");

      if (!items.trim()) return "";

      return `
        <div class="subject">
          <div class="subject-name">
            ${escapeHtml(group.subjectName)}
          </div>

          <ul>${items}</ul>
        </div>
      `;
    })
    .join("");
}

function renderStudentProgress(
  progress: BatchStudentMonthProgress[],
): string {
  if (!progress.length) {
    return `
      <section class="progress-section">
        <div class="section-heading">
          <h2>Student Progress</h2>
          <p>Monthly learning progress by student.</p>
        </div>

        <div class="empty">
          No students available.
        </div>
      </section>
    `;
  }

  const students = [...progress].sort((a, b) =>
    a.student.name.localeCompare(b.student.name),
  );

  return `
    <section class="progress-section">
      <div class="section-heading progress-main-heading">
        <h2>Student Progress</h2>
        <p>
          Daily learning progress for every date of the month.
        </p>
      </div>

      ${students
        .map((entry, index) => {
          const rows = entry.days
            .map(({ date, progress: progressRecord }) => {
              const learningHtml = progressRecord
                ? renderProgressForDay(progressRecord)
                : "";

              return `
                <tr>
                  <td class="progress-date">
                    ${escapeHtml(formatDate(date))}
                  </td>

                  <td class="progress-content">
                    ${
                      progressRecord
                        ? learningHtml ||
                          `<span class="muted">No learning recorded</span>`
                        : `<span class="muted">No progress recorded</span>`
                    }
                  </td>
                </tr>
              `;
            })
            .join("");

          return `
            <article class="progress-student">
              <div class="progress-student-heading">
                <h3>
                  ${index + 1}. ${escapeHtml(entry.student.name)}
                </h3>

                <span>
                  ${entry.days.length} days
                </span>
              </div>

              <table class="progress-table">
                <colgroup>
                  <col class="progress-date-col" />
                  <col />
                </colgroup>

                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Daily Progress</th>
                  </tr>
                </thead>

                <tbody>
                  ${rows}
                </tbody>
              </table>
            </article>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderStyles(): string {
  return `
    <style>
      @page {
        size: A4 landscape;
        margin: 8mm;
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        width: auto;
        margin: 0;
        padding: 0;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9pt;
        line-height: 1.35;
        color: #1f2937;
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      body {
        counter-reset: report-page;
      }

      .cover-page {
        width: ${CONTENT_WIDTH_MM}mm;
        min-height: ${CONTENT_HEIGHT_MM}mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        break-after: page;
        page-break-after: always;
      }

      .cover-logo {
        width: 55mm;
        height: 55mm;
        object-fit: contain;
        margin-bottom: 12mm;
      }

      .cover-academy-name {
        margin: 0;
        font-size: 30pt;
        line-height: 1.2;
        font-weight: 800;
        color: #111827;
      }

      .cover-divider {
        width: 35mm;
        height: 1mm;
        margin: 10mm auto;
        background: #1f2937;
      }

      .cover-report-title {
        margin: 0;
        font-size: 20pt;
        line-height: 1.3;
        font-weight: 700;
      }

      .cover-batch-name {
        margin-top: 8mm;
        font-size: 15pt;
        font-weight: 600;
      }

      .cover-month {
        margin-top: 4mm;
        font-size: 13pt;
        color: #4b5563;
      }

      .page {
        width: ${CONTENT_WIDTH_MM}mm;
        min-height: ${CONTENT_HEIGHT_MM}mm;
        margin: 0;
        padding: 0;
        position: relative;
        break-after: page;
        page-break-after: always;
      }

      .page:last-child {
        break-after: auto;
        page-break-after: auto;
      }

      .landscape-page {
        width: ${CONTENT_WIDTH_MM}mm;
        min-height: ${CONTENT_HEIGHT_MM}mm;
      }

      .landscape-running-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 5mm;
        height: 5mm;
        margin: 0 0 4mm;
        padding: 0 0 1.5mm;
        border-bottom: 0.25mm solid #cbd0d5;
        color: #374151;
        font-size: 8pt;
        line-height: 1.2;
      }

      .landscape-running-header strong {
        font-size: 12pt;
        font-weight: 700;
        color: #374151;
      }

      .landscape-running-header span {
        color: #6b7280;
        font-size: 7.5pt;
      }

      .page-counter::after {
        content: counter(page) " of " counter(pages);
      }

      .page-footer {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 5mm;
        padding-top: 1.5mm;
        border-top: 0.25mm solid #cbd0d5;
        color: #6b7280;
        font-size: 6.5pt;
        line-height: 1.2;
      }

      .first-page .page-footer {
        justify-content: flex-end;
        border-top: 0;
      }

      .landscape-page .page-footer {
        left: 0;
        right: 0;
      }

      .report-header {
        padding: 1mm 0 4mm;
        margin-bottom: 5mm;
        border-bottom: 0.4mm solid #d1d5db;
      }

      .report-header h1 {
        margin: 0;
        font-size: 20pt;
        line-height: 1.2;
        font-weight: 700;
        color: #111827;
        overflow-wrap: anywhere;
      }

      .report-subtitle {
        margin-top: 2mm;
        font-size: 9pt;
        color: #6b7280;
      }

      .report-period {
        margin-top: 1mm;
        font-size: 11pt;
        font-weight: 600;
        color: #374151;
      }

      .section-heading {
        margin: 0 0 3mm;
        padding-bottom: 2mm;
        border-bottom: 0.3mm solid #d1d5db;
      }

      .section-heading h2 {
        margin: 0;
        font-size: 13pt;
        line-height: 1.25;
        font-weight: 700;
        color: #111827;
        break-after: avoid;
        page-break-after: avoid;
      }

      .section-heading p {
        margin: 1mm 0 0;
        color: #6b7280;
        font-size: 7.5pt;
        line-height: 1.3;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      th,
      td {
        border: 0.25mm solid #d1d5db;
        vertical-align: middle;
      }

      th {
        background: #f3f4f6;
        color: #374151;
        font-weight: 700;
      }

      .taken-table {
        font-size: 8pt;
      }

      .taken-table th,
      .taken-table td {
        height: 7mm;
        padding: 1mm 3mm;
        text-align: left;
      }

      .taken-date-col {
        width: 90mm;
      }

      .taken-result-col {
        width: 90mm;
      }

      .taken-table tbody tr:nth-child(even) td {
        background: #f9fafb;
      }

      .taken {
        color: #047857;
        font-weight: 700;
      }

      .not-taken {
        color: #b91c1c;
        font-weight: 700;
      }

      .check-icon,
      .cross-icon {
        display: inline-block;
        width: 5mm;
        font-size: 10pt;
        font-weight: 700;
      }

      .teacher-section {
        margin: 0 0 5mm;
      }

      .student-attendance-section {
        margin-top: 5mm;
      }

      .teacher-table,
      .student-table {
        font-size: 7pt;
        line-height: 1.1;
      }

      .teacher-table th,
      .teacher-table td,
      .student-table th,
      .student-table td {
        height: 7mm;
        padding: 0.5mm 0.25mm;
        text-align: center;
        overflow: hidden;
      }

      .person-name-col {
        width: 58mm;
      }

      .person-count-col {
        width: 15mm;
      }

      .person-day-col {
        width: auto;
      }

      .teacher-name-cell,
      .student-name-cell {
        text-align: left !important;
        padding-left: 2mm !important;
        font-size: 8pt;
        font-weight: 600;
        overflow-wrap: anywhere;
        word-break: break-word;
      }

      .count-cell {
        white-space: nowrap;
        font-size: 7pt;
        font-weight: 600;
      }

      .day-heading {
        font-size: 7pt;
        font-weight: 700;
      }

      .day-cell {
        padding: 0 !important;
      }

      .status {
        display: inline-block;
        font-size: 7pt;
        line-height: 1.1;
        font-weight: 700;
      }

      .present,
      .present-text {
        color: #047857;
      }

      .absent,
      .absent-text {
        color: #b91c1c;
      }

      .leave,
      .leave-text {
        color: #b45309;
      }

      .not-marked,
      .not-marked-text {
        color: #9ca3af;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 4mm;
        margin-top: 2mm;
        color: #6b7280;
        font-size: 7.5pt;
      }

      .empty-cell {
        padding: 4mm;
        text-align: center;
        color: #6b7280;
      }

      .empty {
        padding: 5mm;
        border: 0.25mm solid #e5e7eb;
        text-align: center;
        color: #6b7280;
        font-size: 8pt;
      }

      .progress-section {
        margin-top: 0;
      }

      .progress-main-heading {
        margin-bottom: 4mm;
      }

      .progress-student {
        margin: 0 0 5mm;
        break-inside: auto;
        page-break-inside: auto;
      }

      .progress-student-heading {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 4mm;
        margin: 0 0 2mm;
        padding: 0 0 1.5mm;
        border-bottom: 0.3mm solid #e5e7eb;
        break-after: avoid;
        page-break-after: avoid;
      }

      .progress-student-heading h3 {
        margin: 0;
        font-size: 10pt;
        line-height: 1.3;
        font-weight: 700;
        color: #111827;
      }

      .progress-student-heading span {
        color: #6b7280;
        font-size: 7pt;
        white-space: nowrap;
      }

      .progress-table {
        font-size: 8pt;
      }

      .progress-table th,
      .progress-table td {
        padding: 2mm;
        vertical-align: top;
        overflow-wrap: anywhere;
      }

      .progress-table th {
        font-size: 7.5pt;
        text-align: left;
      }

      .progress-date-col {
        width: 44mm;
      }

      .progress-date {
        background: #f9fafb;
        font-size: 7.5pt;
        font-weight: 600;
        text-align: center;
      }

      .progress-content {
        font-size: 8pt;
        line-height: 1.4;
        text-align: left;
      }

      .subject {
        margin: 0 0 2mm;
        break-inside: auto;
        page-break-inside: auto;
      }

      .subject:last-child {
        margin-bottom: 0;
      }

      .subject-name {
        margin-bottom: 0.5mm;
        font-size: 8pt;
        font-weight: 700;
        color: #374151;
      }

      .progress-content ul {
        margin: 0.5mm 0 1mm;
        padding-left: 5mm;
      }

      .progress-content li {
        margin: 0.5mm 0;
        font-size: 8pt;
        overflow-wrap: anywhere;
      }

      .learning-label { color: #374151; font-weight: 600; }
      .learning-value { color: #6b7280; font-weight: 400; }
      .learning-part-arrow {
        color: #374151;
        font-weight: 600;
        display: inline-block;
        margin: 0 1mm;
      }
      .learning-remark { margin-top: 0.5mm; color: #6b7280; font-size: 7pt; }
      .learning-remark strong { color: #374151; font-weight: 600; }
      .learning-remark-value { color: #6b7280; font-weight: 400; }

      .muted,
      .no-progress {
        color: #6b7280;
      }

      .no-progress {
        margin: 1mm 0 3mm;
        font-size: 8pt;
      }

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
          width: auto;
          margin: 0 auto;
          background: #e5e7eb;
        }

        body {
          padding: 10mm 0;
        }

        .page {
          width: ${CONTENT_WIDTH_MM}mm;
          min-height: ${CONTENT_HEIGHT_MM}mm;
          background: #ffffff;
          margin: 0 auto 8mm;
          padding: 0;
          box-shadow: 0 1mm 4mm #00000018;
          outline: 1px solid #d1d5db;
        }

        .landscape-page {
          width: ${CONTENT_WIDTH_MM}mm;
          min-height: ${CONTENT_HEIGHT_MM}mm;
        }
      }

      @media print {
        html,
        body {
          width: auto;
          min-width: 0;
          max-width: none;
          margin: 0;
          padding: 0;
          overflow: visible;
        }

        .page {
          width: ${CONTENT_WIDTH_MM}mm;
          min-height: ${CONTENT_HEIGHT_MM}mm;
          margin: 0;
          box-shadow: none;
          outline: none;
        }

        .landscape-page {
          width: ${CONTENT_WIDTH_MM}mm;
          min-height: ${CONTENT_HEIGHT_MM}mm;
        }
      }
    </style>
  `;
}

export function createBatchReportHtml({
  performance,
  progress,
  year,
  month,
}: BatchReportTemplateInput): string {
  const days = getMonthDays(year, month);

  const batchName = performance.batch.name;
  const monthName = formatMonth(year, month);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const logoUrl = `${appUrl}/lightThemeLogo.jpeg`;

  /*
   * Page 2 reserves space for the teacher table, then only starts
   * the student table if enough space remains for a meaningful section.
   */
  const teacherBlockHeight =
    17 +
    7 +
    Math.max(performance.teachers.length, 1) *
      STUDENT_ROW_HEIGHT_MM +
    7;

  const remainingAfterTeachers =
    CONTENT_HEIGHT_MM - teacherBlockHeight;

  const canShareTeacherPage =
    remainingAfterTeachers >= MIN_STUDENT_SECTION_SPACE_MM;

  const studentRowsOnTeacherPage = canShareTeacherPage
    ? Math.max(
        1,
        Math.min(
          MAX_STUDENTS_ON_CONTINUATION_PAGE,
          Math.floor(
            (remainingAfterTeachers - 34) /
              STUDENT_ROW_HEIGHT_MM,
          ),
        ),
      )
    : 0;

  const studentChunks: StudentPerformance[][] = [];

  let nextStudentIndex = 0;

  if (studentRowsOnTeacherPage > 0) {
    studentChunks.push(
      performance.students.slice(
        0,
        studentRowsOnTeacherPage,
      ),
    );

    nextStudentIndex = studentRowsOnTeacherPage;
  }

  while (
    nextStudentIndex <
    performance.students.length
  ) {
    const chunk = performance.students.slice(
      nextStudentIndex,
      nextStudentIndex +
        MAX_STUDENTS_ON_CONTINUATION_PAGE,
    );

    studentChunks.push(chunk);
    nextStudentIndex += chunk.length;
  }

  const studentAttendancePages =
    studentChunks.length > 0
      ? studentChunks.map((chunk, index) =>
          renderStudentAttendance(
            chunk,
            days,
            `Page ${index + 1}`,
          ),
        )
      : [
          renderStudentAttendance(
            [],
            days,
            "Page 1",
          ),
        ];

  const firstStudentSection =
    canShareTeacherPage &&
    studentChunks.length > 0
      ? studentAttendancePages.shift() ?? ""
      : "";

  const continuationPages = studentAttendancePages
    .map(
      (section) => `
        <section class="page landscape-page attendance-page">
          <header class="landscape-running-header">
            <strong>Batch Performance Report</strong>
            <span>${escapeHtml(monthName)}</span>
          </header>

          ${section}

          <footer class="page-footer">
            <span>
              Illustrative attendance entries for layout preview.
            </span>

            <span>
              Page <span class="page-counter"></span>
            </span>
          </footer>
        </section>
      `,
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

        <title>
          ${escapeHtml(batchName)} - Batch Performance Report
        </title>

        ${renderStyles()}
      </head>

      <body>
        <section class="page cover-page">
          <img
            class="cover-logo"
            src="${escapeHtml(logoUrl)}"
            alt="AL-KITAAB ACADEMY logo"
          />

          <h1 class="cover-academy-name">
            AL-KITAAB ACADEMY
          </h1>

          <div class="cover-divider"></div>

          <h2 class="cover-report-title">
            Batch Performance Report
          </h2>

          <div class="cover-batch-name">
            ${escapeHtml(batchName)}
          </div>

          <div class="cover-month">
            ${escapeHtml(monthName)}
          </div>
        </section>

        <!-- PAGE 2: Report heading and complete month's attendance-taken list -->
        <section class="page first-page">
          <header class="report-header">
            <h1>${escapeHtml(batchName)}</h1>

            <div class="report-subtitle">
              Batch Performance Report
            </div>

            <div class="report-period">
              ${escapeHtml(monthName)}
            </div>
          </header>

          ${renderAttendanceTaken(
            performance.attendanceTaken,
            days,
          )}

          <footer class="page-footer">
            <span>
              Page <span class="page-counter"></span>
            </span>
          </footer>
        </section>

        <!-- Teacher attendance and student attendance -->
        <section class="page landscape-page teacher-and-student-page">
          <header class="landscape-running-header">
            <strong>Batch Performance Report</strong>
            <span>${escapeHtml(monthName)}</span>
          </header>

          ${renderTeacherAttendance(
            performance.teachers,
            days,
          )}

          ${firstStudentSection}

          <footer class="page-footer">
            <span>
              Illustrative attendance entries for layout preview.
            </span>

            <span>
              Page <span class="page-counter"></span>
            </span>
          </footer>
        </section>

        ${continuationPages}

        <!-- Student progress -->
        <section class="page progress-report-page">
          ${renderStudentProgress(progress)}

          <footer class="page-footer">
            <span>
              Batch Performance Report ·
              ${escapeHtml(monthName)}
            </span>

            <span>
              Page <span class="page-counter"></span>
            </span>
          </footer>
        </section>
      </body>
    </html>
  `;
}
