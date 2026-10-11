// Post-build checks. Run `npm run build` first, then `npm test`.
// Everything here is derived from the data files, so adding or removing content never breaks it.
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

function findHtmlFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) results = results.concat(findHtmlFiles(full));
    else if (file.endsWith('.html')) results.push(full);
  }
  return results;
}

const projects = JSON.parse(read('src/data/projects.json'));
const people = JSON.parse(read('src/data/people.json'));
const siteData = JSON.parse(read('src/data/site-data.json'));
const research = projects.filter((p) => p.category === 'Research Project');
const students = projects.filter((p) => p.category === 'Student Project');

console.log('>>> [1/6] Core static files');
assert(exists('dist/CNAME') && read('dist/CNAME').trim() === 'upnalab.com', 'dist/CNAME says upnalab.com');
for (const f of ['favicon.png', 'favicon.ico', '404.html', 'robots.txt', 'sitemap-index.xml', 'og-default.png']) {
  assert(exists(`dist/${f}`), `dist/${f} exists`);
}

console.log('>>> [2/6] Main pages');
const mainPages = ['index.html', 'people/index.html', 'about/index.html', 'student-projects/index.html', 'do-it-yourself/index.html', 'privacy/index.html'];
for (const p of mainPages) {
  const filePath = path.join('dist', p);
  assert(exists(filePath), `${p} exists`);
  if (!exists(filePath)) continue;
  const content = read(filePath);
  assert(content.includes('<title>'), `${p} has a <title>`);
  assert(content.includes('<h1'), `${p} has an <h1>`);
  assert(content.includes('UPNALAB'), `${p} mentions UPNALAB`);
}
assert(exists('dist/all-projects/index.html') && /url=\/"/.test(read('dist/all-projects/index.html')), '/all-projects redirects to /');

console.log('>>> [3/6] Data integrity');
const slugs = projects.map((p) => p.slug);
assert(new Set(slugs).size === slugs.length, `Project slugs are unique (${slugs.length} projects)`);
assert(projects.every((p) => p.id === p.slug), 'Every project has id === slug');
const peopleSlugs = people.map((p) => p.slug);
assert(new Set(peopleSlugs).size === peopleSlugs.length, `People slugs are unique (${peopleSlugs.length} people)`);
assert(people.every((p) => ['Active', 'Visitors', 'Alumni'].includes(p.category)), 'Every person has a valid category (Active | Visitors | Alumni)');
assert(projects.every((p) => ['Research Project', 'Student Project'].includes(p.category)), 'Every project has a valid category');
assert(research.length > 0 && students.length > 0, `Both research (${research.length}) and student (${students.length}) projects exist`);
const invalidUpnaLinks = people.filter((p) => p.links.upna && !p.links.upna.startsWith('http'));
assert(invalidUpnaLinks.length === 0, `All UPNA institutional links are URLs (invalid: ${invalidUpnaLinks.length})`);
assert(people.every((p) => exists(`src${p.photo}`)), 'Every person photo exists under src/assets');
assert(projects.every((p) => exists(`src${p.thumbnail}`)), 'Every project thumbnail exists under src/assets');
assert(projects.filter((p) => p.videoPreview).every((p) => exists(`public${p.videoPreview}`)), 'Every micro-video exists under public/assets');
assert([...siteData.about.sponsors.map((s) => s.logo), ...siteData.diy.map((d) => d.image)].every((img) => exists(`src${img}`)), 'Sponsor and DIY images exist under src/assets');

console.log('>>> [4/6] Project pages');
assert(projects.every((p) => exists(path.join('dist/project', p.slug, 'index.html'))), `All ${projects.length} project pages were generated`);
const sample = research.find((p) => p.doi && p.bibtex) || research[0];
const sampleHtml = read(path.join('dist/project', sample.slug, 'index.html'));
assert(sampleHtml.includes('"@type":"ScholarlyArticle"'), `Project page (${sample.slug}) has ScholarlyArticle JSON-LD`);
assert(sampleHtml.includes('"@type":"BreadcrumbList"'), 'Project page has BreadcrumbList JSON-LD');
assert(sampleHtml.includes('citation_title') && sampleHtml.includes('citation_author'), 'Project page has Google Scholar citation meta tags');
assert(sampleHtml.includes('og:image:width" content="1200"') && sampleHtml.includes('og:image:height" content="630"'), 'Project page declares a 1200×630 social image');
assert(/property="og:image" content="https:\/\/upnalab\.com\/_astro\/[^"]+\.jpg"/.test(sampleHtml), 'Project social image is a generated 1200×630 JPEG');
assert(sampleHtml.includes('youtube-facade') || sampleHtml.includes('<video'), 'Project video uses the click-to-play facade or a native video');
assert(!sampleHtml.includes('<iframe'), 'No YouTube iframe is rendered before the visitor presses play');
const studentHtml = read(path.join('dist/project', students[0].slug, 'index.html'));
assert(studentHtml.includes('Back to Student Projects'), 'Student project pages link back to /student-projects');

console.log('>>> [5/6] Privacy, performance and hygiene across all HTML');
const html = findHtmlFiles('dist').map((f) => ({ f, c: read(f) }));
const bad = (pattern, label) => {
  const hits = html.filter(({ c }) => pattern.test(c)).map(({ f }) => f);
  assert(hits.length === 0, `${label} (found in ${hits.length} files${hits.length ? ': ' + hits.slice(0, 3).join(', ') : ''})`);
};
bad(/upnalab\.com\/wp-content/, 'No remote WordPress uploads referenced');
bad(/googletagmanager|google-analytics\.com|gtag\(/, 'No Google Analytics');
bad(/fonts\.googleapis\.com|fonts\.gstatic\.com/, 'No Google Fonts requests (fonts are self-hosted)');
bad(/mailto:[^"']+@/, 'No plain mailto: addresses in HTML (emails are obfuscated)');
const emails = people.map((p) => p.links.email).filter(Boolean);
bad(new RegExp(emails.map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')), 'No member email address appears in plain text');
const imgsWithoutSize = html.flatMap(({ f, c }) => (c.match(/<img(?![^>]*\bwidth=)[^>]*>/g) || []).map(() => f));
assert(imgsWithoutSize.length === 0, `All <img> tags declare width/height (missing in ${imgsWithoutSize.length})`);

console.log('>>> [6/6] Home and SEO');
const homeHtml = read('dist/index.html');
const expectedSentence = 'Combining computer science, physics, electronics, mechanics and chemistry to create interactive devices';
assert(homeHtml.includes(`<title>UPNALAB · ${expectedSentence}</title>`), 'Home <title> contains the required sentence');
assert(homeHtml.includes('<h1 class="sr-only">') && homeHtml.includes(expectedSentence), 'Home has the accessible <h1> with the required sentence');
assert(homeHtml.includes('"@type":"ResearchOrganization"'), 'Home includes ResearchOrganization JSON-LD');
assert(homeHtml.includes('property="og:image" content="https://upnalab.com/og-default.png"'), 'Home uses the default 1200×630 social image');
assert(homeHtml.includes('name="theme-color" content="#0f172a"'), 'Home has theme-color');
assert((homeHtml.match(/<article/g) || []).length === research.length, `Home shows all ${research.length} research projects`);
const css = fs.readdirSync('dist/_astro').filter((f) => f.endsWith('.css')).map((f) => read(path.join('dist/_astro', f))).join('\n');
assert(css.includes('--color-brand-500') || css.includes('#0c71c3'), 'Compiled CSS contains the brand palette');
assert(css.includes('Inter'), 'Compiled CSS declares the self-hosted Inter font');

console.log('\n========================================');
console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
console.log('========================================');

if (failed > 0) process.exit(1);
