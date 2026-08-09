export const metadata = {
  title: "RafaSwing",
  description: "Swing trading & investment platform",
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
