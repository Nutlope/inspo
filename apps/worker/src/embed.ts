/**
 * Embeddings via Together AI.
 *
 * Model: BAAI/bge-large-en-v1.5 — 1024-dim, well-served on Together's
 * serverless endpoints. Matches the vector(1024) columns already in
 * @inspo/db so no migration is needed.
 *
 * For v1 we embed text only (description + tags + keywords). Visual-
 * pixel similarity goes back when we wire CLIP locally; until then,
 * the description from the vision model captures enough of the
 * "feel" for tag-style retrieval to work well.
 */

import Together from "together-ai";

const TEXT_MODEL = "BAAI/bge-large-en-v1.5"; // 1024-dim
export const EMBEDDING_DIMS = 1024;

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("TOGETHER_API_KEY is not set");

  const client = new Together({ apiKey });
  const res = await client.embeddings.create({
    model: TEXT_MODEL,
    input: text.slice(0, 8000), // BGE max 8K tokens; rough char cap
  });
  const vec = res.data?.[0]?.embedding;
  if (!Array.isArray(vec) || vec.length !== EMBEDDING_DIMS) {
    throw new Error(
      `Together embeddings: expected ${EMBEDDING_DIMS}-dim vector, got ${vec?.length}`,
    );
  }
  return vec;
}
