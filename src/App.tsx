import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuctionProvider } from './context/AuctionContext';
import { NotificationProvider } from './context/NotificationContext';
import { DemoBanner } from './components/layout/DemoBanner';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { AuctionDetailPage } from './pages/AuctionDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SavedSearchesPage } from './pages/SavedSearchesPage';
import { AuthPage } from './pages/AuthPage';

export function App() {
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  return (
    <AuthProvider>
      <NotificationProvider>
        <AuctionProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-surface-50 font-sans">
              <DemoBanner />
              <Header onOpenAIAssistant={() => setAiAssistantOpen(true)} />

              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage onOpenAI={() => setAiAssistantOpen(true)} />} />
                  <Route path="/marketplace" element={<MarketplacePage />} />
                  <Route path="/auctions/:id" element={<AuctionDetailPage />} />
                  <Route path="/create" element={<CreateListingPage />} />
                  <Route path="/dashboard" element={<StudentDashboardPage />} />
                  <Route path="/seller" element={<SellerDashboardPage />} />
                  <Route path="/saved-searches" element={<SavedSearchesPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                </Routes>
              </main>

              <Footer />

              <AIAssistantDrawer
                isOpen={aiAssistantOpen}
                onClose={() => setAiAssistantOpen(false)}
              />
            </div>
          </BrowserRouter>
        </AuctionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
