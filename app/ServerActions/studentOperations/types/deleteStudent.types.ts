export type DeleteStudentResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };