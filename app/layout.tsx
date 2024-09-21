// /app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWalletProvider from "./components/AppWalletProvider";
// import { CanvasWalletProvider } from "./components/CanvasWalletProvider";
// import Container from "./components/Container";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Claim Your Sol - Quagmire.Best- Solana区块链创建服务工具-create solana token-Solana Tools",
  description: "Claim Your Sol - Quagmire.Best- Solana区块链创建服务工具-create solana token-Solana Tools",
  // openGraph: {
  //   title: "Claim Your Sol - QuagmireTools- Solana区块链创建服务工具-create solana token-Solana Tools",
  //   description: "Claim Your Sol - QuagmireTools- Solana区块链创建服务工具-create solana token-Solana Tools",
  //   type: "website",
  //   url: "",
  //   images: "https://pbs.twimg.com/media/GUhxBcIXIAABTbx?format=jpg&name=large"
  // },
  other: {
    "dscvr:canvas:version": "vNext",

  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppWalletProvider>
          {/* <CanvasWalletProvider> */}
          {/* <Container> */}
            {children}
          {/* </Container> */}
        {/* </CanvasWalletProvider> */}
      </AppWalletProvider>
        </body>
    </html>
  );
}
