import express from 'express';
import pdfParse from 'pdf-parse';
import { fetchFileFromIPFS } from '../utils/ipfs.js';
import { chunkText } from '../utils/chunker.js';
import { addToVectorStore, queryVectorStore } from '../vectorstore/chroma.js';

const router = express.Router();

// Ingest multiple documents by CIDs
router.post('/ingest', async (req, res) => {
  const { cids } = req.body;
  if (!cids && !Array.isArray(cids)) {
    return res.status(400).send({ error: 'cids must be an array of strings' });
  }

  const summary = [];

  for (const cid of cids) {
    try {
      const fileBuffer = await fetchFileFromIPFS(cid);
      const parsed = await pdfParse(fileBuffer);
      const chunks = chunkText(parsed.text);
      await addToVectorStore(chunks, cid);
      summary.push({ cid, status: 'Ingested', chunks: chunks.length });
    } catch (error) {
      console.error(`Error processing CID ${cid}:`, error.message);
      summary.push({ cid, status: 'Error', error: error.message });
    }
  }

  res.send({ summary });
});

// Ask question
router.post('/ask', async (req, res) => {
    const { question } = req.body;
    const results = await queryVectorStore(question);
  
    if (results.length === 0) {
      return res.send({ answer: 'Sorry, could not find the answer.' });
    }
  
    const response = results.map(({ chunk, metadata }) => ({
      chunk,
      source: `CID: ${metadata.cid}, Chunk: ${metadata.chunkIndex}`
    }));
  
    res.send({ answerChunks: response });
});
export default router;