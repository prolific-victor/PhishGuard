# PhishGuard

PhishGuard is a browser-based phishing URL triage tool. It scores a URL using a transparent set of weighted heuristics, explains which signals fired, and labels the result **Safe**, **Suspicious**, or **Dangerous**. It also supports optional HTML inspection, bulk URL checks, local scan history, a small local dataset catalog, and CSV/JSON exports.

> **Important:** PhishGuard is a demonstration and research aid, not a malware scanner, reputation service, or security guarantee. A “Safe” result only means these heuristics did not find enough warning signs. Do not enter credentials or open a suspicious site based only on this result.

## Contents

- [Features](#features)
- [How URL scoring works](#how-url-scoring-works)
- [Privacy and data storage](#privacy-and-data-storage)
- [Requirements](#requirements)
- [Install and run](#install-and-run)
- [Using the app](#using-the-app)
- [CSV dataset format](#csv-dataset-format)
- [Project structure](#project-structure)
- [Available commands](#available-commands)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)

## Features

- **Single URL analysis:** Displays a score from 0 to 100, a risk label, triggered indicators, and URL properties such as hostname, protocol, top-level domain, length, subdomain count, and domain-name entropy.
- **Optional HTML analysis:** Paste markup, load a local `.html` file, or attempt a direct browser fetch. When markup is supplied, PhishGuard checks links, visible text, and password forms. HTML is parsed locally; scripts from the markup are not executed.
- **Bulk analysis:** Analyze up to 500 URLs at once and download the results as CSV or JSON.
- **Local history and dashboard:** Keep up to 100 individual scans in this browser's local storage and see their risk distribution and average score.
- **Dataset catalog:** Import a CSV summary with `url` and `label` columns. The app counts benign and malicious labels and stores the summary locally; it does not train a model or use the dataset when scoring URLs.
- **Responsive interface:** Scanner, bulk scan, dashboard, dataset catalog, and a local demo sign-in screen.

## How URL scoring works

The analyzer lives in `src/lib/phishing-analyzer.ts`. It normalizes a URL without a scheme to `http://`, then checks for these 12 URL signals:

| Signal | Weight |
| --- | ---: |
| Raw IP address in hostname | 25 |
| Missing HTTPS | 15 |
| Suspicious top-level domain (`tk`, `xyz`, `buzz`, `top`, `click`, `work`, `support`, `zip`, `mov`) | 20 |
| Three or more subdomains | 15 |
| URL longer than 75 characters | 10 |
| Credential or account-related words in URL | 15 |
| High domain-name entropy | 12 |
| More than five special characters | 10 |
| `@` symbol in URL | 25 |
| Known brand name embedded in a different domain | 30 |
| More than three percent-encoded characters | 15 |
| More than four query parameters | 5 |

When HTML is supplied, three additional checks look for suspicious links, phishing-related language in visible page text, and password forms that submit to another host or protocol. The score is the sum of detected weights, capped at 100. Scores below 30 are **Safe**, 30–59 are **Suspicious**, and 60 or higher are **Dangerous**. These are simple indicators, not a trained or externally validated classifier; several signals can produce false positives or miss new attacks.

The single-scan page also offers “Fetch page HTML”. This makes a direct request from your browser to the entered website. Many sites block this through CORS. In that case, save/paste the HTML or use the file upload. The bulk scanner does not visit its URLs.

## Privacy and data storage

- URL heuristic analysis happens in the browser. The app does not send scan results to a server.
- Individual scan history and dataset summaries use browser `localStorage` on the current origin. They are not synced across browsers or devices. Clearing this site's browser data removes them.
- A direct HTML fetch contacts the target site from your browser. The target site may receive normal request metadata such as your IP address.
- Imported CSV contents are read in the browser and are not uploaded. Only filename, counts, and import date are retained in local storage.
- The `/auth` page is a local demo only. It does not create or authenticate a cloud account. Supabase packages/configuration may be present in the repository, but the current app routes do not use a Supabase client or require Supabase credentials.

## Requirements

- Node.js 20.19+ or 22.12+ (the project uses Vite 8).
- npm, included with Node.js.
- A modern browser with JavaScript enabled.

No API key, database, Supabase project, or environment file is needed to run this version.

## Install and run

### Clone the repository

```bash
git clone https://github.com/prolific-victor/PhishGuard.git
cd PhishGuard
```

If the repository has been renamed or transferred, replace the clone URL with its current GitHub URL. The commands below should be run from the cloned project directory (the directory containing `package.json`).

### Install dependencies and start the development server

```bash
npm ci
npm run dev
```

Open the local address printed by Vite in your terminal. This project configures the development server to use port `8080` (typically `http://localhost:8080`). Stop it with **Ctrl+C**.

`npm ci` installs the exact dependency versions recorded in `package-lock.json`. If you intentionally change dependencies, use `npm install` so npm updates the lockfile too.

To start the app later, open a terminal, change to the cloned project directory, and run:

```bash
cd path/to/safesurf-ai
npm run dev
```

For a production build and local preview:

```bash
npm run build
npm run preview
```

Vite's preview URL is printed in the terminal. The generated production files are written to `dist/`; they are build output and are ignored by Git.

## Using the app

### Scan one URL

1. Open the **Scanner** page.
2. Paste a URL or domain and select **Analyze URL**. Only HTTP and HTTPS URLs are accepted; a scheme-less domain is interpreted as HTTP.
3. Review the risk score, classification, triggered indicators, and URL profile.
4. Optionally provide HTML by pasting it, loading a local HTML file, or trying **Fetch page HTML**. Then analyze the URL again to include the markup checks.
5. Select a recent scan to view its saved result again. Recent results are local to this browser.

### Bulk scan

Open **Bulk scan**, paste one URL per line (commas and tabs are also accepted), and select **Scan URLs**. The maximum is 500 unique entries per batch. Invalid URLs are skipped. Use the CSV or JSON buttons to export valid results. Bulk scans analyze URL strings only and do not request the sites.

### Dashboard

The dashboard summarizes scan history saved by the scanner in this browser. It does not aggregate data from other users or devices.

### Datasets

Choose a CSV containing `url` and `label` headers. Labels `malicious`, `phishing`, `1`, or `bad` count as malicious; other non-empty URL rows count as benign. The app records counts and the filename only. It currently does not retain the CSV rows or use them to train or evaluate a model.

### Local demo sign-in

The `/auth` route accepts an email to demonstrate the interface. It does not validate an account, send email, protect routes, or enable cloud sync.

## CSV dataset format

At minimum, include a header and one row. For example:

```csv
url,label
https://example.com,benign
http://account-check.example.xyz/login,phishing
```

The current importer is intentionally simple: use plain comma-separated rows without commas embedded inside quoted fields. It uses `url` and `label` column names, case-insensitively.

## Project structure

```text
PhishGuard/
├── public/                  Static public assets
├── src/
│   ├── components/          Shared navigation and interface components
│   ├── lib/
│   │   └── phishing-analyzer.ts  URL/HTML heuristics and local history
│   ├── pages/               Scanner, auth demo, dashboard, datasets, bulk scan
│   ├── App.tsx              Client-side routes
│   ├── App.css               App-specific styling
│   └── index.css             Global styling
├── supabase/                Supabase project configuration (not required by current app)
├── package.json             Scripts and dependencies
└── vite.config.ts           Vite development server configuration
```

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 8080. |
| `npm run build` | Create a production bundle with Vite. |
| `npm run build:dev` | Build with Vite's development mode. |
| `npm run preview` | Serve the most recent production build locally. |
| `npm run lint` | Run ESLint over the project. |
| `npm test` | Run the Vitest test suite once. |
| `npm run test:watch` | Run Vitest in watch mode. |

## Troubleshooting

- **`npm` is not found:** Install Node.js 20.19+ or 22.12+ and reopen the terminal.
- **Port 8080 is busy:** Stop the other process using it, or change `server.port` in `vite.config.ts`.
- **A fetched page fails:** This is commonly a browser CORS restriction. Load a saved HTML file or paste its source instead.
- **Changes do not appear:** Restart the development server. If dependencies appear out of sync, remove `node_modules` and run `npm ci` again.
- **History is missing:** It is stored per browser and per local site address. Use the same browser and URL, and check that browser storage is enabled.

## Known limitations

- URL rules are static heuristics and do not query threat-intelligence feeds, DNS, WHOIS, certificates, or the destination website.
- A low score does not establish that a URL is safe. Risk labels can be wrong.
- HTML analysis only examines markup the user provides or the browser can fetch; it does not execute scripts or inspect dynamically rendered content.
- HTML fetching depends on the target site's CORS policy and contacts that site.
- History and dataset summaries are local to one browser and can be cleared by the user or browser settings.
- Sign-in is a demo and data is not backed by Supabase in the current application.
- Dataset upload is a local catalog/counting feature; it does not train the scoring rules.
