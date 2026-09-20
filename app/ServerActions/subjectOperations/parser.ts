/* =========================================================
   SUBJECT TOC PARSER
========================================================= */

export type ParserPart = {
  id: string;
  name: string;
  position: number;
};

export type ParsedTocItem = {
  partId: string;
  name: string;
  level: number;
  parentIndex: number | null;
  sourceLine: number;
};

/* =========================================================
   RANGE SYNTAX
=========================================================

   Supported:

   range(i=1-10):{i}

   range(i=1-3):Exercise {i}

   range(i=1-3):Question {i}

   range(num=1-3):Exercise {num}

   The variable is replaced ONLY when it appears
   inside { }.

   Example:

   range(i=1-3):Exercise {i}

   becomes:

   Exercise 1
   Exercise 2
   Exercise 3

   This:

   range(i=1-3):Exercise

   becomes:

   Exercise
   Exercise
   Exercise

   The "i" inside "Exercise" is not replaced.
========================================================= */

const RANGE_RE =
  /^range\s*\(\s*([A-Za-z]+)\s*=\s*(-?\d+)\s*-\s*(-?\d+)\s*\)\s*:\s*(.*)$/;

/* =========================================================
   RANGE EXPANSION
========================================================= */

function expandValue(value: string): string[] {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("A value cannot be empty.");
  }

  /* -------------------------------------------------------
     Normal value
  ------------------------------------------------------- */

  if (!trimmed.startsWith("range")) {
    return [trimmed];
  }

  /* -------------------------------------------------------
     Range value
  ------------------------------------------------------- */

  const match = trimmed.match(RANGE_RE);

  if (!match) {
    throw new Error(
      `Invalid range syntax "${trimmed}". ` +
        `Expected "range(i=1-10):{i}" or "range(i=1-10):Exercise {i}".`,
    );
  }

  const [, variable, fromRaw, toRaw, template] =
    match;

  const from = Number(fromRaw);
  const to = Number(toRaw);

  /* -------------------------------------------------------
     Validate range
  ------------------------------------------------------- */

  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to)
  ) {
    throw new Error(
      `Range values must be integers in "${trimmed}".`,
    );
  }

  if (from > to) {
    throw new Error(
      `Range start cannot be greater than range end in "${trimmed}".`,
    );
  }

  /* -------------------------------------------------------
     Generate values
  ------------------------------------------------------- */

  const values: string[] = [];

  for (let i = from; i <= to; i++) {
    /*
     * Only replace the exact placeholder:
     *
     * {i}
     *
     * Do not replace occurrences of the variable
     * outside braces.
     */

    const placeholder = `{${variable}}`;

    const generatedValue = template
      .split(placeholder)
      .join(String(i))
      .trim();

    if (!generatedValue) {
      throw new Error(
        `Range "${trimmed}" generated an empty value.`,
      );
    }

    values.push(generatedValue);
  }

  return values;
}

/* =========================================================
   PARSE ONE LINE
========================================================= */

function parseLine(
  line: string,
  lineNumber: number,
  partsByName: Map<string, ParserPart>,
) {
  /*
   * Indentation is intentionally ignored.
   *
   * Hierarchy comes from SubjectPart.position.
   */

  const content = line.trim();

  if (!content) {
    throw new Error(
      `Line ${lineNumber}: line is empty.`,
    );
  }

  /* -------------------------------------------------------
     Find first colon
  ------------------------------------------------------- */

  const colonIndex = content.indexOf(":");

  if (colonIndex <= 0) {
    throw new Error(
      `Line ${lineNumber}: expected "SubjectPart:value".`,
    );
  }

  /*
   * Everything before the first colon is the
   * SubjectPart name.
   *
   * Everything after it is the value.
   *
   * This is important because range syntax itself
   * contains another colon.
   */

  const partName = content
    .slice(0, colonIndex)
    .trim();

  const value = content
    .slice(colonIndex + 1)
    .trim();

  if (!partName) {
    throw new Error(
      `Line ${lineNumber}: subject part name is missing.`,
    );
  }

  if (!value) {
    throw new Error(
      `Line ${lineNumber}: value is missing.`,
    );
  }

  /* -------------------------------------------------------
     Find SubjectPart
  ------------------------------------------------------- */

  const part = partsByName.get(partName);

  if (!part) {
    throw new Error(
      `Line ${lineNumber}: "${partName}" is not a SubjectPart name.`,
    );
  }

  return {
    part,
    values: expandValue(value),
  };
}

/* =========================================================
   PARSE COMPLETE TOC
========================================================= */

