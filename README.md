<p align="center">
  <img src="src/renderer/src/assets/crawlwiseLogo.svg" alt="Crawlwise" width="280" />
</p>

# Crawlwise

Crawlwise is a desktop website crawler for technical SEO audits. It crawls a site, finds SEO issues, and shows the results in a table, a detail pane and charts. Crawl data stays on your computer.

## Features

- **Spider mode and List mode.** Crawl from a start URL, or crawl a list of URLs.
- **SEO checks.** Response codes, page titles, meta descriptions, meta keywords, H1, H2, canonicals, images, content, security headers, and more. Each tab has filters for issues.
- **JavaScript rendering.** Render pages in Chromium, keep screenshots, and read the Chrome console log.
- **Accessibility checks** with axe-core on rendered pages.
- **Detail pane.** URL details, inlinks, outlinks, resources, SERP snippet, rendered page, HTTP headers, cookies, duplicate details, structured data and page source.
- **Right panel.** Overview, issues, site structure, crawl depth and response time charts, and API status.
- **Integrations.** Google Search Console, GA4, URL Inspection and PageSpeed Insights.
- **Crawl comparison** between two saved crawls.
- **Exports.** CSV or XLSX for any tab, plus bulk exports and an issues report.
- **Scheduling.** Run crawls on a schedule with Windows Task Scheduler.
- **CLI.** Run headless crawls and exports from the command line.
- **Light and dark themes.** Column layouts are saved per tab.

## Requirements

- Node.js and npm. The project is tested with Node.js 24.
- Windows for the scheduling feature. The other features use Electron and work on any desktop platform that Electron supports, but they are only tested on Windows.

## Getting started

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app in development mode. |
| `npm run build` | Build the app into `out/`. |
| `npm start` | Run the built app. |
| `npm run typecheck` | Check types with TypeScript. |
| `npm test` | Run unit and integration tests. |
| `npm run test:e2e` | Build the app and run end-to-end tests. |
| `npm run cli -- --help` | Show the CLI help. Run `npm run build` first. |

## CLI

```bash
npm run build
npm run cli -- --crawl https://example.com --output-folder ./crawl --export-tabs "page-titles:missing" --export-format xlsx
```

Run `npm run cli -- --list-exports` to see every filter key and bulk export key. The CLI crawls raw HTML. JavaScript rendering, Search Console and GA4 need the desktop app.

## Google setup (Search Console and GA4)

You do not need a Google account to crawl. Only the Search Console and GA4 integrations need one. Crawlwise does not ship a shared OAuth client, so you create your own client one time. The client is free.

### 1. Create the OAuth client

1. Open the Google Cloud console. Select or create a project.
2. In **APIs and Services > Library**, enable these APIs:
   - Google Search Console API
   - Google Analytics Data API
   - Google Analytics Admin API
3. In **Google Auth Platform**, set up the consent screen. Set the audience to **External**. While the app is in **Testing**, add your Google account as a test user.
4. Go to **Clients > Create client**. Select the application type **Desktop app**.
5. Copy the **Client ID** and the **Client secret**.

In **Testing** status, the sign-in expires after 7 days. In **In production** status, it does not expire, but Google shows an "unverified app" warning that you can accept for your own account. Google can change these rules, so check the Google Cloud console.

### 2. Connect the app

1. Open **Configuration > API Access**.
2. In **Google Account**, paste the client ID and the client secret.
3. Click **Connect**. Sign in with your browser and allow read access.

The app receives the sign-in on a temporary local address (`http://127.0.0.1:<port>`) and uses PKCE. Do not close the app during the sign-in.

### 3. Select the properties

- **Search Console:** click **Load Properties**, select a property, then select **Import Search Console data for this crawl**. You can also crawl new URLs found in Search Console and run URL Inspection (Google allows 2,000 inspections a day for each property).
- **GA4:** click **Load Properties**, select the property, then select **Import GA4 data for this crawl**.

The import runs when the crawl starts. URLs that Search Console or GA4 know about but the crawl did not find are shown as possible orphan pages.

## Project structure

```
src/
  main/       Electron main process: crawler, database, exports, Google, scheduling
  preload/    Safe bridge between the main process and the UI
  renderer/   React UI
  shared/     Types, constants and helpers used by all processes
  cli/        Command line entry point
tests/        Unit, integration and end-to-end tests
resources/    App icons
```
