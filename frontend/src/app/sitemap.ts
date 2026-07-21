import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/api";
import { SITE_URL } from "@/lib/config";

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/clubes`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/partidos`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/tabla`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/goleadores`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/noticias`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/transferencias`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/h2h`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/historial`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/predicciones`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/simulador`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/tactico`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  const dynamicPages: MetadataRoute.Sitemap = [];

  const clubes = await safeFetch<Array<{ id: string }>>("/api/v1/clubes");
  if (clubes) {
    for (const club of clubes) {
      dynamicPages.push({
        url: `${SITE_URL}/clubes/${club.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const partidos = await safeFetch<{ data: Array<{ id: string }> }>("/api/v1/partidos?per_page=500");
  if (partidos?.data) {
    for (const partido of partidos.data) {
      dynamicPages.push({
        url: `${SITE_URL}/partidos/${partido.id}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  const noticias = await safeFetch<{ noticias: Array<{ id: string; pub_date: string }> }>("/api/v1/noticias?limit=200");
  if (noticias?.noticias) {
    for (const noticia of noticias.noticias) {
      dynamicPages.push({
        url: `${SITE_URL}/noticias/${noticia.id}`,
        lastModified: noticia.pub_date || now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return [...staticPages, ...dynamicPages];
}
