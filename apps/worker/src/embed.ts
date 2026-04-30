/**
 * Embeddings via Together AI.
 *
 * Model: intfloat/multilingual-e5-large-instruct — 1024-dim, the
 * single serverless embedding option on Together's catalogue at
 * the moment. Matches the vector(1024) columns already in @inspo/db
 * so no migration is needed.
 *
 * For v1 we embed text only (description + tags + keywords). Visual-
 * pixel similarity comes back when we wire CLIP locally; until then,
 * the description from the vision model captures enough of the
 * "feel" for tag-style retrieval to work well.
 */

import Together from "together-ai";

const TEXT_MODEL =
  process.env.INSPO_EMBED_MODEL ?? "intfloat/multilingual-e5-large-instruct";
export const EMBEDDING_DIMS = 1024;

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("TOGETHER_API_KEY is not set");

  const client = new Together({
    apiKey,
    baseURL: process.env.TOGETHER_BASE_URL ?? "https://api.together.ai/v1",
  });
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
