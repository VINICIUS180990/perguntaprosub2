import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
import mammoth from "mammoth";
import { 
  sendOptimizedMainPageMessage, 
  MAIN_PAGE_SYSTEM_PROMPT,
  debugOptimizedSystem,
  clearOptimizedCache
} from "../api";

// Hook customizado para verificar conversas não lidas
function useConversasNaoLidas() {
  const [temConversasNaoLidas, setTemConversasNaoLidas] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Buscar ID do usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
    });
  }, []);

  // Verificar mensagens não lidas
  useEffect(() => {
    if (!userId) return;

    async function verificarMensagensNaoLidas() {
      // Busca se existe pelo menos uma mensagem não lida para o usuário logado
      const { data } = await supabase
        .from('mensagens')
        .select('id')
        .eq('destinatario_id', userId)
        .or('lida_por.is.null,lida_por.not.cs.{"' + userId + '"}')
        .limit(1);
      
      setTemConversasNaoLidas(!!(data && data.length > 0));
    }

    verificarMensagensNaoLidas();

    // Configurar subscription para atualizações em tempo real
    const subscription = supabase
      .channel('mensagens-nao-lidas-main')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensagens',
          filter: `destinatario_id=eq.${userId}`
        },
        () => {
          verificarMensagensNaoLidas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return temConversasNaoLidas;
}

const ACCEPTED_FORMATS = ".pdf,.txt";

type Arquivo = { nome: string; url: string; originalName?: string };
// Tipo para Conversa
 type Conversa = { id: string; nome: string };

export default function MainPage() {
  const [headerColor, setHeaderColor] = useState("#fff");
  const [showDocMenu, setShowDocMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const temConversasNaoLidas = useConversasNaoLidas();

  // Para menu de opções dos arquivos
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Estado para conversas
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversasCarregando, setConversasCarregando] = useState(true);
  const [menuConversaAberto, setMenuConversaAberto] = useState<string | null>(null);
  const [menuConversaPos, setMenuConversaPos] = useState<{ top: number; left: number } | null>(null);
  const conversaMenuRef = useRef<HTMLDivElement>(null);

  // Estado para conversa ativa e mensagens
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<{ autor: 'user' | 'bot'; texto: string }[]>([]);
  const [inputMensagem, setInputMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const inputMensagemRef = useRef<HTMLInputElement>(null);

  // Ref para rolagem automática
  const mensagensEndRef = useRef<HTMLDivElement>(null);

  // Estado para menu do usuário
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [menuUsuarioPos, setMenuUsuarioPos] = useState<{ top: number; left: number } | null>(null);

  // Estado para arquivo selecionado para pesquisa
  const [arquivoSelecionado, setArquivoSelecionado] = useState<string | null>(null);

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

  // Fecha o menu do usuário ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuUsuarioAberto) {
        const menu = document.getElementById('menu-usuario');
        if (menu && !menu.contains(event.target as Node)) {
          setMenuUsuarioAberto(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuUsuarioAberto]);

  // Busca arquivos do bucket do usuário
  async function fetchArquivos() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    // Lista arquivos na pasta do usuário
    const { data, error } = await supabase
      .storage
      .from("documentos")
      .list(`${user.id}/`, { limit: 100 });

    if (error) {
      setArquivos([]);
      return;
    }

    const lista = (data || []).map((file: any) => {
      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(`${user.id}/${file.name}`);
      // Remove o timestamp do FINAL do nome para exibir
      const nomeOriginal = file.name.replace(/_(\d{10,})((\.[^.]*)?)$/, "$2").replace(/^\d+_/, "");
      return {
        nome: nomeOriginal,
        url: urlData.publicUrl,
        originalName: file.name,
      };
    });
    setArquivos(lista);
  }

  // Excluir arquivo do Supabase Storage
  async function handleDelete(nomeArquivo: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    const filePath = `${user.id}/${nomeArquivo}`;
    const { error } = await supabase.storage.from("documentos").remove([filePath]);
    if (error) {
      alert("Erro ao excluir arquivo! " + error.message);
      return;
    }
    await fetchArquivos();
  }

  // Download do arquivo
  async function handleDownload(nomeArquivo: string, nomeExibicao: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    const filePath = `${user.id}/${encodeURIComponent(nomeArquivo)}`;
    const { data, error } = await supabase.storage.from("documentos").download(filePath);
    if (error || !data) {
      alert("Erro ao baixar arquivo!");
      return;
    }
    // Cria um link temporário para download
    const url = window.URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeExibicao;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  }

  // Upload de arquivo para o Supabase Storage
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      alert("Usuário não autenticado!");
      setLoading(false);
      return;
    }

    const file = files[0];
    // Verifica extensão permitida
    const allowedExtensions = [".pdf", ".txt"];
    const fileExtension = file.name.includes(".") ? "." + file.name.split(".").pop()?.toLowerCase() : "";
    if (!allowedExtensions.includes(fileExtension)) {
      alert("Só é permitido enviar arquivos .PDF ou .TXT.");
      setLoading(false);
      return;
    }
    // Adiciona timestamp no FINAL do nome do arquivo antes da extensão
    const fileBaseName = file.name.replace(fileExtension, "");
    const filePath = `${user.id}/${fileBaseName}_${Date.now()}${fileExtension}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(filePath, file);

    if (uploadError) {
      alert("Erro ao enviar arquivo! Verifique se o bucket 'documentos' existe e se o arquivo não tem o mesmo nome de outro já enviado.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setShowDocMenu(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    await fetchArquivos(); // Atualiza a lista
    
    // Aguarda um pequeno delay para garantir que o estado seja atualizado, 
    // então seleciona e processa automaticamente o novo arquivo
    setTimeout(async () => {
      // Aguarda um pouco mais para garantir que fetchArquivos tenha terminado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Força um novo carregamento dos arquivos para garantir que o estado esteja atualizado
      await fetchArquivos();
      
      // Aguarda mais um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Busca o arquivo pelo nome original (sem timestamp) ou pelo originalName
      const nomeArquivoSemTimestamp = file.name;
      const nomeArquivoComTimestamp = filePath.split('/').pop();
      
      // Busca em uma nova consulta aos arquivos atualizados
      const { data: userData2 } = await supabase.auth.getUser();
      const user2 = userData2?.user;
      if (!user2) return;
      
      const { data: filesData } = await supabase.storage.from("documentos").list(`${user2.id}/`, { limit: 100 });
      if (!filesData) return;
      
      const arquivoRecemAdicionado = filesData.find(f => f.name === nomeArquivoComTimestamp);
      
      if (arquivoRecemAdicionado) {
        const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(`${user2.id}/${arquivoRecemAdicionado.name}`);
        console.log("Debug - Arquivo encontrado para processamento:", nomeArquivoSemTimestamp);
        processarArquivoSelecionado(urlData.publicUrl);
      } else {
        console.log("Debug - Arquivo não encontrado para processamento automático");
      }
    }, 1000);
  }

  function handleFileClick() {
    setShowDocMenu(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
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
    salvarConversaNoSupabase(novaId, nome, [saudacao]);
  }

  async function handleDeleteConversa(id: string) {
    if (!window.confirm("Tem certeza que deseja apagar esta conversa?")) return;
    setConversas(conversas.filter(c => c.id !== id));
    // Remover do Supabase
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    const arquivoJson = `conversa-${id}.json`;
    const arquivoTxt = `conversa-${id}.txt`;
    await supabase.storage.from("conversas").remove([
      `${user.id}/${arquivoJson}`,
      `${user.id}/${arquivoTxt}`
    ]);
  }

  // Função para salvar conversa no Supabase Storage
  async function salvarConversaNoSupabase(conversaId: string, nome: string, mensagens: { autor: 'user' | 'bot'; texto: string }[]) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.log('[LOG] Usuário não autenticado ao tentar salvar conversa.');
      return;
    }
    const arquivoJson = `conversa-${conversaId}.json`;
    const blobJson = new Blob([
      JSON.stringify({ nome, mensagens }, null, 2)
    ], { type: "application/json" });
    const { error: errorJson } = await supabase.storage.from("conversas").upload(`${user.id}/${arquivoJson}`, blobJson, { upsert: true, contentType: "application/json" });
    if (errorJson) {
      alert("Erro ao atualizar o arquivo JSON da conversa: " + errorJson.message);
      console.log('[LOG] Erro ao atualizar .json:', errorJson.message);
    } else {
      console.log('[LOG] Arquivo .json atualizado com sucesso:', arquivoJson);
    }

    // Salvar também como .txt para contexto legível
    const arquivoTxt = `conversa-${conversaId}.txt`;
    const conteudoTxt = mensagens.map(m => `${m.autor === 'user' ? 'Você' : 'Bot'}: ${m.texto}`).join('\n');
    const blobTxt = new Blob([conteudoTxt], { type: "text/plain" });
    const { error: errorTxt } = await supabase.storage.from("conversas").upload(`${user.id}/${arquivoTxt}`, blobTxt, { upsert: true, contentType: "text/plain" });
    if (errorTxt) {
      alert("Erro ao atualizar o arquivo de texto da conversa: " + errorTxt.message);
      console.log('[LOG] Erro ao atualizar .txt:', errorTxt.message);
    } else {
      console.log('[LOG] Arquivo .txt atualizado com sucesso:', arquivoTxt);
    }
  }

  // Função para carregar conversas do Supabase Storage
  async function carregarConversasDoSupabase() {
    setConversasCarregando(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setConversas([]);
      setConversasCarregando(false);
      return;
    }
    const { data, error } = await supabase.storage.from("conversas").list(`${user.id}/`, { limit: 100 });
    if (error || !data) {
      setConversas([]);
      setConversasCarregando(false);
      return;
    }
    const novasConversas: Conversa[] = [];
    for (const file of data) {
      if (!file.name.endsWith('.json')) continue;
      const { data: fileData, error: fileError } = await supabase.storage.from("conversas").download(`${user.id}/${file.name}`);
      if (fileError || !fileData) continue;
      try {
        const json = await fileData.text();
        const obj = JSON.parse(json);
        novasConversas.push({ id: file.name.replace('conversa-', '').replace('.json', ''), nome: obj.nome });
      } catch {}
    }
    setConversas(novasConversas);
    setConversasCarregando(false);
  }

  // Função para carregar mensagens da conversa
  async function carregarMensagensDaConversa(conversaId: string) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    const arquivo = `conversa-${conversaId}.json`;
    const { data: fileData, error } = await supabase.storage.from("conversas").download(`${user.id}/${arquivo}?t=${Date.now()}`);
    if (error || !fileData) {
      setMensagens([]);
      return;
    }
    try {
      const json = await fileData.text();
      const obj = JSON.parse(json);
      setMensagens(obj.mensagens || []);
    } catch {
      setMensagens([]);
    }
  }

  // Busca cor do tema e arquivos ao carregar
  useEffect(() => {
    const savedColor = localStorage.getItem("paletaCor");
    setHeaderColor(savedColor || "#fff");

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = "/";
      } else {
        await fetchArquivos();
        carregarConversasDoSupabase();
      }
    });
  }, []);

  // Efeito para rolagem automática
  useEffect(() => {
    if (mensagensEndRef.current) {
      mensagensEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensagens]);

  // Removido: useEffect que salvava conversa automaticamente ao mudar mensagens/conversaAtiva
  // O salvamento já ocorre ao enviar mensagem e ao criar nova conversa

  // Carrega as mensagens sempre que a conversa ativa mudar
  useEffect(() => {
    if (conversaAtiva) {
      // Chama a função corretamente para garantir execução
      carregarMensagensDaConversa(conversaAtiva);
    } else {
      setMensagens([]);
    }
  }, [conversaAtiva]);

  // Busca nome do usuário para mostrar as iniciais no botão
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        // Usuário autenticado - não precisa mais carregar nome para exibição
      }
    });
  }, []);

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
  async function processarArquivoSelecionado(url: string) {
    setArquivoSelecionado(url);
    
    // Aguarda um pouco para garantir que os estados estejam sincronizados
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Busca o contexto do arquivo selecionado imediatamente
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    
    console.log("Debug - Processando arquivo MainPage:", url.substring(url.lastIndexOf('/') + 1));
    
    // Extrai o nome do arquivo da URL para fazer download direto do Supabase
    const urlParts = url.split('/');
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
    
    console.log("Debug - Nome do arquivo extraído:", fileName);
    
    // Faz download direto do arquivo usando o nome extraído da URL
    const { data: fileData, error: fileError } = await supabase.storage.from("documentos").download(`${user.id}/${fileName}`);
    if (fileError || !fileData) {
      console.log(`[LOG] Erro ao pré-carregar arquivo: ${fileName}`, fileError);
      return;
    }
    
    console.log("Debug - Arquivo baixado com sucesso para processamento");
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    let texto = "";
    try {
      if (ext === "txt" || ext === "text") {
        texto = await new Response(fileData).text();
      } else if (ext === "pdf") {
        texto = await extrairTextoPDF(fileData);
      } else if (ext === "docx") {
        texto = await extrairTextoDOCX(fileData);
      } else {
        console.log(`[LOG] Formato não suportado para pré-carregamento: ${fileName}`);
        return;
      }
      console.log(`[LOG] Arquivo pré-carregado: ${fileName} | Tamanho: ${texto.length} caracteres`);
    } catch (e) {
      console.log(`[LOG] Erro ao pré-carregar texto de ${fileName}:`, e);
    }
  }

  // Função para buscar contexto dos documentos anexos (qualquer formato)
  async function buscarContextoPergunta(): Promise<string | null> {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return null;
    if (!arquivoSelecionado) {
      // Nenhum arquivo selecionado: IA deve pedir para o usuário escolher
      return null;
    }
    // Busca apenas o arquivo selecionado
    const arquivoObj = arquivos.find(a => a.url === arquivoSelecionado);
    if (!arquivoObj) return null;
    const fileName = arquivoObj.originalName; // Usa o nome real do storage
    if (!fileName) return null;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const { data: fileData, error: fileError } = await supabase.storage.from("documentos").download(`${user.id}/${fileName}`);
    if (fileError || !fileData) {
      console.log(`[LOG] Erro ao baixar arquivo: ${fileName}`);
      return null;
    }
    let texto = "";
    try {
      if (ext === "txt" || ext === "text") {
        texto = await new Response(fileData).text();
      } else if (ext === "pdf") {
        texto = await extrairTextoPDF(fileData);
      } else if (ext === "docx") {
        texto = await extrairTextoDOCX(fileData);
      } else {
        console.log(`[LOG] Formato não suportado: ${fileName}`);
        return null;
      }
      console.log(`[LOG] Arquivo lido: ${fileName} | Tamanho: ${texto.length} caracteres`);
      if (texto.length < 100) {
        console.log(`[LOG] Conteúdo do arquivo ${fileName}:`, texto);
      }
    } catch (e) {
      console.log(`[LOG] Erro ao extrair texto de ${fileName}:`, e);
      return null;
    }
    return `Arquivo selecionado: ${fileName}\n${texto}`;
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

    try {
      // Chama API de IA com sistema otimizado
      const respostaIA = await sendOptimizedMainPageMessage(historicoApi, contexto, MAIN_PAGE_SYSTEM_PROMPT);
      const mensagensComBot = [
        ...mensagensAtualizadas,
        { autor: 'bot' as const, texto: respostaIA }
      ];
      setMensagens(mensagensComBot);
      // Salva conversa após resposta do bot
      if (conversaAtiva) {
        const conversa = conversas.find(c => c.id === conversaAtiva);
        if (conversa) {
          salvarConversaNoSupabase(conversaAtiva, conversa.nome, mensagensComBot);
        }
      }
    } catch (err) {
      const mensagensComBot = [
        ...mensagensAtualizadas,
        { autor: 'bot' as const, texto: `Erro ao consultar a API de IA: ${err}` }
      ];
      setMensagens(mensagensComBot);
      if (conversaAtiva) {
        const conversa = conversas.find(c => c.id === conversaAtiva);
        if (conversa) {
          salvarConversaNoSupabase(conversaAtiva, conversa.nome, mensagensComBot);
        }
      }
    }
    setEnviando(false);
  }

  // Foca no input após enviar mensagem
  useEffect(() => {
    if (!enviando && inputMensagemRef.current) {
      inputMensagemRef.current.focus();
    }
  }, [enviando]);

  // Função para download da conversa
  async function handleDownloadConversa(conversaId: string, nome: string) {
    let conteudo = '';
    if (conversaAtiva === conversaId) {
      conteudo = mensagens.map(m => `${m.autor === 'user' ? 'Você' : 'Bot'}: ${m.texto}`).join('\n');
    } else {
      // Buscar mensagens do Supabase
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;
      const arquivo = `conversa-${conversaId}.json`;
      const { data: fileData, error } = await supabase.storage.from("conversas").download(`${user.id}/${arquivo}?t=${Date.now()}`);
      if (error || !fileData) {
        alert('Erro ao baixar conversa do Supabase!');
        return;
      }
      try {
        const json = await fileData.text();
        const obj = JSON.parse(json);
        conteudo = (obj.mensagens || []).map((m: any) => `${m.autor === 'user' ? 'Você' : 'Bot'}: ${m.texto}`).join('\n');
      } catch {
        conteudo = 'Erro ao exportar conversa.';
      }
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

  // Funções de debug e monitoramento - pode ser chamado no console do browser
  
  // Sistema antigo de chunks (ainda disponível)
  (window as any).debugChunks = () => {
    const { useChunkDebug } = require('../api');
    const debug = useChunkDebug();
    console.log('=== RELATÓRIO DE DEBUG DOS CHUNKS (SISTEMA ANTIGO) ===');
    console.log(debug.exportReport());
    console.log('=== ANÁLISE DE PERFORMANCE ===');
    console.log(debug.analyzePerformance());
  };

  // Novo sistema otimizado (recomendado)
  (window as any).debugOptimized = debugOptimizedSystem;
  (window as any).clearOptimizedCache = clearOptimizedCache;

  (window as any).debugCosts = () => {
    const { costMonitor } = require('../api');
    costMonitor.printReport();
    const analysis = costMonitor.analyzeAndSuggest();
    console.log('=== ANÁLISE DETALHADA DE CUSTOS ===');
    console.log(analysis.analysis);
    console.log('=== SUGESTÕES DE OTIMIZAÇÃO ===');
    analysis.suggestions.forEach((suggestion: string) => console.log(`• ${suggestion}`));
    console.log('=== BREAKDOWN DE CUSTOS ===');
    console.log(`Entrada: $${analysis.costBreakdown.inputCost.toFixed(6)}`);
    console.log(`Saída: $${analysis.costBreakdown.outputCost.toFixed(6)}`);
    console.log(`Total: $${analysis.costBreakdown.totalCost.toFixed(6)}`);
  };

  (window as any).resetDebug = () => {
    const { costMonitor } = require('../api');
    costMonitor.clear();
    console.log('✅ Histórico de custos e debug limpo');
  };

  // --- UI ---
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
          <div style={{ position: "relative" }}>
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
              onClick={() => navigate("/chat")}
            >
              Bate-Papo
            </button>
            {temConversasNaoLidas && (
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#4CAF50",
                  border: "2px solid #fff",
                  zIndex: 1
                }}
              />
            )}
          </div>
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
            title="Menu"
            onClick={e => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setMenuUsuarioAberto(v => !v);
              setMenuUsuarioPos({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
              });
            }}
          >
            ☰
          </span>
          {menuUsuarioAberto && menuUsuarioPos && (
            <div
              id="menu-usuario"
              style={{
                position: "fixed",
                left: menuUsuarioPos.left - 160, // Abre para o lado esquerdo do botão
                top: menuUsuarioPos.top,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
                boxShadow: "0 2px 8px #0003",
                zIndex: 9999,
                minWidth: 160,
                fontSize: 15,
                padding: 0,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <button
                style={{
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#222",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  navigate("/");
                }}
              >Página Inicial</button>
              <div style={{ borderTop: "1px solid #eee" }} />
              <button
                style={{
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#222",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  navigate("/config");
                }}
              >Estação de Comando</button>
              <div style={{ borderTop: "1px solid #eee" }} />
              <button
                style={{
                  padding: "12px 18px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#d32f2f",
                  cursor: "pointer"
                }}
                onClick={() => {
                  setMenuUsuarioAberto(false);
                  supabase.auth.signOut().then(() => window.location.href = "/");
                }}
              >Sair</button>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal */}
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
            {/* Modal para colar texto */}
            {/* Removido: Modal de texto manual */}

            {/* Lista de arquivos já enviados - NOVO LAYOUT */}
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
              {/* Menu de opções para novo arquivo/texto */}
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
                  {/* Removido: Botão de texto manual */}
                </div>
              )}
              {/* Input de arquivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FORMATS}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              {/* Lista de arquivos */}
              <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 8 }}>
                {arquivos.length === 0 && (
                  <div style={{ color: "#888", fontSize: 13 }}>Nenhum arquivo enviado ainda.</div>
                )}
                {arquivos.map((arq) => (
                  <div key={arq.url} style={{
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
                    {/* Radio para selecionar o arquivo */}
                    <input
                      type="radio"
                      name="arquivo-pesquisa"
                      checked={arquivoSelecionado === arq.url}
                      onChange={() => processarArquivoSelecionado(arq.url)}
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
                        setMenuAberto(arq.originalName!);
                        setMenuPos({
                          top: rect.bottom + window.scrollY,
                          left: rect.right + window.scrollX
                        });
                      }}
                      title="Mais opções"
                    >
                      &#8942;
                    </button>
                    {menuAberto === arq.originalName && menuPos && (
                      <div
                        ref={menuRef}
                        style={{
                          position: "fixed",
                          left: menuPos.left + 8, // ligeiramente à direita do clique
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
                            color: "#222", // preto para máxima legibilidade
                          }}
                          onClick={() => {
                            setMenuAberto(null);
                            setTimeout(() => handleDownload(arq.originalName!, arq.nome), 0);
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
                            setTimeout(() => handleDelete(arq.originalName!), 0);
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
                {conversasCarregando ? (
                  <div style={{ color: "#888", fontSize: 13 }}>Carregando conversas...</div>
                ) : conversas.length === 0 ? (
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
                        // Evita abrir a conversa ao clicar no botão de menu
                        if ((e.target as HTMLElement).closest('button')) return;
                        setConversaAtiva(conversa.id);
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
                            left: menuConversaPos.left + 8, // ligeiramente à direita do clique
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
            {/* Botões de navegação extra removidos */}
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
                
                // Salva a conversa inicial no Supabase
                salvarConversaNoSupabase(novaId, nome, novasMensagens);
                
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

                  try {
                    const respostaIA = await sendOptimizedMainPageMessage(historicoApi, contexto, MAIN_PAGE_SYSTEM_PROMPT);
                    const mensagensComBot = [...novasMensagens, { autor: 'bot' as const, texto: respostaIA }];
                    setMensagens(mensagensComBot);
                    salvarConversaNoSupabase(novaId, nome, mensagensComBot);
                  } catch (err) {
                    const mensagensComBot = [...novasMensagens, { autor: 'bot' as const, texto: `Erro ao consultar a API de IA: ${err}` }];
                    setMensagens(mensagensComBot);
                    salvarConversaNoSupabase(novaId, nome, mensagensComBot);
                  }
                  setEnviando(false);
                }, 100);
              }}>
                <input
                  ref={inputMensagemRef}
                  type="text"
                  value={inputMensagem}
                  onChange={e => setInputMensagem(e.target.value)}
                  placeholder="Digite sua pergunta e pressione Enter..."
                  style={{
                    flex: 2,
                    padding: "32px 18px",
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
                O PerguntaproSub AI pode cometer erros. Considere verificar informações importantes.
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
                    outline: "none",
                    background: "#fff",
                    color: "#000"
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}