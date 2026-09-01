import { esc } from '../layout.mjs';

// ext, name, category, mime, what it is, how to open, notes
const E = [
  ['heic', 'High Efficiency Image Container', 'Image', 'image/heic',
    'The format iPhones save photos in by default since iOS 11. It stores HEVC-compressed images at roughly half the size of an equivalent JPEG, and can hold multiple images, depth maps and Live Photo data in one file.',
    'macOS and iOS open it natively. Windows 11 needs the HEIF Image Extensions from the Microsoft Store. Most websites and older software will not accept it — convert to JPEG first.',
    'To stop your iPhone producing HEIC at all: Settings → Camera → Formats → Most Compatible.'],
  ['webp', 'WebP Image', 'Image', 'image/webp',
    'Google\'s web image format, supporting both lossy and lossless compression plus transparency and animation. Typically 25–35% smaller than JPEG at matching quality.',
    'Every current browser opens it. Older desktop software may not — convert to PNG or JPEG.',
    'WebP is the sensible default for images on a website today. Its successor AVIF compresses better still but encodes more slowly.'],
  ['avif', 'AV1 Image File Format', 'Image', 'image/avif',
    'A still-image format derived from the AV1 video codec. It compresses noticeably better than both JPEG and WebP, particularly at low bitrates, and supports HDR and transparency.',
    'All current browsers. Desktop image viewers are catching up; convert to PNG if something refuses it.',
    'Encoding is slow compared to WebP, which matters for user-uploaded images but not for assets you compress once.'],
  ['svg', 'Scalable Vector Graphics', 'Image', 'image/svg+xml',
    'An XML description of shapes rather than a grid of pixels, so it stays perfectly sharp at any size and usually weighs very little.',
    'Any browser, plus Illustrator, Inkscape and Figma. It is plain text — you can open it in a code editor.',
    'Because SVG can contain scripts, never render an uploaded SVG from an untrusted source without sanitising it.'],
  ['psd', 'Photoshop Document', 'Image', 'image/vnd.adobe.photoshop',
    'Adobe Photoshop\'s working format, preserving layers, masks, adjustment layers, smart objects and text as editable data.',
    'Photoshop, or Photopea (free, in-browser), GIMP and Affinity Photo with varying fidelity.',
    'PSD files get large fast. Export a flattened PNG or JPEG for sharing and keep the PSD as the master.'],
  ['ai', 'Adobe Illustrator Artwork', 'Image', 'application/postscript',
    'Illustrator\'s vector working format. Modern .ai files are actually PDFs with extra Illustrator data.',
    'Illustrator, or Inkscape and Affinity Designer with some loss of fidelity. Renaming to .pdf often opens it for viewing.',
    'For handing artwork to a developer, export SVG rather than sending the .ai.'],
  ['raw', 'Camera Raw Image', 'Image', 'image/x-raw',
    'Unprocessed sensor data straight from a camera, before demosaicing, white balance and tone curves are applied. Manufacturer-specific: .CR2/.CR3 (Canon), .NEF (Nikon), .ARW (Sony), .DNG (open standard).',
    'Lightroom, Capture One, darktable, RawTherapee, or the operating system\'s photo app.',
    'Raw holds far more highlight and shadow detail than JPEG, which is why it is worth the file size when the exposure might need rescuing.'],
  ['pdf', 'Portable Document Format', 'Document', 'application/pdf',
    'A fixed-layout document format that renders identically everywhere. It can embed fonts, vector graphics, raster images, form fields and digital signatures.',
    'Any browser, plus Preview, Acrobat and hundreds of other readers.',
    'A PDF may contain selectable text or just a scanned image. If you cannot select the text, it needs OCR before it becomes searchable.'],
  ['docx', 'Word Document', 'Document', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Microsoft Word\'s format since 2007. Despite appearances it is a ZIP archive containing XML — rename one to .zip and you can look inside.',
    'Word, Google Docs, LibreOffice Writer, Pages.',
    'Complex layouts and tracked changes do not always survive a round trip through a non-Microsoft editor.'],
  ['epub', 'Electronic Publication', 'Document', 'application/epub+zip',
    'The open ebook standard — essentially a ZIP of HTML and CSS, so text reflows to fit any screen size.',
    'Apple Books, Calibre, Google Play Books, most e-readers except Kindle.',
    'Kindle uses its own formats. Calibre converts EPUB to them, or you can email the EPUB to your Kindle address.'],
  ['csv', 'Comma-Separated Values', 'Data', 'text/csv',
    'Plain text where each line is a row and commas separate the fields. No types, no formulas, no formatting — which is exactly why it is universal.',
    'Any spreadsheet or text editor. For a clean import, use Excel\'s import wizard rather than double-clicking the file.',
    'Excel mangles leading zeros and long numbers on open, and some locales expect semicolons instead of commas. <a href="/json-to-csv/">Convert CSV to JSON</a> if you are feeding a program rather than a person.'],
  ['json', 'JavaScript Object Notation', 'Data', 'application/json',
    'The dominant data interchange format on the web: nested objects and arrays of strings, numbers, booleans and null.',
    'Any text editor. <a href="/json-formatter/">Format and validate it here</a>.',
    'JSON has no comments and no trailing commas. Both are the most common syntax errors.'],
  ['yaml', 'YAML Ain\'t Markup Language', 'Data', 'application/yaml',
    'A human-friendly configuration format using indentation instead of brackets. Used by Kubernetes, GitHub Actions, Docker Compose and most modern CI systems.',
    'Any text editor, ideally one with a YAML linter.',
    'Indentation is significant and tabs are forbidden. The "Norway problem" — unquoted <code>NO</code> parsing as boolean false — bites everyone once.'],
  ['sql', 'SQL Script', 'Data', 'application/sql',
    'Plain-text database statements — either schema definitions or a full dump of data as INSERT statements.',
    'Any text editor, or piped into a database client: <code>mysql &lt; dump.sql</code>, <code>psql -f dump.sql</code>.',
    'Dumps of large tables get enormous. Compress them, and check the file starts with the statements you expect before running it against anything.'],
  ['parquet', 'Apache Parquet', 'Data', 'application/vnd.apache.parquet',
    'A columnar storage format built for analytics. Because it stores each column together, queries that touch a few columns of a huge table read far less data.',
    'Pandas, DuckDB, Spark, or the DuckDB CLI for a quick look.',
    'Typically 5–10× smaller than the equivalent CSV, and much faster to query. Not human-readable.'],
  ['zip', 'ZIP Archive', 'Archive', 'application/zip',
    'The most widely supported compressed archive format, dating to 1989.',
    'Built into Windows, macOS and every Linux desktop.',
    'DOCX, XLSX, EPUB, JAR and APK are all ZIP files with a different extension and a required internal structure.'],
  ['7z', '7-Zip Archive', 'Archive', 'application/x-7z-compressed',
    'The 7-Zip format, which usually compresses noticeably better than ZIP thanks to LZMA2.',
    '7-Zip on Windows, Keka on macOS, <code>p7zip</code> on Linux.',
    'Better compression, but less universally supported. Use ZIP when you do not know what the recipient has.'],
  ['tar', 'Tape Archive', 'Archive', 'application/x-tar',
    'A container that bundles files and their permissions without compressing anything. Almost always paired with a compressor, giving .tar.gz or .tar.xz.',
    '<code>tar -xf archive.tar.gz</code> on any Unix system; 7-Zip on Windows.',
    'Unlike ZIP, a tar preserves Unix ownership and permission bits — which is why it is still the default for source releases.'],
  ['mp4', 'MPEG-4 Video', 'Video', 'video/mp4',
    'The default container for video on the web and on phones, normally holding H.264 or H.265 video with AAC audio.',
    'Everything.',
    'MP4 is a container, not a codec. A file that will not play usually has an unsupported codec inside — often H.265 on older hardware.'],
  ['mov', 'QuickTime Movie', 'Video', 'video/quicktime',
    'Apple\'s container format, and what an iPhone records to. Technically very close to MP4.',
    'QuickTime, VLC, most editors. Windows Media Player may need codecs.',
    'Converting MOV to MP4 is often just a container remux with no re-encoding, which is instant and lossless.'],
  ['mkv', 'Matroska Video', 'Video', 'video/x-matroska',
    'An open container that can hold essentially any codec, plus multiple audio tracks, subtitles and chapters in one file.',
    'VLC, MPV, Plex. Browsers and phones generally will not play it directly.',
    'The format of choice for archiving, because it puts no constraints on what it carries.'],
  ['webm', 'WebM Video', 'Video', 'video/webm',
    'An open, royalty-free container for VP8/VP9 or AV1 video with Vorbis or Opus audio, designed for HTML5 video.',
    'All current browsers, VLC, MPV.',
    'Smaller than MP4 at equivalent quality, but Safari support arrived late and some older devices still struggle.'],
  ['mp3', 'MPEG Audio Layer III', 'Audio', 'audio/mpeg',
    'The lossy audio format that made digital music portable. Patents expired in 2017, so it is now completely unencumbered.',
    'Everything.',
    'Modern codecs (AAC, Opus) sound better at the same bitrate, but nothing matches MP3 for universal compatibility.'],
  ['flac', 'Free Lossless Audio Codec', 'Audio', 'audio/flac',
    'Lossless audio compression — bit-for-bit identical to the source at roughly half the size of WAV.',
    'VLC, foobar2000, most modern players. Apple added support in 2017.',
    'Use it for archiving a CD collection. For listening on a phone, a high-bitrate lossy file is indistinguishable and far smaller.'],
  ['wav', 'Waveform Audio', 'Audio', 'audio/wav',
    'Uncompressed PCM audio. About 10 MB per minute at CD quality.',
    'Everything.',
    'The right format for recording and editing, the wrong one for distribution.'],
  ['ttf', 'TrueType Font', 'Font', 'font/ttf',
    'The font format Apple and Microsoft developed in the late 1980s, still ubiquitous on the desktop.',
    'Double-click to install on Windows or macOS.',
    'For the web, convert to WOFF2 — it is the same outlines with much better compression.'],
  ['woff2', 'Web Open Font Format 2', 'Font', 'font/woff2',
    'The web font format, wrapping TrueType or OpenType outlines in Brotli compression. Roughly 30% smaller than WOFF.',
    'Loaded by browsers through CSS <code>@font-face</code>; not a desktop-installable font.',
    'This is the only web font format worth shipping today. Serving TTF to browsers wastes bandwidth on every page load.'],
  ['exe', 'Windows Executable', 'Executable', 'application/vnd.microsoft.portable-executable',
    'A compiled Windows program in the Portable Executable format.',
    'Windows only. On macOS or Linux you need Wine or a virtual machine.',
    'Never run an .exe from an untrusted source. Check the digital signature in the file properties before you do.'],
  ['dmg', 'Apple Disk Image', 'Executable', 'application/x-apple-diskimage',
    'A mountable disk image, the standard way macOS applications are distributed.',
    'macOS only — double-click to mount, then drag the app to Applications.',
    'Eject the mounted image afterwards; a drawer full of mounted DMGs is a very common macOS untidiness.'],
  ['apk', 'Android Package', 'Executable', 'application/vnd.android.package-archive',
    'An Android application package — a signed ZIP containing compiled code, resources and a manifest.',
    'Android devices, with "install from unknown sources" enabled for sideloading.',
    'Sideloaded APKs bypass Play Store review entirely. Only install ones whose signature you can verify.'],
  ['iso', 'Disc Image', 'Archive', 'application/x-iso9660-image',
    'A byte-for-byte image of an optical disc or an installer volume.',
    'Windows and macOS mount ISOs natively. To make bootable media, write it with Rufus, balenaEtcher or <code>dd</code>.',
    'Always verify the published SHA-256 of an OS image before writing it — <a href="/hash-generator/">hash it here</a>.'],
  ['log', 'Log File', 'Text', 'text/plain',
    'Plain text output from an application or system, usually one timestamped event per line.',
    'Any text editor. For large files use <code>tail -f</code>, <code>less</code>, or <code>ripgrep</code> rather than opening the whole thing.',
    'Log files grow without bound unless rotated. A full disk from unrotated logs is a classic 3 a.m. incident.'],
  ['env', 'Environment File', 'Text', 'text/plain',
    'Key-value configuration loaded into an application\'s environment, one <code>KEY=value</code> per line.',
    'Any text editor.',
    'A .env file almost always contains secrets. It must be in .gitignore, and if one has ever been committed, rotate every credential in it — deleting the file does not remove it from git history.'],
];

