import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "TanggalTua - Kelola Keuangan dengan Mudah dan Hemat",
  description: "Kelola keuangan dengan mudah dan lebih hemat",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50">
        {children}
      </body>
    </html>
  );
}

