const { test, describe, mock } = require('node:test');
const assert = require('node:assert');
const { Pool } = require('pg');
const app = require('../src/app');

describe('Validation du stock à la commande (POST /orders)', () => {
  test('Refuse une commande qui dépasse le stock disponible (HTTP 409 + message clair)', async () => {
    const fakeClient = {
      query: async (sql) => {
        if (sql.includes('SELECT id, name, stock')) {
          return { rowCount: 1, rows: [{ id: 1, name: 'Tomates Bio', stock: 3 }] };
        }
        return { rowCount: 0, rows: [] };
      },
      release: () => {},
    };

    const connectMock = mock.method(Pool.prototype, 'connect', async () => fakeClient);
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://localhost:${port}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: 1, quantity: 10, customer_name: 'Restaurant Le Port' }),
      });
      const body = await response.json();

      assert.strictEqual(response.status, 409);
      assert.match(body.error, /Stock insuffisant.*Tomates Bio.*10 demandé\(s\).*3 disponible\(s\)/i);
      assert.strictEqual(body.available_stock, 3);
    } finally {
      server.close();
      connectMock.mock.restore();
    }
  });
});

