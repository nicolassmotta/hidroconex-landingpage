import { useEffect } from "react";
import { absoluteUrl } from "@/lib/siteUrls";
import { defaultSeo } from "@/lib/seo";

interface SeoProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: "website" | "product";
  robots?: string;
  structuredData?: Array<Record<string, unknown>> | Record<string, unknown>;
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonical(url: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", url);
}

export default function Seo({
  title = defaultSeo.title,
  description = defaultSeo.description,
  path = "/",
  image = defaultSeo.image,
  type = "website",
  robots = "index,follow",
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const canonical = absoluteUrl(path);
    const imageUrl = absoluteUrl(image);

    document.title = title;
    setCanonical(canonical);
    setMeta("name", "description", description);
    setMeta("name", "robots", robots);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", imageUrl);
    setMeta("property", "og:image:alt", title);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", imageUrl);

    const existingScript = document.getElementById("page-json-ld");
    existingScript?.remove();

    if (structuredData) {
      const script = document.createElement("script");
      const data = Array.isArray(structuredData) ? structuredData : [structuredData];
      script.id = "page-json-ld";
      script.type = "application/ld+json";
      script.setAttribute("nonce", "aGlkcm9jb25leC1qc29ubGQ=");
      script.textContent = JSON.stringify(
        data.length === 1 ? data[0] : { "@context": "https://schema.org", "@graph": data },
      );
      document.head.appendChild(script);
    }
  }, [description, image, path, robots, structuredData, title, type]);

  return null;
}
