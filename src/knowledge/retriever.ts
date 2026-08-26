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

// Arabic morphology glues prefixes directly onto the next word with no
// space -- بأجهزة ("with devices") vs أجهزة ("devices"), الحاسوب ("the
// computer") vs حاسوب ("computer"). Without stripping these, a knowledge
// chunk tagged "حاسوب" almost never exact-matches a real question, because
// real questions almost always carry a preposition or definite article.
// Longest prefixes first so "بال" strips as one unit, not "ب" then leaving
// a dangling "ال". Only applied to tokens long enough that stripping can't
// eat the whole word.
const ARABIC_PREFIXES = ["وبال", "فبال", "كال", "بال", "وال", "فال", "لل", "ال", "و", "ف", "ب", "ك", "ل"];
function stripArabicPrefix(word: string): string {
  for (const p of ARABIC_PREFIXES) {
    if (word.length > p.length + 2 && word.startsWith(p)) {
      return word.slice(p.length);
    }
  }
  return word;
}

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
    .map(stripArabicPrefix)
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
    // Tokenized, not just lowercased: a multi-word tag like "أجهزة حاسوب"
    // needs to match on either of its words individually, and needs the
    // same prefix-stripping as everything else or "الحاسوب" in a real
    // question won't match a tag written as "حاسوب".
    const tagSet = new Set(tokenize(chunk.tags.join(" ")));

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
