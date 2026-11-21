# Interface updates feed and minimal draft

## Intent

Create a dedicated web repository that publishes the public update history for INTERFACE. The source of truth is the public distribution repository `ManzanitaSpice/Interface-2`, where each published release already contains Spanish release notes and downloadable files. Include a minimal draft page to demonstrate the feed; the final visual design comes later.

## Goals

- Expose published GitHub Releases as a stable JSON feed for a future frontend.
- Include release version/title, publication date, release URL, Markdown notes, prerelease status, and download asset names, URLs, sizes, media types, and digests when present.
- Refresh the feed automatically and allow a manual refresh.
- Keep the implementation in the dedicated website repository and avoid credentials for reading the public source repository.
- Add a plain draft page that loads and displays the feed, using browser-default presentation and no brand styling.

## Non-goals

- Showing individual commits or push activity.
- Designing the final page visuals, branding, or custom component system.
- Changing the existing release process in `C:\CodigoInterface` or the contents of `Interface-2`.
- Adding an independently hosted API service.

## Constraints

- The feed must use published releases, not ordinary Git tags. Draft releases must never appear. Publicly published prereleases remain eligible.
- `Interface-2` is public, so the feed generator can use unauthenticated GitHub REST API reads and needs no secret token.
- GitHub Pages serves static files and does not execute server endpoints. The backend behavior therefore runs in GitHub Actions and publishes a JSON file as a static URL.
- The dedicated site repository will be newly created as `ManzanitaSpice/Interface-Updates`, as confirmed by the owner. Public visibility is assumed because the site publishes public project updates.
- As a GitHub project site, the proposed public feed URL is `https://manzanitaspice.github.io/Interface-Updates/data/releases.json`.

## Approaches

1. **GitHub Actions + GitHub Pages (recommended for this request).** A scheduled workflow fetches published releases, writes a normalized JSON feed into the Pages artifact, and deploys it. This keeps the project on GitHub, needs no runtime service or API secret, and gives the future UI a consistent contract. The feed may lag a newly published release until the next scheduled run; a manual workflow run can refresh it sooner.
2. **External serverless API.** A Worker could fetch and cache the GitHub Releases API at request time. This gives a live endpoint, but it adds a hosting provider and deployment configuration outside GitHub.

The requested GitHub-only hosting and current public release workflow make option 1 the proposed choice. The owner approved the backend scope and confirmed the new repository name, with a minimal draft page and no final visual design.

## Proposed behavior

- A Node.js script using built-in `fetch` requests `GET /repos/ManzanitaSpice/Interface-2/releases` with pagination, following GitHub's `Link` headers or paging until the result set ends.
- The script excludes drafts, keeps published prereleases, and maps the data to a deliberately small schema. Release notes remain Markdown text; they are not interpreted as HTML by the backend.
- The JSON artifact is served at `/data/releases.json` on the GitHub Pages site. It includes a schema version, source repository, fetch timestamp, and newest-first releases. Each asset has a direct `browser_download_url`.
- A simple `index.html` reads `/data/releases.json` and lists version, date, release notes, and download assets. It uses safe text insertion for release notes and basic loading, empty, and error messages.
- The draft page uses default browser styling with at most small readability rules. It is a functional scaffold, not a visual direction for the final website.
- A GitHub Actions workflow refreshes and deploys the feed hourly, and supports `workflow_dispatch` for an immediate refresh. It deploys only after a successful fetch and validation so an API error cannot replace a working feed with an empty one.
- The workflow uses GitHub Pages deployment permissions and does not write generated data back to the repository's default branch.
- The future UI can replace the draft page while consuming the same JSON contract without depending on GitHub's raw API response shape.

## Open implementation calls

- Use plain Node.js JavaScript for the generator so the backend needs no runtime dependencies.
- Publish the feed at `data/releases.json` within the Pages artifact, preserving the project repository prefix in its public URL.
- The workflow schedule is hourly; manual dispatch covers immediate refreshes after releases.

## Builder check

An independent builder review asked for the Pages repository and public feed URL. The owner confirmed that the proposed repository name should be used for a new repository. Public visibility and the project-site feed path follow from the public-update use case and remain easy to change before implementation.

## Approval boundary

This document describes the approved backend architecture plus the requested minimal page draft. Backend code, workflow files, and the GitHub remote repository have not been created. The local workspace is prepared for this dedicated project.
