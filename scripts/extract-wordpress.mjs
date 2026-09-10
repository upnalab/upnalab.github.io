import fs from 'node:fs/promises';
import { existsSync, createWriteStream } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const XML_PATH = './export.xml';
const TMP_RAW_DIR = './.tmp/raw';
const ASSETS_IMG_PROJECTS = './public/assets/images/projects';
const ASSETS_VID_PROJECTS = './public/assets/videos/projects';
const ASSETS_IMG_PEOPLE = './public/assets/images/people';
const ASSETS_IMG_DIY = './public/assets/images/diy';
const ASSETS_IMG_SPONSORS = './public/assets/images/sponsors';
const ASSETS_IMG_SITE = './public/assets/images/site';
const ASSETS_ICONS = './public/assets/icons';
const DATA_DIR = './src/data';

// Initialize Directories
await Promise.all([
  fs.mkdir(TMP_RAW_DIR, { recursive: true }),
  fs.mkdir(ASSETS_IMG_PROJECTS, { recursive: true }),
  fs.mkdir(ASSETS_VID_PROJECTS, { recursive: true }),
  fs.mkdir(ASSETS_IMG_PEOPLE, { recursive: true }),
  fs.mkdir(ASSETS_IMG_DIY, { recursive: true }),
  fs.mkdir(ASSETS_IMG_SPONSORS, { recursive: true }),
  fs.mkdir(ASSETS_IMG_SITE, { recursive: true }),
  fs.mkdir(ASSETS_ICONS, { recursive: true }),
  fs.mkdir(DATA_DIR, { recursive: true })
]);

async function downloadFile(url, destPath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) UPNALAB-Migration-Agent/1.0'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.writeFile(destPath, buffer);
      return buffer;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

async function convertToWebP(srcBufferOrPath, destPath, width = null, height = null) {
  try {
    let pipeline = sharp(srcBufferOrPath);
    if (width || height) {
      pipeline = pipeline.resize(width, height, { fit: 'cover' });
    }
    await pipeline.webp({ quality: 84 }).toFile(destPath);
  } catch (err) {
    console.warn(`Sharp WebP conversion warning for ${destPath}: ${err.message}`);
    // If input was a buffer, write it directly if Sharp failed
    if (Buffer.isBuffer(srcBufferOrPath)) {
      await fs.writeFile(destPath, srcBufferOrPath);
    } else {
      await fs.copyFile(srcBufferOrPath, destPath);
    }
  }
}

