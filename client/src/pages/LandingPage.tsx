import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
import mammoth from "mammoth";
import { sendLandingPageMessage } from "../api";

const ACCEPTED_FORMATS = ".pdf,.txt";

type Arquivo = { nome: string; url: string };
type Conversa = { id: string; nome: string };
type Mensagem = { autor: 'user' | 'bot'; texto: string };

export default function LandingPage() {
  const [headerColor, setHeaderColor] = useState("#fff");
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [arquivos, setArquivos] = useState<Arquivo[]>(() => {
    const saved = sessionStorage.getItem("arquivos");
    return saved ? JSON.parse(saved) : [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Para menu de opções dos arquivos
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Estado para conversas
  const [conversas, setConversas] = useState<Conversa[]>(() => {
    const saved = sessionStorage.getItem("conversas");
    return saved ? JSON.parse(saved) : [];
  });
  const [menuConversaAberto, setMenuConversaAberto] = useState<string | null>(null);
  const [menuConversaPos, setMenuConversaPos] = useState<{ top: number; left: number } | null>(null);
  const conversaMenuRef = useRef<HTMLDivElement>(null);
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => {
    const saved = sessionStorage.getItem("mensagens");
    return saved ? JSON.parse(saved) : [];
  });
  const [inputMensagem, setInputMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputMensagemRef = useRef<HTMLInputElement>(null);
  const mensagensEndRef = useRef<HTMLDivElement>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<string | null>(() => {
    const saved = sessionStorage.getItem("arquivoSelecionado");
    return saved || null;
  });
  // Estado do modal de tema
  const [showTemaModal, setShowTemaModal] = useState(false);
  const [temaSelecionado, setTemaSelecionado] = useState<string | null>(null);

  // Mapeamento de cor do header para cada tema
  const headerCores: Record<string, string> = {
    "Marinha": "#e5e5e5",
    "Exército": "#4d5c2b",
    "Aeronáutica": "#305a91",
    "Polícia": "#666666",
    "Bombeiro": "#b08c3e"
  };

  const temas = [
    { nome: "Marinha", cor: "#e5e5e5", borda: "#bbb" },
    { nome: "Exército", cor: "#4d5c2b", borda: "#0d47a1" },
    { nome: "Aeronáutica", cor: "#305a91", borda: "#2e7d32" },
    { nome: "Polícia", cor: "#666666", borda: "#c62828" },
    { nome: "Bombeiro", cor: "#b08c3e", borda: "#f57f17" },
  ];

  // Salva arquivos, conversas e mensagens na sessionStorage
  useEffect(() => {
    sessionStorage.setItem("arquivos", JSON.stringify(arquivos));
  }, [arquivos]);
  useEffect(() => {
    sessionStorage.setItem("conversas", JSON.stringify(conversas));
  }, [conversas]);
  useEffect(() => {
    if (conversaAtiva) {
      sessionStorage.setItem(`mensagens_${conversaAtiva}`, JSON.stringify(mensagens));
    }
  }, [mensagens, conversaAtiva]);
  useEffect(() => {
    if (arquivoSelecionado) {
      sessionStorage.setItem("arquivoSelecionado", arquivoSelecionado);
    } else {
      sessionStorage.removeItem("arquivoSelecionado");
    }
  }, [arquivoSelecionado]);

  // Limpa tudo ao fechar/atualizar a aba
  useEffect(() => {
    const clearSession = () => {
      sessionStorage.removeItem("arquivos");
      sessionStorage.removeItem("conversas");
      sessionStorage.removeItem("arquivoSelecionado");
      // Remove todas as mensagens das conversas
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith("mensagens_")) {
          sessionStorage.removeItem(key);
        }
      });
    };
    window.addEventListener("beforeunload", clearSession);
    return () => window.removeEventListener("beforeunload", clearSession);
  }, []);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAberto(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fecha o menu de conversa ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (conversaMenuRef.current && !conversaMenuRef.current.contains(event.target as Node)) {
        setMenuConversaAberto(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Efeito para rolagem automática
  useEffect(() => {
    if (mensagensEndRef.current) {
      mensagensEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens]);

  // Funções de arquivos
  function handleFileClick() {
    setShowDocMenu(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    const file = files[0];
    const allowedExtensions = [".pdf", ".txt"];
    const fileExtension = file.name.includes(".") ? "." + file.name.split(".").pop()?.toLowerCase() : "";
    if (!allowedExtensions.includes(fileExtension)) {
      alert("Só é permitido enviar arquivos .PDF ou .TXT.");
      setLoading(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setArquivos(prev => {
        const novosArquivos = [...prev, { nome: file.name, url }];
        return novosArquivos;
      });
      
      // Aguarda um pequeno delay para garantir que o estado seja atualizado, 
      // então seleciona e processa automaticamente o novo arquivo
      setTimeout(() => {
        processarArquivoSelecionado(file.name);
      }, 100);
      
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  }

  function handleDelete(nomeArquivo: string) {
    setArquivos(arquivos.filter(a => a.nome !== nomeArquivo));
    if (arquivoSelecionado === nomeArquivo) setArquivoSelecionado(null);
  }

  function handleDownload(url: string, nome: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Funções para conversas
  function handleNovaConversa() {
    const nome = prompt("Nome da nova conversa:");
    if (!nome) return;
    const novaId = Date.now().toString();
    setConversas([{ nome, id: novaId }, ...conversas]);
    setConversaAtiva(novaId);
    const saudacao = { autor: 'bot' as const, texto: 'A princípio é NÃO Militar! Mas diga lá, qual a sua onça?' };
    setMensagens([saudacao]);
  }

  function handleDeleteConversa(id: string) {
    if (!window.confirm("Tem certeza que deseja apagar esta conversa?")) return;
    setConversas(conversas.filter(c => c.id !== id));
    if (conversaAtiva === id) {
      setConversaAtiva(null);
      setMensagens([]);
    }
  }

  function handleDownloadConversa(conversaId: string, nome: string) {
    let conteudo = '';
    if (conversaAtiva === conversaId) {
      conteudo = mensagens.map(m => `${m.autor === 'user' ? 'Você' : 'Bot'}: ${m.texto}`).join('\n');
    } else {
      conteudo = '';
    }
    const blob = new Blob([conteudo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nome || 'conversa'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Função para extrair texto de PDF
  async function extrairTextoPDF(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let texto = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      texto += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return texto;
  }
  // Função para extrair texto de DOCX
  async function extrairTextoDOCX(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }
  // Função para processar arquivo imediatamente quando selecionado
  async function processarArquivoSelecionado(nome: string) {
    setArquivoSelecionado(nome);
    
    // Aguarda um pouco para garantir que os estados estejam sincronizados
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Busca o arquivo nos estados atuais ou no sessionStorage
    const arquivosAtuais = arquivos.length > 0 ? arquivos : JSON.parse(sessionStorage.getItem("arquivos") || "[]");
    const arquivoObj = arquivosAtuais.find((a: any) => a.nome === nome);
    
    console.log("Debug - Processando arquivo:", nome);
    console.log("Debug - Arquivo encontrado:", arquivoObj ? "SIM" : "NÃO");
    
    if (!arquivoObj) return;
    
    let texto = "";
    try {
      if (arquivoObj.url.startsWith("data:application/pdf")) {
        console.log("Debug - Pré-carregando PDF");
        const response = await fetch(arquivoObj.url);
        const blob = await response.blob();
        texto = await extrairTextoPDF(blob);
      } else if (arquivoObj.url.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
        console.log("Debug - Pré-carregando DOCX");
        const response = await fetch(arquivoObj.url);
        const blob = await response.blob();
        texto = await extrairTextoDOCX(blob);
      } else if (arquivoObj.url.startsWith("data:text/plain")) {
        console.log("Debug - Pré-carregando TXT");
        const response = await fetch(arquivoObj.url);
        texto = await response.text();
      } else {
        console.log("Debug - Formato não suportado para pré-carregamento:", arquivoObj.url.substring(0, 50));
        return;
      }
      console.log(`Debug - Arquivo pré-carregado: ${nome} | Tamanho: ${texto.length} caracteres`);
    } catch (e) {
      console.log("Debug - Erro ao pré-carregar arquivo:", e);
    }
  }

  // Função para buscar contexto dos documentos anexos (qualquer formato)
  async function buscarContextoPergunta(): Promise<string | null> {
    // Aguarda mais tempo para garantir que os estados estejam sincronizados
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Tenta novamente se não houver arquivos carregados na primeira tentativa
    const arquivosAtuais: Arquivo[] = arquivos.length > 0 ? arquivos : JSON.parse(sessionStorage.getItem("arquivos") || "[]");
    const arquivoAtualSelecionado = arquivoSelecionado || sessionStorage.getItem("arquivoSelecionado");
    
    console.log("Debug - arquivoSelecionado:", arquivoAtualSelecionado);
    console.log("Debug - arquivos disponíveis:", arquivosAtuais.map((a: Arquivo) => a.nome));
    
    if (!arquivoAtualSelecionado) {
      // Nenhum arquivo selecionado: IA deve pedir para o usuário escolher
      console.log("Debug - Nenhum arquivo selecionado");
      return null;
    }
    // Busca apenas o arquivo selecionado
    const arquivoObj = arquivosAtuais.find((a: Arquivo) => a.nome === arquivoAtualSelecionado);
    console.log("Debug - arquivo encontrado:", arquivoObj ? "SIM" : "NÃO");
    
    if (!arquivoObj) return null;
    // Recupera o arquivo do sessionStorage (DataURL)
    const url = arquivoObj.url;
    let texto = "";
    try {
      if (url.startsWith("data:application/pdf")) {
        console.log("Debug - Processando PDF");
        const response = await fetch(url);
        const blob = await response.blob();
        texto = await extrairTextoPDF(blob);
      } else if (url.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
        console.log("Debug - Processando DOCX");
        const response = await fetch(url);
        const blob = await response.blob();
        texto = await extrairTextoDOCX(blob);
      } else if (url.startsWith("data:text/plain")) {
        console.log("Debug - Processando TXT");
        const response = await fetch(url);
        texto = await response.text();
      } else {
        console.log("Debug - Formato não suportado:", url.substring(0, 50));
        return null;
      }
    } catch (e) {
      console.log("Debug - Erro ao processar arquivo:", e);
      return null;
    }
    console.log("Debug - Texto extraído (primeiros 100 chars):", texto.substring(0, 100));
    return `Arquivo selecionado: ${arquivoObj.nome}\n${texto}`;
  }

  // Função para enviar mensagem para a API de IA
  async function enviarMensagem(mensagemTexto?: string) {
    let mensagensAtualizadas = mensagens;
    
    // Se foi passado um texto de mensagem, adiciona uma nova mensagem do usuário
    if (mensagemTexto?.trim()) {
      const novaMensagem = { autor: 'user' as const, texto: mensagemTexto };
      mensagensAtualizadas = [...mensagens, novaMensagem];
      setMensagens(mensagensAtualizadas);
    }
    
    // Se não há mensagens, não faz nada
    if (mensagensAtualizadas.length === 0) {
      return;
    }
    
    // Se a última mensagem já é do bot, não faz nada (evita loop)
    const ultimaMensagem = mensagensAtualizadas[mensagensAtualizadas.length - 1];
    if (ultimaMensagem.autor === 'bot') {
      return;
    }
    
    setEnviando(true);

    // Monta o histórico para a API
    const historicoApi = mensagensAtualizadas.map(m => ({
      autor: m.autor,
      texto: m.texto
    }));

    // Busca contexto nos documentos
    const contexto = await buscarContextoPergunta();
    console.log("Debug - Contexto retornado:", contexto ? "TEM CONTEXTO" : "SEM CONTEXTO");
    console.log("Debug - Tamanho do contexto:", contexto ? contexto.length : 0);
    
    console.log("Debug - Prompt final sendo enviado para IA:", contexto ? contexto.substring(0, 200) : "SEM CONTEXTO");

    try {
      const respostaIA = await sendLandingPageMessage(historicoApi, contexto);
      const mensagensComBot = [
        ...mensagensAtualizadas,
        { autor: 'bot' as const, texto: respostaIA }
      ];
      setMensagens(mensagensComBot);
    } catch (err) {
      const mensagensComBot = [
        ...mensagensAtualizadas,
        { autor: 'bot' as const, texto: `Erro ao consultar a API de IA: ${err}` }
      ];
      setMensagens(mensagensComBot);
    }
    setEnviando(false);
  }

  // Foca no input após enviar mensagem
  useEffect(() => {
    if (!enviando && inputMensagemRef.current) {
      inputMensagemRef.current.focus();
    }
  }, [enviando]);

  const [menuConfigAberto, setMenuConfigAberto] = useState(false);
  const menuBtnStyle = {
    padding: "12px 18px",
    background: "none",
    border: "none",
    textAlign: "left",
    fontWeight: 500,
    fontSize: 15,
    color: "#222",
    cursor: "pointer",
    outline: "none",
    borderRadius: 0,
    transition: "background 0.2s",
  } as React.CSSProperties;

  function handleEscolherTema(tema: string) {
    setTemaSelecionado(tema);
    setHeaderColor(headerCores[tema] || "#fff");
    // Salva o tema escolhido no localStorage para todas as páginas
    localStorage.setItem("paletaCor", headerCores[tema] || "#fff");
    localStorage.setItem("temaSelecionado", tema);
    setShowTemaModal(false);
  }

  // Carrega cor do tema salvo no localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    const savedTheme = localStorage.getItem("temaSelecionado");
    if (savedColor) {
      setHeaderColor(savedColor);
    }
    if (savedTheme) {
      setTemaSelecionado(savedTheme);
    }
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", background: headerColor, overflow: "hidden" }}>
      {/* Cabeçalho */}
      <header style={{
        width: "100%",
        height: 96,
        background: headerColor,
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/simbolo.png" alt="Logo" style={{ width: 72, height: 72, borderRadius: "50%", marginRight: 14 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>PerguntaProSub</div>
            <div style={{ fontSize: 12, color: "#000" }}>Sistema de IA para o mundo Militar</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 6, padding: "4px 14px", fontWeight: 600, fontSize: 14, cursor: "pointer" }} onClick={() => navigate("/login")}>Entrar</button>
          <div style={{ position: "relative" }}>
            <span
              style={{
                background: "#1976d2",
                color: "#fff",
                borderRadius: "50%",
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 20,
                marginRight: 8,
                cursor: "pointer",
                userSelect: "none"
              }}
              title="Configurações"
              onClick={() => setMenuConfigAberto(v => !v)}
            >
              {/* Ícone de menu com 3 tracinhos horizontais */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            {menuConfigAberto && (
              <div
                style={{
                  position: "fixed",
                  right: 32,
                  top: 90,
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px #0003",
                  zIndex: 9999,
                  minWidth: 180,
                  fontSize: 15,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column"
                }}
                ref={menuRef}
                onClick={e => e.stopPropagation()}
              >
                <button style={menuBtnStyle} onClick={() => { setMenuConfigAberto(false); navigate('/sobre'); }}>Sobre</button>
                <button style={menuBtnStyle} onClick={() => { setMenuConfigAberto(false); navigate('/termos'); }}>Termos de Uso</button>
                <button style={menuBtnStyle} onClick={() => { setMenuConfigAberto(false); navigate('/contato'); }}>Contato</button>
                <button style={menuBtnStyle} onClick={() => { setMenuConfigAberto(false); navigate('/privacidade'); }}>Política de Privacidade</button>
              </div>
            )}
            {/* Fecha o menu ao clicar fora */}
            {menuConfigAberto && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  zIndex: 9998,
                  background: "transparent"
                }}
                onClick={() => setMenuConfigAberto(false)}
              />
            )}
          </div>
        </div>
      </header>
      <div style={{ display: "flex", height: "calc(100vh - 96px)", width: "100vw" }}>
        {/* Sidebar */}
        <aside style={{
          width: 260,
          background: "#fff",
          borderRight: "1px solid #eee",
          padding: 24,
          height: "100%",
          boxSizing: "border-box"
        }}>
          <nav>
            {/* Documentos */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 24, height: 180, overflowY: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>Documentos</span>
                <button
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "4px 14px",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    alert("Atenção: Arquivos criptografados deverão ser descriptografados antes de serem anexados. Só serão aceitos arquivos PDF e TXT (converta para PDF qualquer outro tipo de arquivo para poder anexá-los).");
                    handleFileClick();
                  }}
                  disabled={loading}
                >
                  + Novo
                </button>
              </div>
              {showDocMenu && (
                <div style={{
                  position: "relative",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  boxShadow: "0 2px 8px #0002",
                  zIndex: 100,
                  width: "90%",
                  left: "5%",
                  marginTop: 4,
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}>
                  <button
                    style={{
                      padding: "8px 0",
                      background: "#f7f7f9",
                      border: "none",
                      borderRadius: 4,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    onClick={handleFileClick}
                  >
                    Arquivo
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FORMATS}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 8 }}>
                {arquivos.length === 0 && (
                  <div style={{ color: "#888", fontSize: 13 }}>Nenhum arquivo enviado ainda.</div>
                )}
                {arquivos.map((arq) => (
                  <div key={arq.nome} style={{
                    background: "#f7f7f9",
                    borderRadius: 6,
                    padding: "8px 10px",
                    marginBottom: 6,
                    fontSize: 14,
                    wordBreak: "break-all",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative"
                  }}>
                    <input
                      type="radio"
                      name="arquivo-pesquisa"
                      checked={arquivoSelecionado === arq.nome}
                      onChange={() => processarArquivoSelecionado(arq.nome)}
                      style={{ marginRight: 8 }}
                      title="Selecionar para pesquisa"
                    />
                    <span style={{ color: "#222", flex: 1 }}>
                      {arq.nome}
                    </span>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 22,
                        marginLeft: 8,
                        color: "#555",
                        padding: "0 8px"
                      }}
                      onClick={e => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setMenuAberto(arq.nome);
                        setMenuPos({
                          top: rect.bottom + window.scrollY,
                          left: rect.right + window.scrollX
                        });
                      }}
                      title="Mais opções"
                    >
                      &#8942;
                    </button>
                    {menuAberto === arq.nome && menuPos && (
                      <div
                        ref={menuRef}
                        style={{
                          position: "fixed",
                          left: menuPos.left + 8,
                          top: menuPos.top,
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 6,
                          boxShadow: "0 2px 8px #0002",
                          zIndex: 100,
                          minWidth: 110,
                          fontSize: 13,
                          padding: 0,
                          display: "flex",
                          flexDirection: "column"
                        }}
                      >
                        <button
                          style={{
                            padding: "7px 10px",
                            background: "none",
                            border: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: 13,
                            color: "#222",
                          }}
                          onClick={() => {
                            setMenuAberto(null);
                            setTimeout(() => handleDownload(arq.url, arq.nome), 0);
                          }}
                        >
                          Download
                        </button>
                        <div style={{ borderTop: "1px solid #eee" }} />
                        <button
                          style={{
                            padding: "7px 10px",
                            background: "none",
                            border: "none",
                            textAlign: "left",
                            color: "#d32f2f",
                            fontWeight: 500,
                            fontSize: 13,
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            setMenuAberto(null);
                            setTimeout(() => handleDelete(arq.nome), 0);
                          }}
                        >
                          Apagar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Conversas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600 }}>Conversas</span>
                <button style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 14px",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer"
                }} onClick={handleNovaConversa}>+ Nova</button>
              </div>
              <div style={{ maxHeight: 120, overflowY: "auto", marginTop: 8 }}>
                {conversas.length === 0 ? (
                  <div style={{ color: "#888", fontSize: 13 }}>Nenhuma conversa criada ainda.</div>
                ) : (
                  conversas.map((conversa) => (
                    <div
                      key={conversa.id}
                      style={{
                        background: conversaAtiva === conversa.id ? "#e3eaff" : "#f7f7f9",
                        borderRadius: 6,
                        padding: "8px 10px",
                        marginBottom: 6,
                        fontSize: 14,
                        wordBreak: "break-all",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        position: "relative",
                        cursor: "pointer",
                        border: conversaAtiva === conversa.id ? "1.5px solid #1976d2" : "1px solid #eee"
                      }}
                      onClick={e => {
                        if ((e.target as HTMLElement).closest('button')) return;
                        setConversaAtiva(conversa.id);
                        // Carregar mensagens da conversa
                        const mensagensSalvas = sessionStorage.getItem(`mensagens_${conversa.id}`);
                        if (mensagensSalvas) {
                          setMensagens(JSON.parse(mensagensSalvas));
                        } else {
                          setMensagens([]);
                        }
                      }}
                    >
                      <span style={{ color: "#222", flex: 1 }}>{conversa.nome}</span>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 22,
                          marginLeft: 8,
                          color: "#555",
                          padding: "0 8px"
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setMenuConversaAberto(conversa.id);
                          setMenuConversaPos({
                            top: rect.bottom + window.scrollY,
                            left: rect.right + window.scrollX
                          });
                        }}
                        title="Mais opções"
                      >
                        &#8942;
                      </button>
                      {menuConversaAberto === conversa.id && menuConversaPos && (
                        <div
                          ref={conversaMenuRef}
                          style={{
                            position: "fixed",
                            left: menuConversaPos.left + 8,
                            top: menuConversaPos.top,
                            background: "#fff",
                            border: "1px solid #ddd",
                            borderRadius: 6,
                            boxShadow: "0 2px 8px #0002",
                            zIndex: 100,
                            minWidth: 110,
                            fontSize: 13,
                            padding: 0,
                            display: "flex",
                            flexDirection: "column"
                          }}
                        >
                          <button
                            style={{
                              padding: "7px 10px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontWeight: 500,
                              fontSize: 13,
                              color: "#222",
                              cursor: "pointer"
                            }}
                            onClick={() => {
                              setMenuConversaAberto(null);
                              setTimeout(() => handleDownloadConversa(conversa.id, conversa.nome), 0);
                            }}
                          >
                            Download
                          </button>
                          <div style={{ borderTop: "1px solid #eee" }} />
                          <button
                            style={{
                              padding: "7px 10px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontWeight: 500,
                              fontSize: 13,
                              color: "#d32f2f",
                              cursor: "pointer"
                            }}
                            onClick={() => {
                              setMenuConversaAberto(null);
                              setTimeout(() => handleDeleteConversa(conversa.id), 0);
                            }}
                          >
                            Apagar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </nav>
        </aside>
        {/* Main Content */}
        <main
          style={{
            flex: 1,
            height: "100%",
            background: "#f7f7f9",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            overflowY: "auto",
            paddingRight: 48,
          }}
        >
          {/* Campo inicial estilo ChatGPT */}
          {!conversaAtiva && (
            <div style={{ width: "100%", maxWidth: 700, margin: "0 auto", padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1976d2", marginBottom: 16 }}>Pergunte algo para o Sub</div>
              <form style={{ display: "flex", width: "100%", gap: 8 }} onSubmit={e => {
                e.preventDefault();
                if (!inputMensagem.trim()) return;
                // Cria nova conversa automaticamente
                const novaId = Date.now().toString();
                const nome = `Conversa ${conversas.length + 1}`;
                setConversas([{ nome, id: novaId }, ...conversas]);
                setConversaAtiva(novaId);
                const saudacao = { autor: 'bot' as const, texto: 'A princípio é NÃO!rs Mas diga lá, qual a sua onça?' };
                const novaMensagemUsuario = { autor: 'user' as const, texto: inputMensagem };
                const novasMensagens = [saudacao, novaMensagemUsuario];
                setMensagens(novasMensagens);
                setInputMensagem("");
                
                // Chama a função para processar a resposta da IA
                setTimeout(async () => {
                  setEnviando(true);
                  
                  // Monta o histórico para a API
                  const historicoApi = novasMensagens.map(m => ({
                    autor: m.autor,
                    texto: m.texto
                  }));

                  // Busca contexto nos documentos
                  const contexto = await buscarContextoPergunta();
                  console.log("Debug FORM - Contexto retornado:", contexto ? "TEM CONTEXTO" : "SEM CONTEXTO");
                  console.log("Debug FORM - Tamanho do contexto:", contexto ? contexto.length : 0);
                  
                  console.log("Debug FORM - Prompt final sendo enviado para IA:", contexto ? contexto.substring(0, 200) : "SEM CONTEXTO");

                  try {
                    const respostaIA = await sendLandingPageMessage(historicoApi, contexto);
                    setMensagens(prev => [...prev, { autor: 'bot' as const, texto: respostaIA }]);
                  } catch (err) {
                    setMensagens(prev => [...prev, { autor: 'bot' as const, texto: `Erro ao consultar a API de IA: ${err}` }]);
                  }
                  setEnviando(false);
                }, 300);
              }}>
                <input
                  ref={inputMensagemRef}
                  type="text"
                  value={inputMensagem}
                  onChange={e => setInputMensagem(e.target.value)}
                  placeholder="Digite sua pergunta e pressione Enter..."
                  style={{
                    flex: 2, // Dobro da largura
                    padding: "32px 18px", // Dobro da altura
                    borderRadius: 12,
                    border: "1.5px solid #1976d2",
                    fontSize: 18,
                    outline: "none",
                    background: "#fff",
                    color: "#000"
                  }}
                  disabled={enviando}
                />
              </form>
              <div style={{ color: '#888', fontSize: 15, marginTop: 18, textAlign: 'center' }}>
                O PerguntaproSub pode cometer erros. Considere verificar informações importantes.
              </div>
            </div>
          )}
          {conversaAtiva ? (
            <div style={{
              width: "100%",
              maxWidth: 700,
              height: "80vh",
              background: "#f7f7f9",
              borderRadius: 12,
              boxShadow: "0 2px 8px #0001",
              display: "flex",
              flexDirection: "column",
              padding: 24,
              margin: 24,
              overflow: "hidden"
            }}>
              <div style={{ flex: 1, overflowY: "auto", marginBottom: 16 }}>
                {mensagens.length === 0 && (
                  <div style={{ color: "#888", textAlign: "center", marginTop: 40 }}>
                    Inicie a conversa digitando sua pergunta abaixo.
                  </div>
                )}
                {mensagens.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: 18,
                    textAlign: msg.autor === 'user' ? 'right' : 'left'
                  }}>
                    <div style={{
                      display: "inline-block",
                      background: msg.autor === 'user' ? '#1976d2' : '#eee',
                      color: msg.autor === 'user' ? '#fff' : '#222',
                      borderRadius: 8,
                      padding: "10px 16px",
                      maxWidth: 420,
                      fontSize: 15
                    }}>{msg.texto}</div>
                  </div>
                ))}
                <div ref={mensagensEndRef} />
              </div>
              <form style={{ display: "flex", gap: 8 }} onSubmit={e => { e.preventDefault(); if (inputMensagem.trim()) { enviarMensagem(inputMensagem); setInputMensagem(""); } }}>
                <input
                  ref={inputMensagemRef}
                  type="text"
                  value={inputMensagem}
                  onChange={e => setInputMensagem(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontSize: 16,
                    outline: "none"
                  }}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  style={{
                    background: enviando ? "#bbb" : "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0 24px",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: enviando ? "not-allowed" : "pointer"
                  }}
                  disabled={enviando || !inputMensagem.trim()}
                >Enviar</button>
              </form>
            </div>
          ) : (
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{
                fontSize: 48,
                marginBottom: 16,
                opacity: 0.3,
                display: "flex",
                justifyContent: "center"
              }}>
                {/* Ícone ou mensagem inicial */}
              </div>
              <div style={{
                fontSize: 16,
                width: "100%",
                textAlign: "center"
              }}>
                
              </div>
            </div>
          )}
          {/* Rodapé */}
          <footer style={{ width: '100%', textAlign: 'center', color: '#888', fontSize: 15, margin: '32px 0 0 0', position: 'fixed', bottom: 0, left: 0, background: 'transparent' }}>
            
          </footer>
        </main>
      </div>
      {/* Modal de escolha de tema */}
      {showTemaModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.18)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowTemaModal(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              boxShadow: "0 4px 32px #0002",
              padding: "38px 32px 32px 32px",
              minWidth: 540,
              maxWidth: 650,
              width: 600,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative"
            }}
            onClick={e => e.stopPropagation()}
          >
            <img
              src="/simbolo.png"
              alt="Símbolo"
              style={{ width: 120, height: 120, marginBottom: 12, borderRadius: "50%" }}
            />
            <div style={{ fontWeight: 700, fontSize: 32, color: "#000", marginBottom: 0, textAlign: "center" }}>PerguntaProSub</div>
            <div style={{ height: 12 }} />
            <div style={{ color: "#000", fontWeight: 500, marginBottom: 8, fontSize: 18, textAlign: "center" }}>
              Tá na onça né Boysinho?
            </div>
            <div style={{ color: "#000", marginBottom: 24, fontSize: 14, textAlign: "center" }}>
              A primeira Inteligência Artificial voltada para o Universo Militar!
            </div>
            <div style={{ fontWeight: 600, marginBottom: 12, color: "#000" }}>Escolha seu tema:</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 8 }}>
              {temas.map((t) => (
                <div key={t.nome} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <button
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      border: temaSelecionado === t.nome ? `3px solid ${t.borda}` : `2px solid #bbb`,
                      background: t.cor,
                      cursor: "pointer",
                      marginBottom: 6,
                      boxShadow: "0 1px 4px #0001",
                      outline: "none",
                      transition: "border 0.2s"
                    }}
                    onClick={() => handleEscolherTema(t.nome)}
                    title={t.nome}
                  />
                  <span style={{ color: "#222", fontSize: 15, fontWeight: 500, textAlign: "center", marginTop: 2 }}>{t.nome}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
