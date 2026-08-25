import { ENERGY_KNOWLEDGE_BASE, KnowledgeChunk } from "./energyPlaybook";

export interface RetrievedChunk extends KnowledgeChunk {
  score: number;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "was",
  "at", "by", "with", "this", "that", "it", "its", "as", "be", "are", "vs",
  "has", "have", "from", "kwh", "day", "hours",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s%.-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Lightweight, dependency-free lexical retrieval (term-overlap + tag boost).
 * No embeddings/vector DB required — keeps the RAG layer transparent,
 * fast, and free to run for an MVP demo.
 */
export function retrieveKnowledge(query: string, topK = 3): RetrievedChunk[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const scored: RetrievedChunk[] = ENERGY_KNOWLEDGE_BASE.map((chunk) => {
    const contentTerms = tokenize(`${chunk.title} ${chunk.content}`);
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

export function buildGroundingContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";
  return chunks
    .map((c, i) => `[Source ${i + 1}: ${c.title}]\n${c.content}`)
    .join("\n\n");
}

export function toCitations(chunks: RetrievedChunk[]): { id: string; title: string }[] {
  return chunks.map((c) => ({ id: c.id, title: c.title }));
}
