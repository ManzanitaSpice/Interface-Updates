# Interface updates feed and minimal draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish INTERFACE's GitHub Releases as a JSON feed and a plain draft page from a new GitHub Pages repository.

**Architecture:** A dependency-free Node.js script reads the public `ManzanitaSpice/Interface-2` releases API and writes a normalized feed into a static Pages artifact. A small HTML/JS page reads that feed and displays versions, notes, and downloadable assets. GitHub Actions builds and deploys the artifact on pushes, hourly, or manual dispatch.

**Tech Stack:** Node.js 24 built-in `fetch`, plain HTML/CSS/JavaScript, GitHub REST API, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-20-interface-updates-backend-design.md`

## Global Constraints

- Source repository: `ManzanitaSpice/Interface-2`.
- Include published releases only; exclude drafts and ordinary tags, include published prereleases, exclude individual commits.
- Preserve release notes as Markdown text and expose uploaded asset download URLs.
- Read the public source without credentials or secrets.
- Serve the feed as `data/releases.json` under the project-site path for `ManzanitaSpice/Interface-Updates`.
- The draft page uses browser-default styling and is not the final visual design.
- Do not modify `C:\CodigoInterface` or `Interface-2`.
- Automated tests are outside this request; no test files or test commands are planned.

## Review Focus

These conditions need code review because they can break the public feed or page:

- GitHub pagination beyond the first 100 releases must not silently truncate history.
- API, rate-limit, malformed-response, and empty-response failures must stop deployment rather than publish a blank feed.
- Draft releases must stay excluded while public prereleases remain available.
- Notes must be inserted as text so release Markdown cannot inject HTML into the page.
- Feed loading from the module URL must work under the project Pages prefix `/Interface-Updates/`.

---

### Task 1: Generate the normalized release feed

**Files:**
- Create: `scripts/build-release-feed.mjs`

**Interfaces:**
- Consumes: `GET https://api.github.com/repos/ManzanitaSpice/Interface-2/releases?per_page=100&page=N`.
- Produces: a JSON file at the output path argument, defaulting to `dist/data/releases.json`.
- Output shape: `{ schemaVersion: 1, sourceRepository, generatedAt, releases }`; each release has `version`, `title`, `publishedAt`, `releaseUrl`, `notesMarkdown`, `prerelease`, and `assets`; each asset has `name`, `downloadUrl`, `sizeBytes`, `contentType`, and optional `digest`.

- [ ] Create the executable Node.js entry point and accept an optional output path.
- [ ] Fetch all pages with `per_page=100`; require successful HTTP responses and valid release arrays.
- [ ] Exclude drafts and entries without `published_at`, include published prereleases, fall back from a missing release name to its tag, keep only uploaded assets with download URLs, and sort releases newest first.
- [ ] Write the schema-versioned JSON atomically; fail if the result is empty or malformed so deployment cannot replace a working feed with empty data.

### Task 2: Add the plain draft page

**Files:**
- Create: `site/index.html`
- Create: `site/app.js`

**Interfaces:**
- Consumes: the Task 1 feed resolved as `new URL('./data/releases.json', import.meta.url)`.
- Produces: a basic page listing version, publication date, Markdown notes, and uploaded asset links.

- [ ] Add a semantic HTML shell with a title, a live status region, and a release list container.
- [ ] Fetch the relative JSON URL and render release fields through DOM text nodes; keep loading, empty, and fetch-error messages visible.
- [ ] Keep browser-default presentation and avoid branding, illustrations, custom cards, or final visual direction.

### Task 3: Deploy from the new GitHub repository

**Files:**
- Create: `.github/workflows/publish-pages.yml`
- Create: `README.md`
- Create: `.gitignore`

**Interfaces:**
- Consumes: `site/` and `scripts/build-release-feed.mjs` from Tasks 1–2.
- Produces: a GitHub Pages artifact containing the plain page and `data/releases.json`.

- [ ] Configure the workflow for pushes to `main`, an hourly UTC schedule, and `workflow_dispatch`.
- [ ] Grant only `contents: read`, `pages: write`, and `id-token: write`; use `actions/setup-node@v7` with Node 24, plus `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, and `actions/deploy-pages@v4`.
- [ ] Copy the page into `dist/`, generate `dist/data/releases.json`, and deploy only if the feed generator succeeds.
- [ ] Document the source repository, public feed URL, scheduled refresh, and manual refresh in `README.md`.
- [ ] Ignore the generated `dist/` artifact in `.gitignore`.
- [ ] Create public repository `ManzanitaSpice/Interface-Updates`, set it as `origin`, push the reviewed source, and run the initial Pages workflow so the first published feed is available.

## Execution Notes

- Implement natively in the current session; the generator, page, and deployment workflow share one small schema and repository.
- Do not start the final visual design in this task.
- The public repository creation and initial deployment are authorized by the request and confirmed repository name.
