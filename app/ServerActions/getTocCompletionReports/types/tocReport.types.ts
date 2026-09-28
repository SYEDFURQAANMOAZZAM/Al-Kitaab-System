export type TocReportNode = {
  id: string;
  name: string;
  position: number;

  totalLeaves: number;
  completedLeaves: number;
  percentage: number;

  children: TocReportNode[];
};

export type PartReport = {
  id: string;
  name: string;
  position: number;

  totalLeaves: number;
  completedLeaves: number;
  percentage: number;

  children: TocReportNode[];
};

export type SubjectReport = {
  id: string;
  name: string;

  totalLeaves: number;
  completedLeaves: number;
  percentage: number;

  parts: PartReport[];
};

export type StudentTocReport = {
  id: string;
  name: string;
  subjects: SubjectReport[];
};

export type BuildTocReportOptions = {
  studentIds: string[];
  subjectIds?: string[];
  month?: string;
};

export type PaginatedTocReport = {
  data: StudentTocReport[];

  page: number;
  pageSize: number;

  totalStudents: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TeacherTocReportResult =
  PaginatedTocReport;