/**
 * Voyage embeddings — multimodal (image+text) for visual similarity,
 * text-only for BM25-adjacent retrieval. We hit the REST API directly
 * since the JS SDK's multimodal coverage has lagged.
 */

const VOYAGE_BASE = "https://api.voyageai.com/v1";

export async function embedMultimodal(args: {
  imageBase64: string;
  text: string;
}): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch(`${VOYAGE_BASE}/multimodalembeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "voyage-multimodal-3",
      inputs: [
        {
          content: [
            { type: "image_base64", image_base64: `data:image/png;base64,${args.imageBase64}` },
            { type: "text", text: args.text },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Voyage multimodal: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}

export async function embedText(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY is not set");

  const res = await fetch(`${VOYAGE_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "voyage-3-large",
      input: [text],
      input_type: "document",
    }),
  });
  if (!res.ok) throw new Error(`Voyage text: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data[0].embedding;
}
