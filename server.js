// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let users = [];
const dataFile = 'users.json';

// Load users from file
if(fs.existsSync(dataFile)){
  users = JSON.parse(fs.readFileSync(dataFile));
}

// Save users to file
function saveUsers() {
  fs.writeFileSync(dataFile, JSON.stringify(users, null, 2));
}

// Signup
app.post('/signup', (req, res) => {
  const { email, userid, password, inventoryType } = req.body;
  if(users.find(u => u.userid === userid)) return res.status(400).json({message:'User ID already exists!'});
  const newUser = { email, userid, password, inventoryType, products: [] };
  users.push(newUser);
  saveUsers();
  res.json({message:'Account created successfully!'});
});

// Login
app.post('/login', (req, res) => {
  const { userid, password } = req.body;
  const user = users.find(u => u.userid === userid && u.password === password);
  if(!user) return res.status(400).json({message:'Invalid credentials'});
  res.json({message:'Login successful', user});
});

// Save products
app.post('/products', (req, res) => {
  const { userid, products } = req.body;
  const user = users.find(u => u.userid === userid);
  if(!user) return res.status(400).json({message:'User not found'});
  user.products = products;
  saveUsers();
  res.json({message:'Products saved'});
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));