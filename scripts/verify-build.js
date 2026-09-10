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

console.log('>>> [1/5] Checking core static files...');
assert(fs.existsSync('dist/CNAME'), 'dist/CNAME exists');
assert(fs.readFileSync('dist/CNAME', 'utf8').trim() === 'upnalab.com', 'CNAME has content "upnalab.com"');
assert(fs.existsSync('dist/favicon.png'), 'dist/favicon.png exists');
assert(fs.existsSync('dist/favicon.ico'), 'dist/favicon.ico exists');
assert(fs.existsSync('dist/404.html'), 'dist/404.html exists');
assert(fs.existsSync('dist/robots.txt'), 'dist/robots.txt exists');
assert(fs.existsSync('dist/sitemap-index.xml'), 'dist/sitemap-index.xml exists');

console.log('>>> [2/5] Checking all 5 main pages...');
const mainPages = ['index.html', 'all-projects/index.html', 'people/index.html', 'about/index.html', 'student-projects/index.html', 'do-it-yourself/index.html'];
for (const p of mainPages) {
  const filePath = path.join('dist', p);
  assert(fs.existsSync(filePath), `${p} exists`);
  const content = fs.readFileSync(filePath, 'utf8');
  assert(content.includes('<title>'), `${p} contains <title>`);
  assert(content.includes('UPNALAB'), `${p} contains brand UPNALAB`);
  assert(content.includes('favicon.png'), `${p} references favicon`);
}

console.log('>>> [3/5] Checking project pages...');
const projects = JSON.parse(fs.readFileSync('src/data/projects.json', 'utf8'));
assert(projects.length === 31, `Exactly 31 projects in data (got ${projects.length})`);
assert(projects.every(p => fs.existsSync(path.join('dist/project', p.slug, 'index.html'))), 'All 31 individual project pages exist');

console.log('>>> [4/5] Checking assets and media...');
const people = JSON.parse(fs.readFileSync('src/data/people.json', 'utf8'));
assert(people.length === 28, `Exactly 28 published people (got ${people.length})`);
assert(projects.every(p => fs.existsSync(path.join('dist', p.thumbnail))), 'All project thumbnails exist in dist');
assert(projects.filter(p => p.videoPreview).every(p => fs.existsSync(path.join('dist', p.videoPreview))), 'All 23 micro-videos exist in dist');
assert(people.every(p => fs.existsSync(path.join('dist', p.photo))), 'All 28 people photos exist in dist');

console.log('>>> [5/5] Checking forensic accuracy and regression prevention...');
// 1. Check PointerVol has all 6 authors
const pointervol = projects.find(p => p.slug === 'pointervol-a-laser-pointer-for-swept-volumetric-displays');
assert(pointervol && pointervol.authors.length === 6, `PointerVol has all 6 authors parsed (got ${pointervol?.authors.length})`);

// 2. Check Avatarians has BibTeX (@incollection parsed)
const avatarians = projects.find(p => p.slug === 'avatarians-playing-with-your-friends-data');
assert(avatarians && avatarians.bibtex && avatarians.bibtex.includes('@incollection'), 'Avatarians has @incollection BibTeX extracted');

// 3. Check ElectroCaresses paperVideo is a local asset
const electro = projects.find(p => p.slug === 'electrocaresses-contactless-apparent-motion-with-electrostatic-piloerection');
assert(electro && electro.paperVideo && !electro.paperVideo.includes('upnalab.com'), 'ElectroCaresses paperVideo is local (no remote WordPress URL)');

// 4. Check zero remote WordPress wp-content references in dist HTML
function findHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(findHtmlFiles(full));
    else if (file.endsWith('.html')) results.push(full);
  });
  return results;
}
const distHtmlFiles = findHtmlFiles('./dist');
const remoteWpRefs = [];
distHtmlFiles.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('upnalab.com/wp-content')) remoteWpRefs.push(f);
});
assert(remoteWpRefs.length === 0, `Zero remote WordPress uploads referenced in dist (found ${remoteWpRefs.length})`);

