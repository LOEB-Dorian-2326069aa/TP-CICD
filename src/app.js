const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Route /health : permet d'identifier la version en prod en < 10 secondes (Risque R2)
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (process.env.DATABASE_URL) {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error';
  }

  res.status(200).json({
    status: 'ok',
    version: process.env.APP_VERSION || 'v0.1.0',
    commit: process.env.GIT_COMMIT || 'local',
    env: process.env.APP_ENV || 'local',
    database: dbStatus,
  });
});

// Route GET /products : liste les produits disponibles
app.get('/products', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, category, price, stock FROM products ORDER BY id ASC LIMIT 50'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des produits' });
  }
});

// Route POST /orders : enregistre une commande (la gestion du stock sera affinée en Partie 2)
app.post('/orders', async (req, res) => {
  const { product_id, quantity, customer_name } = req.body;

  if (!product_id || !quantity || quantity <= 0 || !customer_name) {
    return res.status(400).json({ error: 'Données de commande invalides' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO orders (product_id, quantity, customer_name) VALUES ($1, $2, $3) RETURNING *',
      [product_id, quantity, customer_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
});

module.exports = app;