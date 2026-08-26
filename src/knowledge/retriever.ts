import { ENERGY_KNOWLEDGE_BASE, KnowledgeChunk } from "./energyPlaybook";

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "was",
  "at", "by", "with", "this", "that", "it", "its", "as", "be", "are", "vs",
  "has", "have", "from", "kwh", "day", "hours",
  // Arabic function words / stopwords
  "في", "من", "إلى", "على", "عن", "هذا", "هذه", "ذلك", "التي", "الذي",
  "هو", "هي", "و", "أو", "كل", "مع", "كان", "كانت",
]);

/**
 * Tokenizes English and Arabic together. The original regex stripped every
 * non-ASCII character, which silently discarded all Arabic text before
 * matching ever ran -- an Arabic-language question could never retrieve
 * anything. ؀-ۿ (+ presentation-form ranges) covers Arabic script.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿﭐ-﷿ﹰ-﻿\s%.-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Lightweight, dependency-free lexical retrieval (term-overlap + tag boost).
 * No embeddings/vector DB required — keeps the RAG layer transparent,
 * fast, and free to run for an MVP demo. Indexes both language variants of
 * each chunk's title/content plus the (already bilingual) tags array, so a
 * query in either language can match a chunk regardless of which language
 * happens to hold the matching term.
 */
export function retrieveKnowledge(query: string, topK = 3): RetrievedChunk[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored: RetrievedChunk[] = ENERGY_KNOWLEDGE_BASE.map((chunk) => {
    const contentTerms = tokenize(`${chunk.title} ${chunk.content} ${chunk.title_ar} ${chunk.content_ar}`);
    const contentSet = new Set(contentTerms);
    const tagSet = new Set(chunk.tags.map((t) => t.toLowerCase()));

    let score = 0;
    for (const term of queryTerms) {
      if (contentSet.has(term)) score += 1;
      if (tagSet.has(term)) score += 2; // tag matches are stronger signals
    }
    // Normalize slightly by content length so short, precise chunks aren't buried
    score = score / Math.sqrt(contentTerms.length);

    return { ...chunk, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function buildGroundingContext(chunks: RetrievedChunk[], lang: "en" | "ar" = "en"): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `[Source ${i + 1}: ${lang === "ar" ? c.title_ar : c.title}]\n${lang === "ar" ? c.content_ar : c.content}`)
    .join("\n\n");
}

export function toCitations(chunks: RetrievedChunk[], lang: "en" | "ar" = "en"): { id: string; title: string }[] {
  return chunks.map((c) => ({ id: c.id, title: lang === "ar" ? c.title_ar : c.title }));
}
