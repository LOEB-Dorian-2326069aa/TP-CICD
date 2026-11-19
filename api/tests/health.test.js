const { test, describe } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

describe('Tests de base de l’API', () => {
  test('GET /health renvoie 200 et les métadonnées de version', async () => {
    const server = app.listen(0);
    const port = server.address().port;

    try {
      const response = await fetch(`http://localhost:${port}/health`);
      const body = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.status, 'ok');
      assert.ok(body.version);
    } finally {
      server.close();
    }
  });
});