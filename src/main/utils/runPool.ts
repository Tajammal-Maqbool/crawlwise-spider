export async function runPool<T>(items: T[], concurrency: number, stopped: () => boolean, work: (item: T) => Promise<void>): Promise<void> {
  let next = 0
  const lane = async () => {
    while (next < items.length && !stopped()) await work(items[next++])
  }
  await Promise.all(Array.from({ length: concurrency }, lane))
}
