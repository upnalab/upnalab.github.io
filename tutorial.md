# UPNALAB Website Maintenance Tutorial

Welcome to the **UPNALAB** website repository! This guide is written for researchers, students, and lab managers who want to add, update, or remove content on [upnalab.com](https://upnalab.com).

The site is built with **Astro** and hosted statically on **GitHub Pages**. All website content is stored in human-readable **JSON files**, so you do **not** need to touch code or HTML templates to keep the website up to date.

> **The build checks your data.** If a field is misspelled, a category is not one of the allowed values, or an image file is missing, `npm run build` stops with a message that names the entry and the problem. Nothing broken can reach the live site.

---

## Table of Contents
1. [Quick Map: Where is Everything?](#1-quick-map-where-is-everything)
2. [Managing Research Projects](#2-managing-research-projects)
3. [Managing Student Projects](#3-managing-student-projects)
4. [Managing Team Members (People)](#4-managing-team-members-people)
5. [Updating Static Sections (About Us, Do-It-Yourself, Contact, Analytics)](#5-updating-static-sections)
6. [Testing Your Changes Locally](#6-testing-your-changes-locally)
7. [Publishing Changes to GitHub Pages](#7-publishing-changes-to-github-pages)
8. [Common Gotchas & Troubleshooting](#8-common-gotchas--troubleshooting)

---

## 1. Quick Map: Where is Everything?

| What you want to change | Primary File to Edit | Media Assets Folder |
| :--- | :--- | :--- |
| **Research Projects** (home, project pages) | `src/data/projects.json` | `src/assets/images/projects/` (thumbnails)<br>`public/assets/videos/projects/` (hover videos) |
| **Student Projects** | `src/data/projects.json` | `src/assets/images/projects/` |
| **Team Members** | `src/data/people.json` | `src/assets/images/people/` |
| **About Us & Sponsors** | `src/data/site-data.json` | `src/assets/images/sponsors/` |
| **Do-It-Yourself (DIY)** | `src/data/site-data.json` | `src/assets/images/diy/` |
| **Contact address / email, analytics** | `src/data/site-data.json` | — |

> **Images** go in `src/assets/images/...` and are referenced in JSON as `/assets/images/...` (the site resizes and optimizes them automatically at build time).
> **Videos** go in `public/assets/videos/...` and are referenced as `/assets/videos/...`.


---

## 2. Managing Research Projects

All research projects are stored in `src/data/projects.json`. Each entry creates an individual project page at `/project/<slug>/` and automatically appears on the Home page grid.

### Add a New Research Project

1. **Prepare media assets:**
   - **Thumbnail image:** 4:3 aspect ratio recommended (e.g. `800x600 px`), `.webp`, `.jpg` or `.png`. Place it in `src/assets/images/projects/`.
   - **Hover micro-video (optional but recommended):** a short, muted looping MP4 (3-10 seconds, under 5 MB). Place it in `public/assets/videos/projects/`.
2. **Open `src/data/projects.json`** in your text editor.
3. **Add a new JSON object** to the top of the array:

```json
{
  "id": "my-new-project-slug",
  "slug": "my-new-project-slug",
  "title": "Acoustic Levitation of High-Density Materials",
  "date": "2026-10-15",
  "year": 2026,
  "category": "Research Project",
  "tags": [
    "Ultrasound",
    "Fabrication"
  ],
  "thumbnail": "/assets/images/projects/my-new-project-slug.webp",
  "videoPreview": "/assets/videos/projects/my-new-project-slug.mp4",
  "paperVideo": "https://www.youtube.com/watch?v=YOUR_YOUTUBE_ID",
  "abstract": "Here goes the full academic abstract of the paper or demo...",
  "publicationUrl": "https://dl.acm.org/doi/10.1145/XXXXXXX.XXXXXXX",
  "instructablesUrl": null,
  "doi": "https://doi.org/10.1145/XXXXXXX.XXXXXXX",
  "bibtex": "@inproceedings{marzo2026acoustic,\n  author = {Marzo, Asier and Doe, Jane},\n  title = {Acoustic Levitation of High-Density Materials},\n  year = {2026},\n  booktitle = {Proceedings of ACM CHI 2026}\n}",
  "apa": "Marzo, A., & Doe, J. (2026). Acoustic Levitation of High-Density Materials. In Proceedings of ACM CHI 2026.",
  "authors": [
    "Asier Marzo",
    "Jane Doe"
  ]
}
```

#### Field Explanations:
- `id` and `slug`: **must be identical**; lowercase letters, digits and hyphens only. This sets the page URL: `https://upnalab.com/project/<slug>/`.
- `date`: `YYYY-MM-DD`. Projects are shown newest first by this date.
- `category`: `"Research Project"` or `"Student Project"` (exact spelling).
- `tags`: only these values are accepted: `"Ultrasound"`, `"Haptics"`, `"Displays"`, `"Virtual Reality"`, `"Fabrication"`, `"Sensors AI"`, `"Affective Creativity Learning"` (research), `"Multimedia"`, `"Student Work"`, `"Student Project"` (student). To add a new tag, add it to the `PROJECT_TAGS` list in `src/content.config.ts`.
- `thumbnail`: path starting with `/assets/images/`; the file must exist in `src/assets/images/`.
- `videoPreview`: path to the `.mp4` for hover playback, or `null`.
- `paperVideo`: full YouTube URL, a local `.mp4` path, or `null`. YouTube videos are shown with a click-to-play cover (the YouTube player only loads when the visitor presses play).
- `publicationUrl`, `doi`, `bibtex`, `apa`: use `null` when not available. `bibtex` uses `\n` for line breaks.
- `authors`: names in paper order. **Authors whose name matches a person in `people.json` are linked automatically** to their profile, and the project appears in that person's biography popup. Use the same spelling as in `people.json` (accents are ignored; "Iñigo Ezcurdia" and "Inigo Ezcurdia" both match).

### Edit an Existing Research Project
1. Open `src/data/projects.json`.
2. Search (`Ctrl+F` / `Cmd+F`) for the project `slug` or title.
3. Edit any field. Save the file.

### Rename a project's slug (changes its URL)
Old links from Google, papers or social media would break. Add a redirect in `astro.config.mjs` under `redirects`, like the existing ones, and rename the thumbnail/video files to match.

### Delete a Research Project
1. Remove the object from `src/data/projects.json` (watch for a leftover comma).
2. Remove its image from `src/assets/images/projects/` and video from `public/assets/videos/projects/`.

---

## 3. Managing Student Projects

Student projects (undergraduate multimedia coursework) are also stored in `src/data/projects.json` and are displayed on the **Student Projects** page (`/student-projects`), sorted by `year` descending.

### Add a New Student Project

1. Save the thumbnail in `src/assets/images/projects/`.
2. Add an entry to `src/data/projects.json` with `"category": "Student Project"`:

```json
{
  "id": "multimedia-undergrads-2026",
  "slug": "multimedia-undergrads-2026",
  "title": "Multimedia Undergrads 2026",
  "date": "2026-06-01",
  "year": 2026,
  "category": "Student Project",
  "tags": [
    "Multimedia",
    "Student Work"
  ],
  "thumbnail": "/assets/images/projects/multimedia-undergrads-2026.webp",
  "videoPreview": null,
  "paperVideo": "https://www.youtube.com/watch?v=YOUR_STUDENT_VIDEO_ID",
  "abstract": "Compilation of interactive systems created by UPNA undergraduate students during the 2025/2026 academic course.",
  "publicationUrl": null,
  "instructablesUrl": null,
  "doi": null,
  "bibtex": null,
  "apa": null,
  "authors": [
    "Undergraduate Students 2026",
    "Asier Marzo"
  ]
}
```

### Edit or Delete a Student Project
Same as research projects.

---

## 4. Managing Team Members (People)

All team members, visitors and alumni are configured in `src/data/people.json`. People appear on `/people` in the order of the file.

### Add a New Team Member

1. **Add photo:** a square portrait (e.g. `400x400 px`, `.webp`, `.jpg` or `.png`) in `src/assets/images/people/<slug>.webp`.
2. **Open `src/data/people.json`** and add an entry (every key must be present; use `""` for links you don't have):

```json
{
  "slug": "jane-doe",
  "name": "Jane Doe",
  "role": "PhD Student",
  "category": "Active",
  "subCategory": "PhD Student",
  "photo": "/assets/images/people/jane-doe.webp",
  "bio": "<p>Jane is pursuing her PhD on ultrasound levitation for biomedical applications. She graduated in Computer Science at UPNA.</p>",
  "links": {
    "website": "",
    "linkedin": "https://linkedin.com/in/...",
    "scholar": "https://scholar.google.com/citations?user=XXXXXXX",
    "orcid": "https://orcid.org/0000-0000-0000-0000",
    "upna": "https://directorio.unavarra.es/...",
    "twitter": "",
    "github": "",
    "email": "jane.doe@unavarra.es"
  }
}
```

#### Field Explanations:
- `slug`: lowercase letters, digits and hyphens; must be unique. It is also the anchor of the profile (`/people/#jane-doe`).
- `role`: free text shown under the name (e.g. `Staff`, `Postdoc`, `PhD Student`, `Project Collaborator`).
- `category` decides the section on the People page. **Exactly one of:**
  - `"Active"` → **Current Members**
  - `"Visitors"` → **Visiting Researchers & Students**
  - `"Alumni"` → **Alumni & Former Members**
- `subCategory`: free text for your own bookkeeping (e.g. `Staff`, `PhD Student`, `Visitor`, `Previous Member`); not shown on the site.
- `bio`: HTML (`<p>`, `<strong>`, `<br />`, `<a>` are fine). Leave `""` if there is none; the popup then says "No detailed biography available".
- `links.email`: the address is **not written in the page's HTML**; it is encoded and only revealed when a visitor clicks the mail icon. Spam bots cannot harvest it.
- `links.upna`: must be a full `https://` URL (anything else is ignored).

### Edit a Team Member (or Move to Alumni)
- **Change role or bio:** edit `"role"` or `"bio"`.
- **Move to Alumni:** change `"category": "Active"` to `"category": "Alumni"`.

### Delete a Team Member
Delete their object in `src/data/people.json` and their photo in `src/assets/images/people/`.

---

## 5. Updating Static Sections

Everything below lives in `src/data/site-data.json`.

### "About Us" & Sponsors (`"about"`)
- `headline`, `subheadline`: text at the top of the About page.
- `expertise`: list of bullet points.
- `values`: list of `{ "title", "description" }`.
- `sponsors`: list of `{ "title", "logo" }`. Put the logo in `src/assets/images/sponsors/` and reference it as `/assets/images/sponsors/<file>.webp`.

### "Do-It-Yourself" (`"diy"`)
List of `{ "title", "url", "image", "description" }`. Images go in `src/assets/images/diy/`.

### Contact (`"contact"`)
`email`, `addressLine1`, `addressLine2`, `mapsUrl`. Used in the footer and the Privacy page. The email is obfuscated automatically.

### Analytics (`"analytics"`)
The site uses **no cookies and no Google Analytics**, so no cookie banner is needed. If you want visit statistics, create a free site at [goatcounter.com](https://www.goatcounter.com) (cookie-less, EU-hosted, GDPR-friendly) and put its code in `"goatcounter"`:

```json
"analytics": { "goatcounter": "upnalab" }
```

(for `https://upnalab.goatcounter.com`). Leave it `""` to disable. The Privacy page updates its text automatically.

### Privacy & Legal Notice
The text lives in `src/pages/privacy.astro`. Update the `lastUpdated` date at the top when you change it.

---

## 6. Testing Your Changes Locally

1. **Install once:** `npm ci` (needs Node 22).
2. **Run the local server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321`. The browser updates as you save files. Data errors are shown in the terminal and in the browser.
3. **Full check before publishing (recommended):**
   ```bash
   npm run build
   npm test
   ```
   `npm run build` validates every JSON entry and image path; `npm test` runs sanity checks on the generated site. Both must finish without errors.

---

## 7. Publishing Changes to GitHub Pages

Pushing to the `main` branch triggers the workflow in `.github/workflows/deploy.yml`, which runs the checks, builds the site and publishes it.

1. `git status` to see what you changed.
2. `git add .`
3. `git commit -m "Add new research project: StreamFog"`
4. `git push origin main`
5. Watch the **Deploy to GitHub Pages** workflow under the *Actions* tab of the repository. When it turns green (usually 1–2 minutes) the change is live. If it turns red, open it: the log names the invalid entry or the failing check.

> Pull requests run the same checks without publishing, so you can review a contribution safely before merging.

---

## 8. Common Gotchas & Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `SyntaxError: Unexpected token` during build | Invalid JSON syntax. | Look for a missing/extra comma. Validate at [jsonlint.com](https://jsonlint.com). |
| `data does not match collection schema` | A field has a wrong value (e.g. `category: "active"`), is missing, or an image path is wrong. | The message names the entry and the field. Compare with the examples above. |
| `Image file not found: src/assets/images/...` | The image is not where the JSON says. | Put the file in `src/assets/images/...`; the JSON path starts with `/assets/images/`. |
| A person does not appear on the People page | `category` is not exactly `Active`, `Visitors` or `Alumni`. | Since the build validates this, it should now fail instead; fix the value. |
| An author is not linked to a person | The spelling differs from `people.json` beyond accents. | Use the same first and last name as in `people.json`. |
| Changes not visible after deployment | Browser cache. | Hard refresh: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (macOS). |
| Project not found by a tag filter | Tag not in the allowed list. | Use one of the tags listed in section 2, or add it to `PROJECT_TAGS` in `src/content.config.ts`. |
| Changed the logo | — | Run `npm run og` to regenerate the social-media preview image `public/og-default.png`. |
