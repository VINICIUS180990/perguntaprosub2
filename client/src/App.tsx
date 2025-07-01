import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import MenuPage from "./pages/MenuPage";
import RedefinirSenhaPage from "./pages/resetsenha";
import ChatPage from "./pages/ChatPage";
import ContatoPage from "./pages/ContatoPage";
import PrivacidadePage from "./pages/PrivacidadePage";
import SobrePage from "./pages/SobrePage";
import TermosPage from "./pages/TermosPage";
import InicialPage from "./pages/InicialPage";
import LandingPage from "./pages/LandingPage";
import ExcluirContaPage from "./pages/ExcluirContaPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InicialPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/config" element={<MenuPage />} />
        <Route path="/resetsenha" element={<RedefinirSenhaPage />} />
        <Route path="/excluir-conta" element={<ExcluirContaPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/contato" element={<ContatoPage />} />
        <Route path="/privacidade" element={<PrivacidadePage />} />
        <Route path="/sobre" element={<SobrePage />} />
        <Route path="/termos" element={<TermosPage />} />
      </Routes>
    </BrowserRouter>
  );
}