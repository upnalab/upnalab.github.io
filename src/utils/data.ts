import { getCollection, type CollectionEntry } from 'astro:content';
import siteData from '../data/site-data.json';

export type Project = CollectionEntry<'projects'>['data'];
export type Person = CollectionEntry<'people'>['data'];

/** All projects, newest first (the order used everywhere on the site). */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects');
  return entries
    .map((e) => e.data)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export async function getResearchProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.category === 'Research Project');
}

export async function getStudentProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.category === 'Student Project');
}

export async function getPeople(): Promise<Person[]> {
  // Keep the order of people.json
  return (await getCollection('people')).map((e) => e.data);
}

export { siteData };

/* ---------- Authors ↔ people matching (D3) ---------- */

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Loose match: same normalized full name, or same first + last token (handles middle names / compound surnames). */
export function authorMatchesPerson(author: string, person: Person): boolean {
  const a = normalize(author);
  const p = normalize(person.name);
  if (!a || !p) return false;
  if (a === p) return true;
  const at = a.split(' ');
  const pt = p.split(' ');
  return at[0] === pt[0] && at[at.length - 1] === pt[pt.length - 1];
}

export function findPersonForAuthor(author: string, people: Person[]): Person | undefined {
  return people.find((person) => authorMatchesPerson(author, person));
}

export function projectsOfPerson(person: Person, projects: Project[]): Project[] {
  return projects.filter((pr) => pr.authors.some((a) => authorMatchesPerson(a, person)));
}

/* ---------- DOI helpers ---------- */

export function doiUrl(project: Project): string | undefined {
  if (project.doi) return project.doi.startsWith('http') ? project.doi : `https://doi.org/${project.doi}`;
  return project.publicationUrl || undefined;
}

export function cleanDoi(project: Project): string | undefined {
  return project.doi ? project.doi.replace(/^https?:\/\/doi\.org\//, '') : undefined;
}

/* ---------- Text helpers ---------- */

/** Truncate on a word boundary; only append an ellipsis when something was cut (A7). */
export function excerpt(text: string | undefined | null, max = 160): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.]$/, '') + '…';
}
