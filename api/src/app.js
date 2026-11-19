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

// Route POST /orders : enregistre une commande, vérifie le stock en transaction avant de valider la commande 
app.post('/orders', async (req, res) => {
  const { product_id, quantity, customer_name } = req.body;

  if (!product_id || !Number.isInteger(quantity) || quantity <= 0 || !customer_name) {
    return res.status(400).json({
      error: 'Données de commande invalides (product_id, quantity > 0 et customer_name requis).',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verrouillage de la ligne produit pour éviter les ventes concurrentes au-delà du stock
    const productRes = await client.query(
      'SELECT id, name, stock FROM products WHERE id = $1 FOR UPDATE',
      [product_id]
    );

    if (productRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Produit #${product_id} introuvable.` });
    }

    const product = productRes.rows[0];

    if (product.stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Stock insuffisant pour "${product.name}" : ${quantity} demandé(s), mais seulement ${product.stock} disponible(s).`,
        available_stock: product.stock,
      });
    }

    // Décrémentation du stock
    const updatedProduct = await client.query(
      'UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock',
      [quantity, product_id]
    );

    // Enregistrement de la commande
    const orderRes = await client.query(
      'INSERT INTO orders (product_id, quantity, customer_name) VALUES ($1, $2, $3) RETURNING *',
      [product_id, quantity, customer_name]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      order: orderRes.rows[0],
      remaining_stock: updatedProduct.rows[0].stock,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: 'Erreur lors du traitement de la commande.' });
  } finally {
    client.release();
  }
});

module.exports = app;