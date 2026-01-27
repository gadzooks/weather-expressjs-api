/**
 * JSON serializer that removes null, undefined, and empty arrays
 * to reduce response payload size
 */
export function removeNullValues(
  key: string,
  value: unknown
): unknown | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  // Remove empty arrays for specific fields that are often empty
  if (Array.isArray(value) && value.length === 0) {
    const emptyArrayFields = ['stations', 'preciptype', 'alertIds'];
    if (emptyArrayFields.includes(key)) {
      return undefined;
    }
  }

  return value;
}

export function serializeWithoutNulls(obj: unknown): string {
  return JSON.stringify(obj, removeNullValues);
}
