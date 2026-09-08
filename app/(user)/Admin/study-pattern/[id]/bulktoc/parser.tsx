// app/(user)/Admin/study-pattern/[id]/toc/parser.ts

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

/**
 * TOC Parser
 *
 * Supported range syntax:
 *
 *   range(i=1-10):{i}
 *
 *   range(i=1-3):Exercise {i}
 *
 *   range(i=1-3):Question {i}
 *
 *   range(num=1-3):Exercise {num}
 *
 * The variable is replaced ONLY when it appears inside { }.
 *
 * Examples:
 *
 *   range(i=1-3):{i}
 *
 *   -> 1
 *   -> 2
 *   -> 3
 *
 *
 *   range(i=1-3):Exercise {i}
 *
 *   -> Exercise 1
 *   -> Exercise 2
 *   -> Exercise 3
 *
 *
 *   range(i=1-3):Exercise
 *
 *   -> Exercise
 *   -> Exercise
 *   -> Exercise
 *
 * No other occurrence of the variable is replaced.
 *
 * For example:
 *
 *   range(i=1-3):Exercise
 *
 * does NOT modify the "i" inside "Exercise".
 *
 *
 * IMPORTANT:
 *
 * Indentation has NO meaning.
 *
 * Hierarchy is determined ONLY by PatternArr.position.
 *
 * Example:
 *
 *   Para  -> position 0
 *   Surah -> position 1
 *   Ruku  -> position 2
 *   Ayat  -> position 3
 */

/**
 * Range syntax:
 *
 * range(i=1-10):{i}
 * range(i=1-10):Exercise {i}
 *
 * Groups:
 *
 * 1. variable
 * 2. from
 * 3. to
 * 4. template
 *
 * The template is everything after the colon.
 */
const RANGE_RE =
  /^range\s*\(\s*([A-Za-z]+)\s*=\s*(-?\d+)\s*-\s*(-?\d+)\s*\)\s*:\s*(.*)$/;

/**
 * Placeholder regex.
 *
 * Only a variable surrounded by { } is considered
 * a replacement placeholder.
 *
 * Example:
 *
 *   {i}       -> replace
 *   {num}     -> replace
 *   Exercise  -> do not replace
 *   Exercisei -> do not replace
 */
const PLACEHOLDER_RE = /\{([A-Za-z]+)\}/g;

/**
 * Expands a normal value or range.
 */
function expandValue(value: string): string[] {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("A value cannot be empty.");
  }

  /**
   * Normal value.
   *
   * Anything that does not start with "range"
   * is returned unchanged.
   */
  if (!trimmed.startsWith("range")) {
    return [trimmed];
  }

  /**
   * Range value.
   */
  const match = trimmed.match(RANGE_RE);

  if (!match) {
    throw new Error(
      `Invalid range syntax "${trimmed}". ` +
        `Expected "range(i=1-10):{i}" or "range(i=1-10):Exercise {i}".`,
    );
  }

  const [, variable, fromRaw, toRaw, template] = match;

  const from = Number(fromRaw);
  const to = Number(toRaw);

  /**
   * Validate numeric range.
   */
  if (!Number.isInteger(from) || !Number.isInteger(to)) {
    throw new Error(
      `Range values must be integers in "${trimmed}".`,
    );
  }

  /**
   * Validate range direction.
   */
  if (from > to) {
    throw new Error(
      `Range start cannot be greater than range end in "${trimmed}".`,
    );
  }

  /**
   * Make sure the template contains the requested
   * variable placeholder.
   *
   * Example:
   *
   * range(i=1-3):Exercise {i}
   *
   * contains {i} -> valid.
   *
   *
   * range(i=1-3):Exercise
   *
   * does not contain {i}.
   *
   * This is still allowed because the template
   * itself is valid and simply produces the same
   * text for every range value.
   *
   * Therefore we do NOT require the placeholder.
   */

  const values: string[] = [];

  for (let i = from; i <= to; i++) {
    /**
     * Replace ONLY the exact placeholder:
     *
     * {variable}
     *
     * Example:
     *
     * variable = "i"
     *
     * "Exercise {i}" -> "Exercise 1"
     *
     * "Exercisei"   -> unchanged
     *
     * "Hindi"       -> unchanged
     */
    const placeholder = `{${variable}}`;

    const generatedValue = template.split(placeholder).join(String(i));

    values.push(generatedValue.trim());
  }

  return values;
}

