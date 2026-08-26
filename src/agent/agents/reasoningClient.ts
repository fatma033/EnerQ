import { KnowledgeCitation } from "../../types";

/**
 * Shared RAG + Ollama reasoning client used by any agent that needs
 * source-grounded, human-readable explanation (currently DiagnosticAgent's
 * investigate step and ActionAgent's recommend step). Talks to the
 * server-side /api/agent/reason endpoint, which itself falls back to the
 * deterministic engine when no local Ollama instance is reachable.
 */
export async function fetchInsight(
  stage: string,
  facilityData: Record<string, unknown>,
  userPrompt?: string
): Promise<{ text: string | null; citations: KnowledgeCitation[]; source: string | null }> {
  try {
    const resp = await fetch("/api/agent/reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, facilityData, userPrompt }),
    });
    const data = await resp.json();
    return {
      text: data?.analysis ?? null,
      citations: data?.citations ?? [],
      source: data?.source ?? null,
    };
  } catch {
    return { text: null, citations: [], source: null };
  }
}