function cleanHtmlText(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanLatexAccents(str) {
  return str
    .replace(/\\~\{?([a-zA-Z]|\\[ij])\}?/g, '$1\u0303')
    .replace(/\\'\{?([a-zA-Z]|\\[ij])\}?/g, '$1\u0301')
    .replace(/\\`\{?([a-zA-Z]|\\[ij])\}?/g, '$1\u0300')
    .replace(/\\"\{?([a-zA-Z]|\\[ij])\}?/g, '$1\u0308')
    .replace(/\\\^\{?([a-zA-Z]|\\[ij])\}?/g, '$1\u0302')
    .replace(/\\c\{?([a-zA-Z]|\\[ij])\}?/g, '$1\u0327')
    .replace(/\\([ij])\b/g, '$1')
    .normalize('NFC')
    .replace(/[{}\\]/g, '')
    .trim();
}

function extractBibtexFromContent(content) {
  if (!content) return '';
  const match = content.match(/@(?:article|inproceedings|incollection|book|misc|techreport)\s*\{/i);
  if (!match) return '';
  const startIdx = match.index;
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  if (depth === 0) {
    return content.slice(startIdx, endIdx)
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8217;/g, "'")
      .trim();
  }
  return '';
}

function extractFieldFromBibtex(bibtex, field) {
  if (!bibtex) return null;
  const regex = new RegExp(`${field}\\s*=\\s*\\{`, 'i');
  const match = bibtex.match(regex);
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  let depth = 1;
  let endIdx = startIdx;
  for (let i = startIdx; i < bibtex.length; i++) {
    if (bibtex[i] === '{') depth++;
    else if (bibtex[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  return depth === 0 ? bibtex.slice(startIdx, endIdx) : null;
}

function parseAuthorsFromBibtexOrApa(bibtex, apa) {
  if (bibtex) {
    const rawAuthor = extractFieldFromBibtex(bibtex, 'author');
    if (rawAuthor) {
      const cleanList = rawAuthor.replace(/,\s*$/, '').trim();
      const authors = cleanList.split(/\s+and\s+/i).map(a => {
        const cleaned = cleanLatexAccents(a);
        const parts = cleaned.split(',').map(p => p.trim());
        if (parts.length === 2) {
          return `${parts[1]} ${parts[0]}`;
        }
        return cleaned;
      }).filter(Boolean);
      if (authors.length > 0) return authors;
    }
  }

  if (apa) {
    const prefixMatch = apa.match(/^([^()]+?)(?:\s*\(\d{4}|\s*,\s*"\w+|\s*,\s*“\w+)/);
    if (prefixMatch) {
      const raw = prefixMatch[1].trim();
      const parts = raw
        .split(/(?:,\s*&|,\s*and\s*|\s*&\s*|,\s*(?=[A-Z][a-z]+,\s*[A-Z]))/g)
        .map(a => a.trim().replace(/^&|\.$/g, '').trim())
        .filter(a => a.length > 2);
      if (parts.length > 0) return parts;
    }
  }

  return ["UPNALAB Team"];
}

function parseDiviProjectContent(rawContent) {
  const normalized = (rawContent || '').replace(/<br\s*\/?>/gi, '\n');

  // Video
  let paperVideo = '';
  const videoMatch = normalized.match(/\[et_pb_video[^\]]*src="([^"]+)"/i);
  if (videoMatch) {
    paperVideo = videoMatch[1].trim();
  } else {
    const ytMatch = normalized.match(/src="((?:https?:)?\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^"]+)"/i);
    if (ytMatch) paperVideo = ytMatch[1].trim();
  }

  // Publication / DOI button
  let publicationUrl = '';
  const buttonMatch = normalized.match(/\[et_pb_button[^\]]*button_url="([^"]+)"/i);
  if (buttonMatch) {
    publicationUrl = buttonMatch[1].trim();
  } else {
    const doiMatch = normalized.match(/https?:\/\/(?:dx\.)?doi\.org\/[^\s"'>]+/i);
    if (doiMatch) publicationUrl = doiMatch[0].trim();
  }

  // Instructables button if present
  let instructablesUrl = '';
  const instMatch = normalized.match(/\[et_pb_button[^\]]*button_url="([^"]+instructables\.com[^"]+)"/i);
  if (instMatch) instructablesUrl = instMatch[1].trim();

  let doi = null;
  const doiExtract = (publicationUrl + ' ' + normalized).match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+/);
  if (doiExtract) {
    doi = `https://doi.org/${doiExtract[0]}`;
  }

  // BibTeX using balanced brace extractor
  const bibtex = extractBibtexFromContent(normalized);

  // APA
  let apa = '';
  const apaMatch = normalized.match(/<h3>APA:<\/h3>[\s\S]*?\[et_pb_text[^\]]*\]([\s\S]*?)\[\/et_pb_text\]/i);
  if (apaMatch) {
    apa = cleanHtmlText(apaMatch[1]);
  }

  // Abstract
  let abstract = '';
  const textBlocks = [...normalized.matchAll(/\[et_pb_text[^\]]*\]([\s\S]*?)\[\/et_pb_text\]/gi)];
  for (const block of textBlocks) {
    const textContent = block[1];
    if (textContent.includes('Cite this Work') || textContent.includes('BibTex:') || textContent.includes('APA:')) {
      continue;
    }
    const cleaned = cleanHtmlText(textContent);
    if (cleaned.length > 60) {
      abstract = cleaned;
      break;
    } else if (cleaned.length > 0 && !abstract) {
      abstract = cleaned;
    }
  }

  return { paperVideo, publicationUrl, instructablesUrl, doi, bibtex, apa, abstract };
}

async function extract() {
  console.log('>>> [1/5] Reading and parsing export.xml...');
  const xmlContent = await fs.readFile(XML_PATH, 'utf-8');
  const items = xmlContent.split('<item>').slice(1);

  // Map attachments: id -> url
  const attachments = {};
  for (const item of items) {
    const typeMatch = item.match(/<wp:post_type>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_type>/);
    if (typeMatch && typeMatch[1] === 'attachment') {
      const idMatch = item.match(/<wp:post_id>(\d+)<\/wp:post_id>/);
      const urlMatch = item.match(/<wp:attachment_url>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:attachment_url>/);
      if (idMatch && urlMatch) {
        attachments[idMatch[1]] = urlMatch[1].trim();
      }
    }
  }
  console.log(`Mapped ${Object.keys(attachments).length} WordPress attachments.`);

  // Download icons & site assets
  console.log('>>> [2/5] Downloading static site assets and icons...');
  const siteAssets = [
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/cropped-upnalab_favicon.png', dest: path.join(ASSETS_ICONS, 'favicon.png'), isRaw: true },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/ORCID_iD.svg', dest: path.join(ASSETS_ICONS, 'ORCID_iD.svg'), isRaw: true },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/google_scholar_icon.svg', dest: path.join(ASSETS_ICONS, 'google_scholar_icon.svg'), isRaw: true },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/profile.svg', dest: path.join(ASSETS_ICONS, 'profile.svg'), isRaw: true },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/07/upnalab_header_logo.png', dest: path.join(ASSETS_IMG_SITE, 'upnalab_header_logo.png'), isRaw: true },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/02/upnalabLogo.png', dest: path.join(ASSETS_IMG_SITE, 'upnalabLogo.png'), isRaw: true },
    // DIY
    { url: 'http://upnalab.com/wp-content/uploads/sites/5/2023/07/intructablesUpnalab.jpg', dest: path.join(ASSETS_IMG_DIY, 'instructables.webp') },
    { url: 'http://upnalab.com/wp-content/uploads/sites/5/2023/07/youtubeUpnalab.jpg', dest: path.join(ASSETS_IMG_DIY, 'youtube.webp') },
    { url: 'http://upnalab.com/wp-content/uploads/sites/5/2023/07/githubUpnalab.jpg', dest: path.join(ASSETS_IMG_DIY, 'github.webp') },
    { url: 'http://upnalab.com/wp-content/uploads/sites/5/2023/07/openspaceUpnalab.jpg', dest: path.join(ASSETS_IMG_DIY, 'openspace.webp') },
    // Sponsors
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/erc_high-1.png', dest: path.join(ASSETS_IMG_SPONSORS, 'erc.webp') },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/horizonsponsor.jpg', dest: path.join(ASSETS_IMG_SPONSORS, 'touchless.webp') },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/fondoeuropeosponsor.jpg', dest: path.join(ASSETS_IMG_SPONSORS, 'navarra.webp') },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/upnasponsor.jpg', dest: path.join(ASSETS_IMG_SPONSORS, 'upna.webp') },
    { url: 'https://upnalab.com/wp-content/uploads/sites/5/2023/03/jovenesinvestigadores.jpg', dest: path.join(ASSETS_IMG_SPONSORS, 'jovenes.webp') }
  ];

  for (const asset of siteAssets) {
    try {
      if (!existsSync(asset.dest)) {
        const buf = await downloadFile(asset.url, path.join(TMP_RAW_DIR, path.basename(asset.url)));
        if (asset.isRaw) {
          await fs.writeFile(asset.dest, buf);
        } else {
          await convertToWebP(buf, asset.dest);
        }
      }
    } catch (e) {
      console.warn(`Failed downloading site asset ${asset.url}: ${e.message}`);
    }
  }

  // Copy favicon to public root
  const faviconSource = path.join(ASSETS_ICONS, 'favicon.png');
  if (existsSync(faviconSource)) {
    await fs.copyFile(faviconSource, './public/favicon.png');
    await fs.copyFile(faviconSource, './public/favicon.ico');
  }

  // Extract Projects
  console.log('>>> [3/5] Extracting and downloading Project media...');
  const projects = [];
  for (const item of items) {
    const typeMatch = item.match(/<wp:post_type>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_type>/);
    const statusMatch = item.match(/<wp:status>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:status>/);
    if (typeMatch && typeMatch[1] === 'project' && statusMatch && statusMatch[1] === 'publish') {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const slugMatch = item.match(/<wp:post_name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:post_name>/);
      const dateMatch = item.match(/<wp:post_date>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:post_date>/);
      const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/);
      
      const metaMatches = [...item.matchAll(/<wp:meta_key>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:meta_key>\s*<wp:meta_value>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:meta_value>/g)];
      const meta = {};
      for (const m of metaMatches) meta[m[1]] = m[2];

      const catMatches = [...item.matchAll(/<category domain="project_category" nicename="([^"]+)">(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/g)];
      const rawCategories = catMatches.map(c => c[2].trim());

      const slug = slugMatch ? slugMatch[1].trim() : '';
      const title = titleMatch ? titleMatch[1].trim() : '';
      const postDate = dateMatch ? dateMatch[1].trim() : '';
      const year = postDate ? new Date(postDate).getFullYear() : 2024;

      const isStudent = rawCategories.some(c => c.toLowerCase().includes('student')) || slug.startsWith('multimedia-undergrads');
      const primaryCategory = isStudent ? 'Student Project' : 'Research Project';

      // Normalized tags
      const tags = rawCategories
        .map(c => {
          if (c.toLowerCase() === 'utrasound') return 'Ultrasound';
          if (c.toLowerCase() === 'research-project') return 'Research Project';
          if (c.toLowerCase() === 'student-project') return 'Student Project';
          return c;
        })
        .filter(c => c !== 'Research Project' && c !== 'Student Project');

      // Process Thumbnail
      const thumbId = meta['_thumbnail_id'];
      const thumbUrl = thumbId ? attachments[thumbId] : null;
      const finalThumbPath = path.join(ASSETS_IMG_PROJECTS, `${slug}.webp`);
      let thumbnail = `/assets/images/projects/${slug}.webp`;

      if (thumbUrl && !existsSync(finalThumbPath)) {
        try {
          const rawThumb = await downloadFile(thumbUrl, path.join(TMP_RAW_DIR, `${slug}-thumb.jpg`));
          await convertToWebP(rawThumb, finalThumbPath, 640, 480);
        } catch (e) {
          console.warn(`Failed thumbnail for ${slug}: ${e.message}`);
        }
      }

      // Process micro-video
      const vidId = meta['featured_video'];
      const vidUrl = vidId ? attachments[vidId] : null;
      let videoPreview = null;

      if (vidUrl) {
        const finalVidPath = path.join(ASSETS_VID_PROJECTS, `${slug}.mp4`);
        videoPreview = `/assets/videos/projects/${slug}.mp4`;
        if (!existsSync(finalVidPath)) {
          try {
            console.log(`Downloading micro-video: ${slug}.mp4`);
            await downloadFile(vidUrl, finalVidPath);
          } catch (e) {
            console.warn(`Failed video for ${slug}: ${e.message}`);
            videoPreview = null;
          }
        }
      }

      // Parse Divi content
      const divi = parseDiviProjectContent(contentMatch ? contentMatch[1] : '');
      const authors = parseAuthorsFromBibtexOrApa(divi.bibtex, divi.apa);

      // Ensure paperVideo does not point to a remote WordPress URL on upnalab.com
      let paperVideo = divi.paperVideo;
      if (paperVideo && paperVideo.includes('upnalab.com/wp-content/uploads/')) {
        if (videoPreview) {
          paperVideo = videoPreview;
        } else {
          const finalPaperVidPath = path.join(ASSETS_VID_PROJECTS, `${slug}-paper.mp4`);
          if (!existsSync(finalPaperVidPath)) {
            try {
              await downloadFile(paperVideo, finalPaperVidPath);
              paperVideo = `/assets/videos/projects/${slug}-paper.mp4`;
            } catch (e) {
              console.warn(`Failed downloading paper video for ${slug}: ${e.message}`);
              paperVideo = '';
            }
          } else {
            paperVideo = `/assets/videos/projects/${slug}-paper.mp4`;
          }
        }
      }

      projects.push({
        id: slug,
        slug,
        title,
        date: postDate.split(' ')[0],
        year,
        category: primaryCategory,
        tags: tags.length > 0 ? tags : [primaryCategory],
        thumbnail,
        videoPreview,
        paperVideo,
        abstract: divi.abstract,
        publicationUrl: divi.publicationUrl,
        instructablesUrl: divi.instructablesUrl || null,
        doi: divi.doi,
        bibtex: divi.bibtex,
        apa: divi.apa,
        authors
      });
    }
  }

  // Sort projects chronologically descending
  projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  console.log(`Total published projects processed: ${projects.length}`);

  // Extract People
  console.log('>>> [4/5] Extracting and downloading People media...');
  const people = [];
  for (const item of items) {
    const typeMatch = item.match(/<wp:post_type>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:post_type>/);
    const statusMatch = item.match(/<wp:status>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/wp:status>/);
    if (typeMatch && typeMatch[1] === 'dipl-team-member' && statusMatch && statusMatch[1] === 'publish') {
      const titleMatch = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const slugMatch = item.match(/<wp:post_name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:post_name>/);
      const contentMatch = item.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/);

      const metaMatches = [...item.matchAll(/<wp:meta_key>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:meta_key>\s*<wp:meta_value>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/wp:meta_value>/g)];
      const meta = {};
      for (const m of metaMatches) meta[m[1]] = m[2];

      const catMatches = [...item.matchAll(/<category domain="dipl-team-member-category" nicename="([^"]+)"/g)];
      const nicenames = catMatches.map(c => c[1].toLowerCase());

      const slug = slugMatch ? slugMatch[1].trim() : '';
      const name = titleMatch ? titleMatch[1].trim() : '';
      const rawDesignation = meta['dipl_team_member_designation'] || 'Member';

      // Group into Active, Visitors, Alumni
      let category = 'Active';
      if (nicenames.some(n => n.includes('previous') || n.includes('alumni'))) {
        category = 'Alumni';
      } else if (nicenames.some(n => n.includes('visitor'))) {
        category = 'Visitors';
      }

      let subCategory = rawDesignation;
      if (nicenames.includes('staff')) subCategory = 'Staff';
      else if (nicenames.includes('postdoc')) subCategory = 'Postdoc';
      else if (nicenames.includes('phd-student')) subCategory = 'PhD Student';
      else if (nicenames.includes('project-collaborator')) subCategory = 'Project Collaborator';
      else if (nicenames.includes('visitor')) subCategory = 'Visitor';
      else if (nicenames.includes('previous-member')) subCategory = 'Previous Member';

      // Resolve photo
      const thumbId = meta['_thumbnail_id'];
      const photoUrl = thumbId ? attachments[thumbId] : null;
      const finalPhotoPath = path.join(ASSETS_IMG_PEOPLE, `${slug}.webp`);
      let photo = `/assets/images/people/${slug}.webp`;

      if (photoUrl && !existsSync(finalPhotoPath)) {
        try {
          const rawPhoto = await downloadFile(photoUrl, path.join(TMP_RAW_DIR, `${slug}-photo.jpg`));
          await convertToWebP(rawPhoto, finalPhotoPath, 400, 400);
        } catch (e) {
          console.warn(`Failed photo for ${slug}: ${e.message}`);
        }
      }

      // Separate email from academic profile links
      const rawEmail = meta['dipl_team_member_email'] ? meta['dipl_team_member_email'].trim() : '';

      // Resolve links intelligently from profile fields only (not email)
      const rawProfileLinks = [
        meta['dipl_team_member_website'],
        meta['dipl_team_member_linkedin'],
        meta['dipl_team_member_facebook'],
        meta['dipl_team_member_twitter'],
        meta['dipl_team_member_instagram'],
        meta['dipl_team_member_youtube']
      ];

      const links = {
        website: '',
        linkedin: '',
        scholar: '',
        orcid: '',
        upna: '',
        twitter: '',
        github: '',
        email: rawEmail
      };

      for (const val of rawProfileLinks) {
        if (!val || typeof val !== 'string') continue;
        const u = val.trim();
        if (u.includes('scholar.google')) links.scholar = u;
        else if (u.includes('orcid.org')) links.orcid = u;
        else if (u.includes('unavarra.es') || u.includes('researchgate.net')) links.upna = u;
        else if (u.includes('linkedin.com')) links.linkedin = u;
        else if (u.includes('twitter.com') || u.includes('x.com')) links.twitter = u;
        else if (u.includes('github.com')) links.github = u;
        else if (u.startsWith('http') && !u.includes('upnalab.com')) {
          if (!links.website) links.website = u;
        }
      }

      // Subcategory / specific role
      let role = rawDesignation;
      if (slug === 'asier-marzo') {
        role = 'Director / Associate Professor';
      }

      // Format bio with clean paragraphs if not already tagged
      const rawBio = (contentMatch ? contentMatch[1] : '').replace(/\[\/?et_pb_[^\]]*\]/g, '').trim();
      let formattedBio = rawBio;
      if (rawBio && !/<p[\s>]/i.test(rawBio)) {
        const paragraphs = rawBio.split(/\r?\n\s*\r?\n/);
        formattedBio = paragraphs
          .map(p => p.trim())
          .filter(Boolean)
          .map(p => `<p class="mb-4">${p.replace(/\r?\n/g, '<br />')}</p>`)
          .join('\n');
      }

      people.push({
        slug,
        name,
        role,
        category,
        subCategory,
        photo,
        bio: formattedBio,
        links
      });
    }
  }

  // Sort people: Director first, then alphabetical by name
  people.sort((a, b) => {
    if (a.slug === 'asier-marzo') return -1;
    if (b.slug === 'asier-marzo') return 1;
    return a.name.localeCompare(b.name);
  });
  console.log(`Total published team members processed: ${people.length}`);

  // Site Data (About Us, DIY, Sponsors)
  console.log('>>> [5/5] Generating site-data.json...');
  const siteData = {
    about: {
      headline: "UpnaLab: Future Interactive Devices",
      subheadline: "We are a research group based on the Public University of Navarre (Spain, Pamplona). We combine cutting-edge technology to create the most innovative interactive devices.",
      expertise: [
        "Acoustic Levitation and Directional Audio",
        "Virtual and Augmented Reality",
        "Volumetric Displays",
        "Sensors for HCI: Microwave, Infrared and other novel modalities",
        "Creativity & Fabrication Technologies"
      ],
      values: [
        {
          title: "Curiosity Driven",
          description: "Deep inside, curiosity is the main drive. Our reason for doing research is to see what nobody has seen before."
        },
        {
          title: "Pragmatic Multidisciplinarity",
          description: "Computer Science, Chemistry, Electronics, Optics or Acoustics are all tools that you need to exploit to realize the most innovative ideas."
        },
        {
          title: "Demos and Open Science",
          description: "We share how to build new devices through videos, open instructions and hands-on demonstrations."
        }
      ],
      sponsors: [
        {
          title: "Project InteVol – Horizon Europe ERC Starting Grant 101042702 – 2022-2027",
          logo: "/assets/images/sponsors/erc.webp"
        },
        {
          title: "Project TOUCHLESS – Horizon 2020 FET proact-2020-101017746 – 2021-2024",
          logo: "/assets/images/sponsors/touchless.webp"
        },
        {
          title: "Transferencia Gobierno de Navarra, “Hologramas Táctiles para mejora de la instrumentación quirúrgica en quirófanos” 2019-2020",
          logo: "/assets/images/sponsors/navarra.webp"
        },
        {
          title: "Proyectos Culturales, “Movidos por el Sonido”, Universidad Pública de Navarra. 2019",
          logo: "/assets/images/sponsors/upna.webp"
        },
        {
          title: "Jóvenes Investigadores, “Hacia el Ultimate Display con Ultrasonidos” 2019",
          logo: "/assets/images/sponsors/jovenes.webp"
        }
      ]
    },
    diy: [
      {
        title: "Instructables",
        url: "https://www.instructables.com/member/UpnaLab/",
        image: "/assets/images/diy/instructables.webp",
        description: "Check our detailed Instructables and guided tutorials to build your own cutting-edge devices. Acoustic Levitators, Ultrasonic Phased Arrays, and more."
      },
      {
        title: "YouTube Tutorials",
        url: "https://www.youtube.com/@UpnaLab",
        image: "/assets/images/diy/youtube.webp",
        description: "From basic electronics and soldering, to how to build your own Ultrasonic Levitators and Phased arrays. Follow narrated video tutorials at your own pace on our YouTube channel."
      },
      {
        title: "Open Source GitHub",
        url: "https://github.com/upnalab",
        image: "/assets/images/diy/github.webp",
        description: "Find and keep track of the code of our Open Source projects, fork your own versions and shape the future of software, together!"
      },
      {
        title: "UPNA's OpenSpace",
        url: "https://view.genial.ly/629a5ed84e5e8e0018ebd48b",
        image: "/assets/images/diy/openspace.webp",
        description: "A service aimed at fostering activity-based learning, where the university community can create and develop projects, share knowledge, and explore new technologies. 3D printers, laser cutters, materials for electronics and more at your disposal in the UPNA's library building."
      }
    ]
  };

  await Promise.all([
    fs.writeFile(path.join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2), 'utf-8'),
    fs.writeFile(path.join(DATA_DIR, 'people.json'), JSON.stringify(people, null, 2), 'utf-8'),
    fs.writeFile(path.join(DATA_DIR, 'site-data.json'), JSON.stringify(siteData, null, 2), 'utf-8')
  ]);

  console.log('>>> Extraction successfully finished! All assets and JSON data generated.');
}

extract().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
