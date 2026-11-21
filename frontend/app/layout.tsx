import "./style.css";
export const metadata = {
  title: "Bestie Breakout • Co-op Arcade",
  description: "Six ridiculous missions for two best friends.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
