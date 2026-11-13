'use client';

export function GameLoadError() {
  return (
    <main className="min-h-full flex flex-col items-center justify-center p-4 gap-4">
      <p role="alert">Could not load the round. Please try again.</p>
      <button className="btn-gradient rounded-xl px-5 py-3" onClick={() => window.location.reload()}>
        Try Again
      </button>
    </main>
  );
}
