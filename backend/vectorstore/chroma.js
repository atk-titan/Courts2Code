const chroma = await import('chroma-node');

const db = await chroma.ChromaClient.create();
const collection = await db.createCollection('docs');

export async function addToVectorStore(chunks, cid) {
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i]);
    await collection.add({
      ids: [`${cid}_${i}`],
      embeddings: [embedding],
      documents: [chunks[i]],
      metadatas: [{ cid, chunkIndex: i }],
    });
  }
}

export async function queryVectorStore(query, threshold = 0.75) {
    const embedding = await embedText(query);
    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: 3,
      include: ['documents', 'metadatas', 'distances']
    });
  
    // Filter based on distance (cosine similarity: closer to 0 is better)
    const distances = results.distances[0];
    const documents = results.documents[0];
    const metadatas = results.metadatas[0];
  
    const relevant = [];
  
    for (let i = 0; i < distances.length; i++) {
      if (distances[i] < (1 - threshold)) { // similarity > threshold
        relevant.push({
          chunk: documents[i],
          metadata: metadatas[i],
          distance: distances[i]
        });
      }
    }
  
    return relevant;
  }
  