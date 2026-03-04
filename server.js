const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const dataFile = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let users = [];

function loadUsers() {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(dataFile, '[]', 'utf8');
      users = [];
      return;
    }

    const raw = fs.readFileSync(dataFile, 'utf8').trim();
    users = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(users)) {
      users = [];
    }
  } catch (error) {
    console.error('Failed to load users.json. Falling back to empty data.', error.message);
    users = [];
  }
}

function saveUsers() {
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2), 'utf8');
}

function findUser(userid) {
  return users.find((u) => u.userid === userid);
}

loadUsers();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', users: users.length });
});

app.post('/signup', (req, res) => {
  const { email, userid, password, inventoryType } = req.body;

  if (!email || !userid || !password || !inventoryType) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (findUser(userid)) {
    return res.status(409).json({ message: 'User ID already exists.' });
  }

  const newUser = {
    email,
    userid,
    password,
    inventoryType,
    products: [],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers();

  return res.status(201).json({
    message: 'Account created successfully.',
    user: {
      email: newUser.email,
      userid: newUser.userid,
      inventoryType: newUser.inventoryType,
      products: []
    }
  });
});

app.post('/login', (req, res) => {
  const { userid, password } = req.body;

  if (!userid || !password) {
    return res.status(400).json({ message: 'User ID and password are required.' });
  }

  const user = users.find((u) => u.userid === userid && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  return res.json({
    message: 'Login successful.',
    user: {
      email: user.email,
      userid: user.userid,
      inventoryType: user.inventoryType,
      products: user.products || []
    }
  });
});

app.get('/products/:userid', (req, res) => {
  const user = findUser(req.params.userid);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({ products: user.products || [] });
});

app.post('/products', (req, res) => {
  const { userid, products } = req.body;

  if (!userid || !Array.isArray(products)) {
    return res.status(400).json({ message: 'Invalid payload.' });
  }

  const user = findUser(userid);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  user.products = products;
  saveUsers();

  return res.json({ message: 'Products saved.', products: user.products });
});

app.use((req, res) => {
  if (req.method === 'GET') {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  return res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
