// Global site configuration
export const SITE = {
  domain: 'toolman.top',
  origin: 'https://toolman.top',
  name: 'Toolman',
  tagline: 'Fast, free, privacy-first online tools',
  description:
    'A collection of fast, free online tools that run entirely in your browser. No uploads, no sign-up, no tracking.',
  author: 'Toolman',
  lang: 'en',
};

// Tool categories used for navigation and hub pages
export const CATEGORIES = {
  dev: { slug: 'dev', name: 'Developer Tools', desc: 'Formatters, converters, generators and validators for developers.' },
  text: { slug: 'text', name: 'Text Tools', desc: 'Count, convert, compare and transform text.' },
  convert: { slug: 'convert', name: 'Converters', desc: 'Convert units, colors, time and data formats.' },
  image: { slug: 'image', name: 'Image Tools', desc: 'Compress, resize and convert images in your browser.' },
  ai: { slug: 'ai', name: 'AI Tools', desc: 'Utilities for working with large language models.' },
};
