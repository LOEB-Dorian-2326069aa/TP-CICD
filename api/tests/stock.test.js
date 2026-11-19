const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

describe('Gestion du stock producteur (PATCH /products/:id/stock)', () => {
  test('Refuse un stock négatif avec une erreur 400 claire', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://localhost:${port}/products/1/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: -5 }),
      });
      const body = await response.json();

      assert.strictEqual(response.status, 400);
      assert.match(body.error, /entier positif ou nul/i);
    } finally {
      server.close();
    }
  });
});