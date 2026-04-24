import { useEffect } from 'react';

interface DocumentMetaOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonicalUrl?: string;
}

const BASE_TITLE = 'FoodMax Official Site';
const BASE_URL = 'https://foodera.vn';

const setMetaTag = (attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

const setCanonicalLink = (href: string) => {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
};

/**
 * Updates document `<title>`, meta description, Open Graph, Twitter Card,
 * and canonical URL for the current page.
 *
 * Values are restored to defaults when the component unmounts.
 */
const useDocumentMeta = (options: DocumentMetaOptions) => {
  useEffect(() => {
    const previousTitle = document.title;

    // Title
    if (options.title) {
      document.title = options.title === BASE_TITLE 
        ? options.title 
        : `${options.title} - ${BASE_TITLE}`;
    }

    // Meta description
    if (options.description) {
      setMetaTag('name', 'description', options.description);
    }

    // Open Graph
    const ogTitle = options.ogTitle || options.title;
    const ogDesc = options.ogDescription || options.description;

    if (ogTitle) {
      setMetaTag('property', 'og:title', ogTitle);
      setMetaTag('name', 'twitter:title', ogTitle);
    }
    if (ogDesc) {
      setMetaTag('property', 'og:description', ogDesc);
      setMetaTag('name', 'twitter:description', ogDesc);
    }
    if (options.ogImage) {
      setMetaTag('property', 'og:image', options.ogImage);
      setMetaTag('name', 'twitter:image', options.ogImage);
    }
    if (options.ogUrl) {
      setMetaTag('property', 'og:url', options.ogUrl);
    }

    // Canonical
    if (options.canonicalUrl) {
      setCanonicalLink(options.canonicalUrl);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [
    options.title,
    options.description,
    options.ogTitle,
    options.ogDescription,
    options.ogImage,
    options.ogUrl,
    options.canonicalUrl
  ]);
};

export { useDocumentMeta, BASE_TITLE, BASE_URL };
