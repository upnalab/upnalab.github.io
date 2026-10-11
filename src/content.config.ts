import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';
import { hasImage } from './utils/images';

const imagePath = z
  .string()
  .regex(/^\/assets\/images\//, 'Image paths must start with /assets/images/')
  .refine(hasImage, (p) => ({ message: `Image file not found: src${p}` }));

const nullableUrl = z.string().url().nullable().optional();

export const PROJECT_CATEGORIES = ['Research Project', 'Student Project'] as const;
export const PROJECT_TAGS = [
  'Ultrasound',
  'Haptics',
  'Displays',
  'Virtual Reality',
  'Fabrication',
  'Sensors AI',
  'Affective Creativity Learning',
  'Multimedia',
  'Student Project',
  'Student Work',
] as const;

const projects = defineCollection({
  loader: file('src/data/projects.json'),
  schema: z.object({
    id: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/, 'Slugs use lowercase letters, digits and hyphens'),
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    year: z.number().int(),
    category: z.enum(PROJECT_CATEGORIES),
    tags: z.array(z.enum(PROJECT_TAGS)),
    thumbnail: imagePath,
    videoPreview: z.string().startsWith('/assets/videos/').nullable(),
    paperVideo: z.string().nullable().optional(),
    abstract: z.string(),
    publicationUrl: z.string().nullable().optional(),
    instructablesUrl: nullableUrl,
    doi: z.string().nullable().optional(),
    bibtex: z.string().nullable().optional(),
    apa: z.string().nullable().optional(),
    authors: z.array(z.string()),
  }),
});

export const PEOPLE_CATEGORIES = ['Active', 'Visitors', 'Alumni'] as const;

const people = defineCollection({
  loader: file('src/data/people.json', {
    // people.json identifies entries by `slug`; the file loader needs an `id`
    parser: (text) => JSON.parse(text).map((p: { slug: string }) => ({ id: p.slug, ...p })),
  }),
  schema: z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    role: z.string(),
    category: z.enum(PEOPLE_CATEGORIES),
    subCategory: z.string(),
    photo: imagePath,
    bio: z.string(),
    links: z.object({
      website: z.string(),
      linkedin: z.string(),
      scholar: z.string(),
      orcid: z.string(),
      upna: z.string(),
      twitter: z.string(),
      github: z.string(),
      email: z.string(),
    }),
  }),
});

export const collections = { projects, people };
