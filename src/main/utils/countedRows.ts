export function countedRows<T>(source: Iterable<T>, map: (item: T) => unknown[]): { rows: Iterable<unknown[]>; count: () => number } {
  let total = 0
  function* generate(): Generator<unknown[]> {
    for (const item of source) {
      total++
      yield map(item)
    }
  }
  return { rows: generate(), count: () => total }
}