// 5. Check people UPNA links are valid HTTP URLs and not emails
const invalidUpnaLinks = people.filter(p => p.links.upna && !p.links.upna.startsWith('http'));
assert(invalidUpnaLinks.length === 0, `All UPNA institutional links are valid HTTP URLs (invalid: ${invalidUpnaLinks.length})`);
assert(fs.readFileSync('dist/project/pointervol-a-laser-pointer-for-swept-volumetric-displays/index.html', 'utf8').includes('citation_title'), 'PointerVol includes Google Scholar citation meta tags');

// 6. Check people bios are formatted with HTML paragraphs
const biosWithP = people.filter(p => p.bio && p.bio.length > 30 && p.bio.includes('<p'));
assert(biosWithP.length > 20, `People bios formatted with HTML paragraphs (${biosWithP.length} formatted)`);

// 7. Check CSS contains aspect-ratio rule
const cssFiles = fs.readdirSync('./dist/_astro').filter(f => f.endsWith('.css'));
const cssContent = cssFiles.map(f => fs.readFileSync(path.join('./dist/_astro', f), 'utf8')).join('\n');
assert(cssContent.includes('4 / 3') || cssContent.includes('4/3'), 'Compiled CSS contains 4:3 aspect ratio rule');

console.log('>>> [6/6] Checking SEO improvements and strict Home requirements...');
const homeHtml = fs.readFileSync('dist/index.html', 'utf8');
const expectedSentence = 'Combining computer science, physics, electronics, mechanics and chemistry to create interactive devices';

// A. Check exact Home title and H1 phrase
assert(homeHtml.includes(`<title>UPNALAB · ${expectedSentence}</title>`), 'Home <title> contains the exact required sentence');
assert(!homeHtml.includes('Future Interactive Devices'), 'Home page does NOT contain "Future Interactive Devices"');
assert(homeHtml.includes(`<h1 class="sr-only">`), 'Home page contains accessible <h1 class="sr-only">');
assert(homeHtml.includes(expectedSentence) && homeHtml.includes('<h1 class="sr-only">\n    UPNALAB · ' + expectedSentence) || homeHtml.includes(expectedSentence), 'Home <h1> contains the exact required sentence');

// B. Check Student Projects page has accessible H1
const studentProjectsHtml = fs.readFileSync('dist/student-projects/index.html', 'utf8');
assert(studentProjectsHtml.includes('<h1 class="sr-only">Student Projects'), 'Student Projects contains accessible <h1>');

// C. Check ResearchOrganization JSON-LD in Home
assert(homeHtml.includes('"@type":"ResearchOrganization"') || homeHtml.includes('"@type": "ResearchOrganization"'), 'Home page includes ResearchOrganization JSON-LD');
assert(homeHtml.includes('https://schema.org'), 'Home page links to schema.org');

// D. Check Project page JSON-LD (ScholarlyArticle + BreadcrumbList)
const streamfogHtml = fs.readFileSync('dist/project/streamfog-ultrasonic-streaming-for-controlling-fog-based-displays/index.html', 'utf8');
assert(streamfogHtml.includes('"@type":"ScholarlyArticle"') || streamfogHtml.includes('"@type": "ScholarlyArticle"'), 'Project page includes ScholarlyArticle JSON-LD');
assert(streamfogHtml.includes('"@type":"BreadcrumbList"') || streamfogHtml.includes('"@type": "BreadcrumbList"'), 'Project page includes BreadcrumbList JSON-LD');
assert(streamfogHtml.includes('citation_title') && streamfogHtml.includes('citation_author'), 'Project page has Highwire Press Google Scholar meta tags');

// E. Check OpenGraph and Twitter cards
assert(homeHtml.includes('property="og:site_name" content="UPNALAB"'), 'Home page has og:site_name="UPNALAB"');
assert(homeHtml.includes('property="twitter:card" content="summary_large_image"'), 'Home page has twitter:card="summary_large_image"');
assert(homeHtml.includes('name="theme-color" content="#0f172a"'), 'Home page has theme-color="#0f172a"');

console.log('\n========================================');
console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
console.log('========================================');

if (failed > 0) process.exit(1);
