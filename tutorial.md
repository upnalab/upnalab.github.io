# UPNALAB Website Maintenance Tutorial

Welcome to the **UPNALAB** website repository! This guide is written for researchers, students, and lab managers who want to add, update, or remove content on [upnalab.com](https://upnalab.com).

The site is built with **Astro** and hosted statically on **GitHub Pages**. All website content is stored in human-readable **JSON files**, so you do **not** need to touch complex code or HTML templates to keep the website up to date.

---

## Table of Contents
1. [Quick Map: Where is Everything?](#1-quick-map-where-is-everything)
2. [Managing Research Projects](#2-managing-research-projects)
   - [Add a New Research Project](#add-a-new-research-project)
   - [Edit an Existing Research Project](#edit-an-existing-research-project)
   - [Delete a Research Project](#delete-a-research-project)
3. [Managing Student Projects](#3-managing-student-projects)
   - [Add a New Student Project](#add-a-new-student-project)
   - [Edit or Delete a Student Project](#edit-or-delete-a-student-project)
4. [Managing Team Members (People)](#4-managing-team-members-people)
   - [Add a New Team Member](#add-a-new-team-member)
   - [Edit a Team Member (or Move to Alumni)](#edit-a-team-member-or-move-to-alumni)
   - [Delete a Team Member](#delete-a-team-member)
5. [Updating Static Sections (About Us & Do-It-Yourself)](#5-updating-static-sections-about-us--do-it-yourself)
   - [Updating "About Us" & Sponsors](#updating-about-us--sponsors)
   - [Updating "Do-It-Yourself" Guides](#updating-do-it-yourself-guides)
6. [Testing Your Changes Locally](#6-testing-your-changes-locally)
7. [Publishing Changes to GitHub Pages](#7-publishing-changes-to-github-pages)
8. [Common Gotchas & Troubleshooting](#8-common-gotchas--troubleshooting)

---

## 1. Quick Map: Where is Everything?

| What you want to change | Primary File to Edit | Media Assets Folder |
| :--- | :--- | :--- |
| **Research Projects** | `src/data/projects.json` | `public/assets/images/projects/`<br>`public/assets/videos/projects/` |
| **Student Projects** | `src/data/projects.json` | `public/assets/images/projects/` |
| **Team Members** | `src/data/people.json` | `public/assets/images/people/` |
| **About Us & Sponsors** | `src/data/site-data.json` | `public/assets/images/sponsors/` |
| **Do-It-Yourself (DIY)** | `src/data/site-data.json` | `public/assets/images/diy/` |

> All paths in JSON starting with `/assets/...` correspond directly to files inside the `public/assets/...` folder.

---

## 2. Managing Research Projects

All research projects are stored in `src/data/projects.json`. Each entry creates an individual project page at `/project/[slug]/` and automatically appears on the Home page grid (`/`) and All Projects page (`/all-projects`).

### Add a New Research Project

1. **Prepare media assets:**
   - **Thumbnail image:** 4:3 aspect ratio recommended (e.g., `800x600 px`), formatted as `.webp`, `.jpg`, or `.png`. Place it in `public/assets/images/projects/`.
   - **Hover micro-video (Optional but recommended):** A short, muted looping MP4 video (around 3-10 seconds, under 5 MB). Place it in `public/assets/videos/projects/`.
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
  "doi": "10.1145/XXXXXXX.XXXXXXX",
  "bibtex": "@inproceedings{marzo2026acoustic,\n  author = {Marzo, Asier and Doe, Jane},\n  title = {Acoustic Levitation of High-Density Materials},\n  year = {2026},\n  booktitle = {Proceedings of ACM CHI 2026}\n}",
  "apa": "Marzo, A., & Doe, J. (2026). Acoustic Levitation of High-Density Materials. In Proceedings of ACM CHI 2026.",
  "authors": [
    "Asier Marzo",
    "Jane Doe"
  ]
}
```

#### Field Explanations:
- `id` and `slug`: URL slug using lowercase letters and hyphens. This sets the page URL: `https://upnalab.com/project/<slug>/`.
- `category`: Must be `"Research Project"` for research work.
- `tags`: Available filters in the grid: `"Ultrasound"`, `"Haptics"`, `"Displays"`, `"Virtual Reality"`, `"Fabrication"`, `"Sensors AI"`, or `"Affective Creativity Learning"`.
- `thumbnail`: Path to the image starting with `/assets/...`.
- `videoPreview`: Path to the `.mp4` file for hover playback, or `null` if none.
- `paperVideo`: Full YouTube URL (e.g. `https://www.youtube.com/watch?v=...`) or a local video path.
- `publicationUrl`: Link to publisher (ACM, IEEE, Springer, etc.).
- `doi`: DOI string or DOI link.
- `bibtex`: BibTeX citation. Use `\n` for line breaks.
- `authors`: Array of author names in the order they appear on the paper.

### Edit an Existing Research Project
1. Open `src/data/projects.json`.
2. Search (`Ctrl+F` or `Cmd+F`) for the project `slug` or title.
3. Edit any fields (e.g., fix a typo, update authors, add a publication DOI once accepted).
4. Save the file.

### Delete a Research Project
1. Open `src/data/projects.json`.
2. Find the project object and delete it (ensure you don't leave trailing commas in JSON).
3. (Optional) Remove the unused image from `public/assets/images/projects/` and video from `public/assets/videos/projects/`.

---

## 3. Managing Student Projects

Student projects (undergraduate multimedia systems coursework) are also stored in `src/data/projects.json`, but they are displayed on the dedicated **Student Projects** page (`/student-projects`).

### Add a New Student Project

1. **Prepare media assets:**
   - Save the project preview thumbnail in `public/assets/images/projects/`.
2. **Open `src/data/projects.json`** and add an entry with `"category": "Student Project"`:

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

> **Note**: The Student Projects page automatically sorts projects descending by `year`. Setting `"category": "Student Project"` ensures it does not mix with research papers on the Home page.

### Edit or Delete a Student Project
Same as with research projects: find the project entry in `src/data/projects.json` and edit or delete its JSON object.

---

## 4. Managing Team Members (People)

All team members, visitors, and alumni are configured in `src/data/people.json`.

### Add a New Team Member

1. **Add photo:** Save a square profile portrait (e.g., `400x400 px`, `.webp`, `.jpg`, or `.png`) into `public/assets/images/people/<person-id>.webp`.
2. **Open `src/data/people.json`** and add an entry:

```json
{
  "id": "jane-doe",
  "name": "Jane Doe",
  "role": "PhD Student",
  "group": "active",
  "photo": "/assets/images/people/jane-doe.webp",
  "bio": "<p>Jane is pursuing her PhD on ultrasound levitation for biomedical applications. She graduated in Computer Science at UPNA.</p>",
  "links": {
    "scholar": "https://scholar.google.com/citations?user=XXXXXXX",
    "orcid": "https://orcid.org/0000-0000-0000-0000",
    "upna": "https://directorio.unavarra.es/...",
    "linkedin": "https://linkedin.com/in/...",
    "github": "https://github.com/...",
    "twitter": null,
    "website": null,
    "email": "jane.doe@unavarra.es"
  }
}
```

#### Member Groups:
- `"group": "active"` → Listed under **Current Members**
- `"group": "visitor"` → Listed under **Visiting Researchers & Students**
- `"group": "alumni"` → Listed under **Alumni**

> If a person does not have a specific social link (e.g. no Twitter), set its value to `null` or omit that key.

### Edit a Team Member (or Move to Alumni)
- **Change Role or Bio:** Find the person in `src/data/people.json` and edit `"role"` or `"bio"`.
- **Move to Alumni:** When a member graduates or leaves the lab, simply change:
  ```json
  "group": "alumni"
  ```
  The website will automatically move them to the Alumni section on the `/people` page.

### Delete a Team Member
Delete their object block in `src/data/people.json`.

---

## 5. Updating Static Sections (About Us & Do-It-Yourself)

Both pages source their content from `src/data/site-data.json`.

### Updating "About Us" & Sponsors

Open `src/data/site-data.json` and look for the `"about"` key:

1. **Update Subheadline & Narrative:**
   Modify `"about"."subheadline"` to reflect current lab descriptions.
2. **Update Research Expertise:**
   Add, reorder, or edit bullet points in `"about"."expertise"`:
   ```json
   "expertise": [
     "Acoustic Levitation and Directional Audio",
     "Virtual and Augmented Reality",
     "Volumetric Displays",
     "Sensors for HCI",
     "Creativity & Fabrication Technologies"
   ]
   ```
3. **Add or Edit Funding Sponsors / Grants:**
   Add an entry inside `"about"."sponsors"`. Place the sponsor logo image in `public/assets/images/sponsors/`:
   ```json
   {
     "title": "Project Name – Funding Agency & Grant ID – 2026-2029",
     "logo": "/assets/images/sponsors/grant-logo.webp"
   }
   ```

### Updating "Do-It-Yourself" Guides

Open `src/data/site-data.json` and look for the `"diy"` array:

```json
{
  "title": "Instructables",
  "url": "https://www.instructables.com/member/UpnaLab/",
  "image": "/assets/images/diy/instructables.webp",
  "description": "Check our detailed Instructables and guided tutorials to build your own cutting-edge devices."
}
```
You can update URLs, descriptions, or add new maker resources here.

---

## 6. Testing Your Changes Locally

Before publishing changes to the public website, you should test them on your computer.

1. **Open your terminal** in the project folder (`upnalab.com`).
2. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:4321` in your browser. As you edit files, the browser will update automatically.
3. **Verify the static build (Optional but recommended):**
   ```bash
   npm run build
   node scripts/verify-build.js
   ```
   If all assertions pass with `0 failed`, your changes are clean and ready for production.

---

## 7. Publishing Changes to GitHub Pages

The website is configured with a continuous deployment pipeline using **GitHub Actions**. As soon as you push your commit to the `main` branch, GitHub builds and publishes the website automatically.

### Step-by-Step Deployment:

1. **Check which files you modified:**
   ```bash
   git status
   ```
2. **Stage your modified files and new assets:**
   ```bash
   git add .
   ```
3. **Create a commit with a descriptive message:**
   ```bash
   git commit -m "Add new research project: StreamFog"
   ```
4. **Push the commit to GitHub:**
   ```bash
   git push origin main
   ```
5. **Watch the automatic build:**
   - Go to your repository on GitHub: `https://github.com/<your-org-or-user>/upnalab.com/actions`
   - You will see a running workflow named **Deploy to GitHub Pages**.
   - Within 1–2 minutes, the workflow will turn green (completed), and your changes will be live on [upnalab.com](https://upnalab.com)!

---

## 8. Common Gotchas & Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **`SyntaxError: Unexpected token` during build** | Invalid JSON syntax in `projects.json` or `people.json`. | Check for a missing or extra comma `,` between objects. You can validate your JSON at [jsonlint.com](https://jsonlint.com). |
| **Project thumbnail or photo not loading** | Incorrect file path or missing image file. | Make sure the file exists inside `public/assets/...` and the path in JSON starts with `/assets/...`. |
| **Changes not showing up in browser after deployment** | Browser cache. | Hard-refresh your browser using `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (macOS). |
| **Project doesn't show in search or filter** | Tag spelling mismatch. | Check the `"tags"` array in `projects.json` matches the official categories (e.g., `"Ultrasound"`, `"Haptics"`, `"Displays"`). |
