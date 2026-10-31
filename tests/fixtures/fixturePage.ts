export const page = (title: string | null, body: string, head = ''): string =>
  `<!doctype html><html lang="en"><head>${title === null ? '' : `<title>${title}</title>`}${head}</head><body>${body}</body></html>`
