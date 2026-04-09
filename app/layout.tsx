import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";

import "./globals.css";

import { AppChrome } from "@/components/app-chrome";
import { AnalyticsTracker } from "@/components/analytics-tracker";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
  adjustFontFallback: false
});

const siteUrl = (process.env.APP_URL?.trim().replace(/\/$/, "") || "https://sejulachim.studiobyyou.kr");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "세줄아침 — 매일 아침 세 줄로 읽는 생활 브리핑",
    template: "%s | 세줄아침"
  },
  description: "건강, 돈, 실생활, 뉴스, 관계 소식을 매일 아침 세 줄로 압축해 전해드려요. 바쁜 아침, 세줄아침으로 하루를 시작하세요.",
  applicationName: "세줄아침",
  keywords: [
    "세줄아침",
    "아침 브리핑",
    "뉴스 요약",
    "생활 뉴스",
    "이메일 뉴스레터",
    "한국어 브리핑",
    "관심사 뉴스",
    "건강 뉴스",
    "경제 뉴스",
    "혈압 관리",
    "연금 수급",
    "생활 정보",
    "건강 정보",
    "재테크",
    "뉴스레터"
  ],
  authors: [{ name: "Studio by You" }],
  creator: "Studio by You",
  publisher: "Studio by You",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    siteName: "세줄아침",
    title: "세줄아침",
    description: "건강, 돈, 실생활, 뉴스, 관계 소식을 세 줄로 압축해 전하는 한국어 아침 브리핑 서비스",
    images: [
      {
        url: "/sejulachim-seo.jpg",
        width: 1200,
        height: 630,
        alt: "세줄아침 서비스 소개 이미지"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "세줄아침",
    description: "생활에 바로 닿는 소식을 세 줄로 압축해 전하는 한국어 아침 브리핑 서비스",
    images: ["/sejulachim-seo.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: "/threeline_morning_symbol.png"
  },
  verification: {
    google: 'RJeLguopnLdgGK9yjx7chUrkYFyz0iRu6-XnUP6eQWE',
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY?.trim() ?? "";

  return (
    <html lang="ko" className="font-medium">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var s=localStorage.getItem("fontSize");document.documentElement.classList.remove("font-small","font-medium","font-large");document.documentElement.classList.add("font-"+(s==="small"||s==="large"||s==="medium"?s:"medium"));}catch(e){}` }} />
      </head>
      <body className={notoSansKr.className} data-kakao-key={kakaoKey}>
        <div className="flex min-h-screen flex-col">
          <AppChrome slot="top" />
          <main className="flex-1">{children}</main>
          <AppChrome slot="bottom" />
        </div>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
