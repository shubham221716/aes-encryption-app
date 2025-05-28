const express = require('express');
const crypto = require('crypto');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const store = new Map();

function getKey(secret) {
  return crypto.createHash('sha256').update(secret).digest().slice(0, 32);
}

function getIV() {
  return Buffer.from('1234567890abcdef'); // still fixed, could be randomized in future
}

function generateShortCode(hash) {
  // Remove non-alphanumeric characters
  const base = hash.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  const symbols = ['@', '#', '$', '%', '&'];
  const sym1 = symbols[Math.floor(Math.random() * symbols.length)];
  const sym2 = symbols[Math.floor(Math.random() * symbols.length)];
  return base + sym1 + sym2;
}

app.post('/encrypt', (req, res) => {
  const { text, key } = req.body;
  if (!text || !key) return res.json({ error: 'Missing input' });

  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(key), getIV());
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const hash = crypto.createHash('sha256').update(encrypted).digest('base64');
  const short = generateShortCode(hash);

  store.set(short, encrypted);
  res.json({ code: short });
});

app.post('/decrypt', (req, res) => {
  const { code, key } = req.body;
  const encrypted = store.get(code);
  if (!encrypted) return res.json({ error: 'Code not found' });

  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(key), getIV());
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    res.json({ text: decrypted });
  } catch (e) {
    res.json({ error: 'Decryption failed' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
