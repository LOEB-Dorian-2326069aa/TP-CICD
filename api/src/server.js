const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API démarrée sur le port ${PORT} (version: ${process.env.APP_VERSION || 'v0.1.0'})`);
});