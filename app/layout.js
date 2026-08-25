export const metadata = {
  title: "TradeIQ",
  description: "AI-Powered Trading — swing trading & investment platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="kk">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
