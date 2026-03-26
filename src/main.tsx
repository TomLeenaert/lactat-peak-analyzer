import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);

const renderStartupError = () => {
  root.render(
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-center space-y-3">
        <h1 className="text-2xl font-bold font-headline">App kon niet opstarten</h1>
        <p className="text-sm text-muted-foreground">
          Er ontbreekt configuratie voor de backend of er ging iets mis tijdens het laden.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
};

import("./App.tsx")
  .then(({ default: App }) => {
    root.render(<App />);
  })
  .catch((error) => {
    console.error("[Startup Error]", error);
    renderStartupError();
  });
