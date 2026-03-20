const { WebSocketServer } = require('ws');

let wss = null;

function sendJson(client, payload) {
  if (!client || client.readyState !== 1) return;
  try {
    client.send(JSON.stringify(payload));
  } catch {
    // ignore send errors
  }
}

function broadcast(payload) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    sendJson(client, payload);
  });
}

function initAlgoritmoWs(server) {
  wss = new WebSocketServer({
    server,
    path: '/ws/algoritmo',
  });

  wss.on('connection', (socket) => {
    sendJson(socket, {
      type: 'connected',
      payload: { message: 'Canal de progreso del algoritmo conectado' },
    });
  });

  return wss;
}

module.exports = {
  initAlgoritmoWs,
  broadcast,
};