export function parseToc(
  text: string,
  parts: ParserPart[],
): ParsedTocItem[] {
  /* -------------------------------------------------------
     Validate input
  ------------------------------------------------------- */

  if (!text.trim()) {
    throw new Error(
      "TOC text cannot be empty.",
    );
  }

  /* -------------------------------------------------------
     Sort SubjectParts by hierarchy position
  ------------------------------------------------------- */

  const orderedParts = [...parts].sort(
    (a, b) => a.position - b.position,
  );

  if (orderedParts.length === 0) {
    throw new Error(
      "This subject has no SubjectPart hierarchy.",
    );
  }

  /* -------------------------------------------------------
     Validate hierarchy positions
     
     Must be:

     0, 1, 2, 3...
  ------------------------------------------------------- */

  for (
    let i = 0;
    i < orderedParts.length;
    i++
  ) {
    if (orderedParts[i].position !== i) {
      throw new Error(
        "SubjectPart hierarchy positions must be consecutive starting from 0.",
      );
    }
  }

  /* -------------------------------------------------------
     SubjectPart names must be unique
  ------------------------------------------------------- */

  const partsByName =
    new Map<string, ParserPart>();

  for (const part of orderedParts) {
    const name = part.name.trim();

    if (!name) {
      throw new Error(
        "A SubjectPart name cannot be empty.",
      );
    }

    if (partsByName.has(name)) {
      throw new Error(
        `Duplicate SubjectPart name "${name}".`,
      );
    }

    partsByName.set(name, part);
  }

  /* -------------------------------------------------------
     Split input into physical lines
     
     Indentation has no meaning.
  ------------------------------------------------------- */

  const lines = text.split(/\r?\n/);

  const result: ParsedTocItem[] = [];

  /* -------------------------------------------------------
     Latest item at each hierarchy level
     
     Example:

     latestByLevel[0] = latest Para
     latestByLevel[1] = latest Surah
     latestByLevel[2] = latest Ruku
     latestByLevel[3] = latest Ayat
  ------------------------------------------------------- */

  const latestByLevel: Array<
    number | null
  > = new Array(
    orderedParts.length,
  ).fill(null);

  /*
   * Tracks hierarchy levels where the latest
   * value was generated from a multi-value range.
   *
   * Example:
   *
   * Para:range(i=1-3):{i}
   *
   * generates:
   *
   * Para 1
   * Para 2
   * Para 3
   *
   * A following Surah cannot safely choose
   * which one of those three should be its parent.
   */

  const rangedLevels = new Set<number>();

  /* =======================================================
     PROCESS LINES
  ======================================================= */

  for (
    let lineIndex = 0;
    lineIndex < lines.length;
    lineIndex++
  ) {
    const rawLine = lines[lineIndex];

    /* -----------------------------------------------------
       Ignore empty lines
    ----------------------------------------------------- */

    if (!rawLine.trim()) {
      continue;
    }

    const lineNumber = lineIndex + 1;

    /* -----------------------------------------------------
       Parse line
    ----------------------------------------------------- */

    const parsed = parseLine(
      rawLine,
      lineNumber,
      partsByName,
    );

    const {
      part,
      values,
    } = parsed;

    /* -----------------------------------------------------
       SubjectPart position = hierarchy level
    ----------------------------------------------------- */

    const level = part.position;

    /* -----------------------------------------------------
       Resolve parent
       
       Every level except level 0 must have the
       latest item from the immediately previous level.
    ----------------------------------------------------- */

    let parentIndex: number | null = null;

    if (level > 0) {
      parentIndex =
        latestByLevel[level - 1];

      if (parentIndex === null) {
        throw new Error(
          `Line ${lineNumber}: "${part.name}" has no parent at SubjectPart position ${level - 1}.`,
        );
      }

      /*
       * A multi-value range creates multiple possible
       * parents, so a child cannot safely determine
       * which parent it belongs to.
       */

      if (
        rangedLevels.has(level - 1)
      ) {
        throw new Error(
          `Line ${lineNumber}: "${part.name}" cannot follow a range at SubjectPart level ${level - 1}, because the previous SubjectPart generated multiple possible parents.`,
        );
      }
    }

    /* -----------------------------------------------------
       Generate TOC items
    ----------------------------------------------------- */

    const generatedIndexes: number[] = [];

    for (const value of values) {
      const index = result.length;

      result.push({
        partId: part.id,
        name: value,
        level,
        parentIndex,
        sourceLine: lineNumber,
      });

      generatedIndexes.push(index);
    }

    /* -----------------------------------------------------
       Update latest hierarchy item
    ----------------------------------------------------- */

    if (generatedIndexes.length === 1) {
      /*
       * Exactly one item was generated.
       * It can safely become the current parent.
       */

      latestByLevel[level] =
        generatedIndexes[0];

      rangedLevels.delete(level);
    } else {
      /*
       * Multiple items were generated.
       * There is no single safe parent.
       */

      latestByLevel[level] = null;

      rangedLevels.add(level);
    }

    /* -----------------------------------------------------
       Clear deeper hierarchy levels
       
       Example:

       Para
       Surah
       Ruku
       Ayat

       Then a new Surah starts.

       The previous Ruku and Ayat are no longer
       valid current parents.
    ----------------------------------------------------- */

    for (
      let deeperLevel = level + 1;
      deeperLevel < orderedParts.length;
      deeperLevel++
    ) {
      latestByLevel[deeperLevel] = null;
      rangedLevels.delete(deeperLevel);
    }
  }

  /* -------------------------------------------------------
     Ensure something was parsed
  ------------------------------------------------------- */

  if (result.length === 0) {
    throw new Error(
      "No TOC items were found.",
    );
  }

  /* -------------------------------------------------------
     Final hierarchy validation
     
     Every item except level 0 must have a parent.
  ------------------------------------------------------- */

  for (const item of result) {
    if (
      item.level > 0 &&
      item.parentIndex === null
    ) {
      throw new Error(
        `Line ${item.sourceLine}: "${item.name}" has no valid parent.`,
      );
    }
  }

  return result;
}