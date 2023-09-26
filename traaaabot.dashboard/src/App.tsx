import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { CategoryPage } from './pages/categorypage';
import { GuildPrefixPage } from './pages/guildprefixpage';
import { HomePage } from './pages/homepage';
import { MenuPage } from './pages/menupage';
import { WelcomeMessagePage } from './pages/welcomemessagepage';
import { GuildContext } from './utils/contexts/GuildContext';
import { AppBar } from './components/AppBar';
import NotFound from './components/notfound';

function App() {
  const [guildId, setGuildId] = useState('');
  const updateGuildId = (id: string) => setGuildId(id);
  return (
    <GuildContext.Provider value={{ guildId, updateGuildId }}>
      <Routes>
        <Route path="/traaaabot/dashboard/*" element={<AppBar />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/traaaabot/dashboard/menu" element={<MenuPage />} />
        <Route path="/traaaabot/dashboard/categories" element={<CategoryPage />} />
        <Route path="/traaaabot/dashboard/prefix" element={<GuildPrefixPage />} />
        <Route path="/traaaabot/dashboard/message" element={<WelcomeMessagePage />} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </GuildContext.Provider>
  );
}

export default App;
