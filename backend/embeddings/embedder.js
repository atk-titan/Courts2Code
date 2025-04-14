import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const HF_TOKEN = process.env.HF_API_TOKEN;

export async function embedText(text) {
  const res = await axios.post(
    'https://api-inference.huggingface.co/embeddings/sentence-transformers/all-MiniLM-L6-v2',
    { inputs: text },
    { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
  );
  return res.data.embedding;
}