import { Link, Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import StarRainClick from "@/components/StarRainClick";
import ReferralCapture from "@/components/ReferralCapture";

export default function SiteLayout() {
  return (
    <div className="galaxy galaxy-bg relative min-h-screen flex flex-col">
      <div aria-hidden="true" className="starfield pointer-events-none absolute inset-0 animate-twinkle opacity-60" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <ChatbotWidget />
      <StarRainClick />
      <ReferralCapture />
    </div>
  );
}