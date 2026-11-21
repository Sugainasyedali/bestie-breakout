"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main>
      <h1>Arcade hiccup!</h1>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
