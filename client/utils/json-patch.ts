type PathSegment = string | number;

/**
 * Vibecoded - not according to the Patch Standard!
 *
 * Mutates the original object by setting the value at path.
 * - Creates intermediate objects/arrays if missing
 * - Always initializes the final segment with the provided value
 */
export function setValueAtPath(
  obj: unknown,
  path: PathSegment[],
  value: unknown,
): void {
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error("Path must be a non-empty array");
  }

  if (obj == null || typeof obj !== "object") {
    throw new Error("Target must be an object or array");
  }

  let current: any = obj;

  // Walk to parent of last segment
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i];
    const nextSegment = path[i + 1];

    if (current[segment] == null) {
      // Create missing structure based on next segment type
      current[segment] = typeof nextSegment === "number" ? [] : {};
    } else if (typeof current[segment] !== "object") {
      throw new Error(
        `Cannot traverse into non-object value at segment "${segment}"`,
      );
    }

    current = current[segment];
  }

  // Always initialize/overwrite final segment
  const lastSegment = path[path.length - 1];
  if (Array.isArray(current[lastSegment])) {
    current[lastSegment].push(value);
  } else {
    current[lastSegment] = value;
  }
}
