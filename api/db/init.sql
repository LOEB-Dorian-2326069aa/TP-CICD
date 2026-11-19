-- Création des tables de base
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 10 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    customer_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Génération de 1 200 produits initiaux (uniquement si la table est vide)
INSERT INTO products (name, category, price, stock)
SELECT
    'Produit Fermier #' || i AS name,
    CASE (i % 5)
        WHEN 0 THEN 'Fruits & Légumes'
        WHEN 1 THEN 'Boulangerie'
        WHEN 2 THEN 'Viandes & Charcuterie'
        WHEN 3 THEN 'Épicerie Fine'
        ELSE 'Boissons Artisanales'
    END AS category,
    ROUND((2.50 + (i % 45) * 1.15)::numeric, 2) AS price,
    (i % 25) + 1 AS stock
FROM generate_series(1, 1200) AS i
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);