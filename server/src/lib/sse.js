// In-memory registry of connected admin SSE clients.
// Lives for the lifetime of the server process — fine for a single-instance deployment.
const clients = new Set();

export function addSseClient(res) {
  clients.add(res);
}

export function removeSseClient(res) {
  clients.delete(res);
}

export function broadcastToAdmins(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of [...clients]) {
    try {
      client.write(payload);
    } catch {
      // Client already gone
      clients.delete(client);
    }
  }
}
