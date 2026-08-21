import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { TopNav, BottomNav } from '@/components/layout';
import CommunityChat from '@/components/community-chat';

export default function Chat() {
  return (
    <div className="flex flex-col h-[100dvh]">
      <TopNav backTo="/" title="CHAT" />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl mx-auto my-auto pb-10 flex flex-col items-center">
          <CommunityChat />
          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-foreground/50 hover:text-primary transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}