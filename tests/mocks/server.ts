import { setupServer } from "msw/node";
import { frankfurterHandlers } from "./handlers/frankfurter";

// Create MSW server with all handlers
export const server = setupServer(...frankfurterHandlers);

// Start/stop server for tests
export function setupMswServer() {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: "warn" });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });
}
