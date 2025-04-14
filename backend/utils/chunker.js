export function chunkText(text, maxChunkSize = 500) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let currentChunk = '';
  
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= maxChunkSize) {
        currentChunk += sentence + ' ';
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ' ';
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
  
    return chunks;
  }  