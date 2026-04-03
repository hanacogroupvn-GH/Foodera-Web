import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Bản đồ Việt Nam sau sáp nhập",
  description: "Bản đồ lãnh thổ Việt Nam sau sáp nhập 34 tỉnh, thành với lớp nền thế giới và phân vùng tương tác.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