/**
 * Parses one physical input line.
 *
 * Example:
 *
 *   Surah:1 Al-Fatiha
 *
 * or:
 *
 *   Ayat:range(i=1-7):{i}
 */
function parseLine(
  line: string,
  lineNumber: number,
  partsByName: Map<string, ParserPart>,
) {
  /**
   * Remove leading/trailing whitespace.
   *
   * Indentation is therefore optional and irrelevant.
   */
  const content = line.trim();

  if (!content) {
    throw new Error(
      `Line ${lineNumber}: line is empty.`,
    );
  }

  /**
   * Find the first colon.
   *
   * Everything before it is the PatternArr name.
   * Everything after it is the value.
   */
  const colonIndex = content.indexOf(":");

  if (colonIndex <= 0) {
    throw new Error(
      `Line ${lineNumber}: expected "PatternPart:value".`,
    );
  }

  /**
   * PatternArr name.
   *
   * We intentionally do NOT lowercase it.
   *
   * "Para" -> valid
   * "para" -> invalid
   * "PARA" -> invalid
   */
  const partName = content
    .slice(0, colonIndex)
    .trim();

  /**
   * Value.
   *
   * Keep everything after the first colon.
   *
   * This is important because a range itself contains
   * another colon:
   *
   * range(i=1-10):Exercise {i}
   */
  const value = content
    .slice(colonIndex + 1)
    .trim();

  if (!partName) {
    throw new Error(
      `Line ${lineNumber}: pattern part name is missing.`,
    );
  }

  if (!value) {
    throw new Error(
      `Line ${lineNumber}: value is missing.`,
    );
  }

  /**
   * Find PatternArr by exact name.
   */
  const part = partsByName.get(partName);

  if (!part) {
    throw new Error(
      `Line ${lineNumber}: "${partName}" is not a PatternArr name.`,
    );
  }

  return {
    part,
    values: expandValue(value),
  };
}

/**
 * Parses the complete TOC.
 *
 * HIERARCHY RULE
 * --------------
 *
 * Hierarchy is determined ONLY by PatternArr.position.
 *
 * Example:
 *
 *   Para  -> position 0
 *   Surah -> position 1
 *   Ruku  -> position 2
 *   Ayat  -> position 3
 *
 * Input can therefore be written as:
 *
 *   Para:1
 *   Surah:1 Al-Fatiha
 *   Ruku:1
 *   Ayat:range(i=1-7):{i}
 *
 * or:
 *
 *   Para:1
 *       Surah:1 Al-Fatiha
 *           Ruku:1
 *               Ayat:range(i=1-7):{i}
 *
 * Both produce exactly the same hierarchy.
 */
