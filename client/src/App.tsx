import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";
import ConfigPage from "./pages/ConfigPage";
import RedefinirSenhaPage from "./pages/resetsenha";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/resetsenha" element={<RedefinirSenhaPage />} />
      </Routes>
    </BrowserRouter>
  );
}