const CATS = ['Image', 'Document', 'Data', 'Archive', 'Video', 'Audio', 'Font', 'Executable', 'Text'];

export default async function () {
  const pages = [];

  for (const [ext, name, cat, mime, what, open, note] of E) {
    const related = E.filter((x) => x[2] === cat && x[0] !== ext);
    const others = E.filter((x) => x[2] !== cat).slice(0, 12);
    pages.push({
      path: `/file/${ext}/`,
      title: `.${ext} File — What It Is and How to Open It`,
      desc: `A .${ext} file is a ${name}. What the format is for, which programs open it, how it compares to the alternatives, and what to watch out for.`,
      h1: `.${ext} — ${name}`,
      crumbs: [
        { name: 'File formats', path: '/file/' },
        { name: `.${ext}`, path: `/file/${ext}/` },
      ],
      jsonld: [{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: `What is a .${ext} file?`,
            acceptedAnswer: { '@type': 'Answer', text: `A .${ext} file is a ${name}. ${what.replace(/<[^>]+>/g, '')}` } },
          { '@type': 'Question', name: `How do I open a .${ext} file?`,
            acceptedAnswer: { '@type': 'Answer', text: open.replace(/<[^>]+>/g, '') } },
        ],
      }],
      body: `<p><span class="pill">${cat}</span> <span class="pill">${esc(mime)}</span></p>
<h2>What a .${ext} file is</h2>
<p>${what}</p>
<h2>How to open it</h2>
<p>${open}</p>
<h2>Worth knowing</h2>
<p>${note}</p>
${['webp', 'avif', 'svg'].includes(ext) ? `<h2>Converting it</h2>
<p>You can convert ${ext.toUpperCase()} in your browser without uploading it anywhere: <a href="/${ext}-to-png/">${ext.toUpperCase()} to PNG</a>, <a href="/${ext}-to-jpg/">${ext.toUpperCase()} to JPG</a>${ext !== 'webp' ? `, <a href="/${ext}-to-webp/">${ext.toUpperCase()} to WebP</a>` : ''}.</p>` : ''}
${ext === 'heic' ? `<h2>Converting it</h2>
<p>We deliberately do not offer a browser-based HEIC converter. Chrome and Firefox cannot decode HEIC at all, so any such tool either uploads your photo to a server — which defeats the point of this site — or ships a megabyte of WebAssembly to do it locally. Neither is a good trade for a format your own device already converts for free:</p>
<ul>
<li><strong>On iPhone:</strong> Settings → Camera → Formats → <em>Most Compatible</em> makes the camera save JPEG from now on. For photos you already took, sharing them by email or AirDrop to a non-Apple device converts them automatically.</li>
<li><strong>On macOS:</strong> open in Preview, then File → Export and choose JPEG.</li>
<li><strong>On Windows 11:</strong> install the HEIF Image Extensions from the Microsoft Store, then open in Photos and Save as.</li>
<li><strong>On the command line:</strong> <code>heif-convert photo.heic photo.jpg</code>, or <code>magick photo.heic photo.jpg</code> with a HEIF-enabled ImageMagick.</li>
</ul>` : ''}
<h2>Other ${cat.toLowerCase()} formats</h2>
<ul class="linklist">${related.map((x) => `<li><a href="/file/${x[0]}/">.${x[0]} — ${esc(x[1])}</a></li>`).join('') || '<li class="muted">None yet.</li>'}</ul>
<h2>Other formats</h2>
<ul class="linklist">${others.map((x) => `<li><a href="/file/${x[0]}/">.${x[0]}</a></li>`).join('')}</ul>
<p><a href="/file/">All file formats</a></p>`,
    });
  }

  pages.push({
    path: '/file/',
    title: 'File Format Reference — What Each Extension Is',
    desc: `What each file extension actually is, which programs open it, and how it compares to the alternatives. Covers ${E.length} formats across images, documents, data, video, audio and archives.`,
    h1: 'File formats',
    crumbs: [{ name: 'File formats', path: '/file/' }],
    body: `<p class="muted">What the extension means, what opens it, and the thing about it that actually catches people out.</p>
${CATS.map((c) => {
      const list = E.filter((x) => x[2] === c);
      if (!list.length) return '';
      return `<h2>${c}</h2><table><thead><tr><th style="width:7em">Extension</th><th>Format</th></tr></thead><tbody>
${list.map(([ext, name]) => `<tr><td><a href="/file/${ext}/"><strong>.${ext}</strong></a></td><td><a href="/file/${ext}/">${esc(name)}</a></td></tr>`).join('')}
</tbody></table>`;
    }).join('')}
<h2>The extension is a hint, not a fact</h2>
<p>A file's extension is just the end of its name — renaming <code>photo.png</code> to <code>photo.jpg</code> changes nothing about the bytes inside. What programs actually rely on is the <em>magic number</em>, the first few bytes of the file: <code>%PDF</code> for a PDF, <code>PK</code> for anything ZIP-based, <code>\\x89PNG</code> for a PNG. On Unix, <code>file somefile</code> reports what a file really is regardless of its name.</p>
<h2>Formats that are secretly ZIP files</h2>
<p>DOCX, XLSX, PPTX, EPUB, JAR, APK and IPA are all ZIP archives with a mandated internal layout. Rename any of them to <code>.zip</code>, extract it, and you can read the XML or class files inside — genuinely useful when a document will not open and you need to recover the text.</p>`,
  });

  return pages;
}
