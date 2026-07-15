import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SEOMeta {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogUrl?: string;
  twitterHandle?: string;
}

export const usePageSEO = (meta: SEOMeta) => {
  const location = useLocation();

  useEffect(() => {
    // Update meta tags
    document.title = meta.title;

    // Description meta tag
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute("content", meta.description);

    // Keywords meta tag
    let keywordsTag = document.querySelector('meta[name="keywords"]');
    if (!keywordsTag) {
      keywordsTag = document.createElement("meta");
      keywordsTag.setAttribute("name", "keywords");
      document.head.appendChild(keywordsTag);
    }
    keywordsTag.setAttribute("content", meta.keywords.join(", "));

    // Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute("content", meta.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute("content", meta.description);

    if (meta.ogImage) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute("content", meta.ogImage);
    }

    if (meta.ogUrl || location.pathname) {
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement("meta");
        ogUrl.setAttribute("property", "og:url");
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute("content", meta.ogUrl || `${window.location.origin}${location.pathname}`);
    }

    // Twitter tags
    if (meta.twitterHandle) {
      let twitterHandle = document.querySelector('meta[name="twitter:creator"]');
      if (!twitterHandle) {
        twitterHandle = document.createElement("meta");
        twitterHandle.setAttribute("name", "twitter:creator");
        document.head.appendChild(twitterHandle);
      }
      twitterHandle.setAttribute("content", meta.twitterHandle);
    }

    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement("meta");
      twitterCard.setAttribute("name", "twitter:card");
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute("content", "summary_large_image");
  }, [meta, location]);
};

export const LandingPageSEO = () => {
  usePageSEO({
    title: "AuraMind - AI-Powered Learning Platform | Study Smarter",
    description:
      "Master any subject with AuraMind. AI-generated flashcards, spaced repetition algorithm, and intelligent tracking. Study 30% more efficiently.",
    keywords: [
      "flashcards",
      "AI learning",
      "spaced repetition",
      "study app",
      "education",
      "FSRS algorithm",
      "smart learning",
      "memory retention",
      "educational technology",
      "online learning",
    ],
    twitterHandle: "@AuraMindApp",
  });

  return null;
};

// Component for adding structured data (JSON-LD)
export const StructuredData = () => {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AuraMind",
      applicationCategory: "Educational",
      description:
        "AI-powered learning platform with intelligent flashcard generation and spaced repetition algorithm for optimal learning retention.",
      url: "https://auramind.app",
      image: "https://auramind.app/auramind/og-cover.png",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "12500",
      },
    };

    let scriptTag = document.querySelector(
      'script[type="application/ld+json"]',
    ) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      (scriptTag as HTMLScriptElement).type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.innerHTML = JSON.stringify(structuredData);
  }, []);

  return null;
};
