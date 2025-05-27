const express = require('express');
const crypto = require('crypto');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const key = crypto.scryptSync('your-secret-password', 'salt', 32);
const iv = Buffer.alloc(16, 0); // 16 bytes IV (static for simplicity)

app.post('/encrypt', (req, res) => {
  const text = req.body.text || '';
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  res.json({ encrypted: encrypted.slice(0, 10) });
});

app.post('/decrypt', (req, res) => {
  const encrypted = req.body.encrypted || '';
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  try {
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    res.json({ decrypted });
  } catch {
    res.json({ decrypted: 'Invalid encrypted text' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