export function parseToc(
  text: string,
  parts: ParserPart[],
): ParsedTocItem[] {
  if (!text.trim()) {
    throw new Error(
      "TOC text cannot be empty.",
    );
  }

  /**
   * Sort PatternArr by hierarchy position.
   */
  const orderedParts = [...parts].sort(
    (a, b) => a.position - b.position,
  );

  if (!orderedParts.length) {
    throw new Error(
      "This pattern has no PatternArr hierarchy.",
    );
  }

  /**
   * Validate PatternArr positions.
   *
   * They must be:
   *
   *   0, 1, 2, 3...
   */
  for (
    let i = 0;
    i < orderedParts.length;
    i++
  ) {
    if (orderedParts[i].position !== i) {
      throw new Error(
        "PatternArr hierarchy positions must be consecutive starting from 0.",
      );
    }
  }

  /**
   * PatternArr names must be unique.
   */
  const partsByName =
    new Map<string, ParserPart>();

  for (const part of orderedParts) {
    const name = part.name.trim();

    if (!name) {
      throw new Error(
        "A PatternArr name cannot be empty.",
      );
    }

    if (partsByName.has(name)) {
      throw new Error(
        `Duplicate PatternArr name "${name}".`,
      );
    }

    partsByName.set(name, part);
  }

  /**
   * Split into physical lines.
   *
   * Indentation is irrelevant.
   */
  const lines = text.split(/\r?\n/);

  const result: ParsedTocItem[] = [];

  /**
   * Stores the latest generated item at each hierarchy level.
   *
   * Example:
   *
   * latestByLevel[0] = latest Para
   * latestByLevel[1] = latest Surah
   * latestByLevel[2] = latest Ruku
   * latestByLevel[3] = latest Ayat
   */
  const latestByLevel: Array<number | null> =
    new Array(orderedParts.length).fill(null);

  /**
   * Tracks whether a range generated multiple items
   * at a particular level.
   *
   * Example:
   *
   *   Para:range(i=1-3):{i}
   *
   * generates:
   *
   *   Para 1
   *   Para 2
   *   Para 3
   *
   * A following Surah cannot safely determine which
   * Para should be its parent.
   */
  const rangedLevels = new Set<number>();

  for (
    let lineIndex = 0;
    lineIndex < lines.length;
    lineIndex++
  ) {
    const rawLine = lines[lineIndex];

    /**
     * Empty lines are ignored.
     */
    if (!rawLine.trim()) {
      continue;
    }

    const lineNumber = lineIndex + 1;

    const parsed = parseLine(
      rawLine,
      lineNumber,
      partsByName,
    );

    const {
      part,
      values,
    } = parsed;

    /**
     * PatternArr.position IS the hierarchy level.
     *
     * No indentation is used.
     */
    const level = part.position;

    /**
     * A child needs the latest item at the
     * immediately previous PatternArr level.
     *
     * Example:
     *
     * Surah (position 1)
     *     parent = latest Para (position 0)
     *
     * Ruku (position 2)
     *     parent = latest Surah (position 1)
     *
     * Ayat (position 3)
     *     parent = latest Ruku (position 2)
     */
    let parentIndex: number | null = null;

    if (level > 0) {
      parentIndex =
        latestByLevel[level - 1];

      if (parentIndex === null) {
        throw new Error(
          `Line ${lineNumber}: "${part.name}" has no parent at PatternArr position ${level - 1}.`,
        );
      }

      /**
       * If the immediate parent was generated from
       * a multi-value range, it has multiple possible
       * parents and therefore cannot safely have children.
       */
      if (
        rangedLevels.has(level - 1)
      ) {
        throw new Error(
          `Line ${lineNumber}: "${part.name}" cannot follow a range at hierarchy level ${level - 1}, because the previous PatternArr generated multiple possible parents.`,
        );
      }
    }

    /**
     * Generate all values.
     *
     * Every generated item from the same line
     * receives the SAME parentIndex.
     */
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

    /**
     * A single generated item becomes the latest
     * hierarchy item at this level.
     */
    if (generatedIndexes.length === 1) {
      latestByLevel[level] =
        generatedIndexes[0];

      /**
       * This level is no longer a multi-parent range.
       */
      rangedLevels.delete(level);
    } else {
      /**
       * Multiple generated values at this level
       * cannot provide a single parent for children.
       */
      latestByLevel[level] = null;

      rangedLevels.add(level);
    }

    /**
     * Clear all deeper hierarchy levels.
     *
     * Example:
     *
     * We move from:
     *
     *   Para -> Surah -> Ruku -> Ayat
     *
     * to:
     *
     *   Surah
     *
     * The previous Ruku and Ayat are no longer
     * current parents.
     */
    for (
      let deeperLevel = level + 1;
      deeperLevel < orderedParts.length;
      deeperLevel++
    ) {
      latestByLevel[deeperLevel] = null;
      rangedLevels.delete(deeperLevel);
    }
  }

  if (!result.length) {
    throw new Error(
      "No TOC items were found.",
    );
  }

  /**
   * Final validation:
   *
   * Every item except level 0 must have a parent.
   */
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

