import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { enviarMensagem as enviarMsgSupabase, buscarMensagens, removerMensagensParaUsuario, marcarMensagensComoLidas } from '../utils/chatMessages';
import type { ChatMessage } from '../utils/chatMessages';

const contatosMock = [
  { id: 'a', nome: 'Ana Paula' },
  { id: 'b', nome: 'Bruno Lima' },
  { id: 'c', nome: 'Fernanda Costa' }
];

const ChatPage: React.FC = () => {
  const [amigoSelecionado, setAmigoSelecionado] = useState<string | null>(null);
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [pesquisaAmigo, setPesquisaAmigo] = useState('');
  const [pesquisaConversas, setPesquisaConversas] = useState('');
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [menuUsuarioPos, setMenuUsuarioPos] = useState<{ top: number; left: number } | null>(null);
  const [userName, setUserName] = useState('');
  const [usuariosSupabase, setUsuariosSupabase] = useState<any[]>([]);
  const [buscandoUsuarios, setBuscandoUsuarios] = useState(false);
  const [mensagens, setMensagens] = useState<ChatMessage[]>([]);
  const [inputMensagem, setInputMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mostrarPerfil, setMostrarPerfil] = useState(false);
  const [amigos, setAmigos] = useState<{ id: string, nome: string }[]>([]);
  const [menuAmigoAberto, setMenuAmigoAberto] = useState<string | null>(null);
  const [menuAmigoPos, setMenuAmigoPos] = useState<{ top: number; left: number } | null>(null);
  const [menuConversaAberto, setMenuConversaAberto] = useState<string | null>(null);
  const [menuConversaPos, setMenuConversaPos] = useState<{ top: number; left: number } | null>(null);
  const [conversasSupabase, setConversasSupabase] = useState<{ id: string, nome: string }[]>([]);
  // Corrige exibição do perfil do amigo já adicionado
  // Adicione um estado para armazenar o perfil do usuário a ser exibido
  const [perfilUsuarioExibido, setPerfilUsuarioExibido] = useState<any | null>(null);
  // Busca cor do tema do localStorage a cada renderização do header
  const [headerColor, setHeaderColor] = useState('#fff');
  const [conversasNaoLidas, setConversasNaoLidas] = useState<{ [id: string]: boolean }>({});

  // Função para buscar usuários no Supabase
  async function buscarUsuariosSupabase(termo: string) {
    setBuscandoUsuarios(true);
    const { data } = await supabase
      .from('perfil_usuario')
      .select('user_id, nome, nomeguerra, email')
      .or(`nome.ilike.%${termo}%,nomeguerra.ilike.%${termo}%,email.ilike.%${termo}%`);
    setUsuariosSupabase(data || []);
    setBuscandoUsuarios(false);
  }

  // Atualiza busca ao digitar na barra de pesquisa de amigos
  useEffect(() => {
    if (pesquisaAmigo.length > 1) {
      buscarUsuariosSupabase(pesquisaAmigo);
    } else {
      setUsuariosSupabase([]);
    }
  }, [pesquisaAmigo]);

  // Busca o ID do usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id || null);
      const nome = data?.user?.user_metadata?.full_name || data?.user?.email || '';
      setUserName(nome);
    });
  }, []);

  // Carrega amigos e conversas do Supabase ao abrir
  useEffect(() => {
    if (userId) {
      carregarAmigosSupabase(userId);
      buscarUsuariosComMensagens(userId);
    }
  }, [userId]);

  // Buscar mensagens ao selecionar um amigo
  useEffect(() => {
    if (userId && amigoSelecionado) {
      buscarMensagens(userId, amigoSelecionado, userId).then(setMensagens);
      marcarMensagensComoLidas(amigoSelecionado, userId, userId); // Marca como lidas ao abrir
    } else {
      setMensagens([]);
    }
  }, [userId, amigoSelecionado]);

  // Atualiza mensagens ao selecionar uma conversa
  useEffect(() => {
    if (userId && amigoSelecionado) {
      buscarMensagens(userId, amigoSelecionado, userId).then(setMensagens);
      marcarMensagensComoLidas(amigoSelecionado, userId, userId);
    } else {
      setMensagens([]);
    }
  }, [userId, amigoSelecionado]);

  // 1. Função para buscar conversas (usuários com quem trocou mensagens)
  async function buscarConversas(userId: string) {
    const { data } = await supabase
      .from('mensagens')
      .select('remetente_id, destinatario_id, removido_por')
      .or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`);
    if (!data) return [];
    const ids = new Set<string>();
    data.forEach((msg: any) => {
      // Só adiciona se a mensagem NÃO foi removida pelo usuário logado
      if (!msg.removido_por || !msg.removido_por.includes(userId)) {
        if (msg.remetente_id !== userId) ids.add(msg.remetente_id);
        if (msg.destinatario_id !== userId) ids.add(msg.destinatario_id);
      }
    });
    if (ids.size === 0) return [];
    const { data: perfis } = await supabase
      .from('perfil_usuario')
      .select('user_id, nome')
      .in('user_id', Array.from(ids));
    return (perfis || []).map((p: any) => ({ id: p.user_id, nome: p.nome }));
  }

  // 2. Atualiza conversas sempre que mensagens mudam
  useEffect(() => {
    if (userId) {
      buscarConversas(userId).then(setConversasSupabase);
    }
  }, [userId, mensagens]);

  // 3. Ao enviar mensagem, salva corretamente no Supabase e atualiza lista
  async function handleEnviarMensagem(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMensagem.trim() || !userId || !amigoSelecionado) return;
    setEnviando(true);
    // Salva a mensagem no balde 'mensagens' do Supabase, relacionada aos dois usuários
    await enviarMsgSupabase(userId, amigoSelecionado, inputMensagem);
    setInputMensagem('');
    buscarMensagens(userId, amigoSelecionado, userId).then(setMensagens);
    setEnviando(false);
  }

  // Funções utilitárias para persistência no Supabase
  async function carregarAmigosSupabase(userId: string) {
    const { data } = await supabase
      .from('amigos')
      .select('amigo_id, nome')
      .eq('user_id', userId);
    if (data) setAmigos(data.map(a => ({ id: a.amigo_id, nome: a.nome })));
  }

  async function handleAdicionarAmigo(amigo: any) {
    await supabase.from('amigos').upsert({ user_id: userId, amigo_id: amigo.user_id, nome: amigo.nome });
    setAmigos(prev => [...prev, { id: amigo.user_id, nome: amigo.nome }]);
  }

  async function handleExcluirAmigo(amigoId: string) {
    await supabase.from('amigos').delete().eq('user_id', userId).eq('amigo_id', amigoId);
    setAmigos(prev => prev.filter(a => a.id !== amigoId));
  }

  // Buscar usuários com quem já trocou mensagens
  async function buscarUsuariosComMensagens(userId: string) {
    const { data } = await supabase
      .from('mensagens')
      .select('remetente_id, destinatario_id, removido_por')
      .or(`remetente_id.eq.${userId},destinatario_id.eq.${userId}`);
    if (!data) return [];
    const ids = new Set();
    data.forEach((msg: any) => {
      if (!msg.removido_por || !msg.removido_por.includes(userId)) {
        if (msg.remetente_id !== userId) ids.add(msg.remetente_id);
        if (msg.destinatario_id !== userId) ids.add(msg.destinatario_id);
      }
    });
    if (ids.size === 0) return [];
    const { data: perfis } = await supabase
      .from('perfil_usuario')
      .select('user_id, nome')
      .in('user_id', Array.from(ids));
    // Ajusta para o formato esperado
    return (perfis || []).map((p: any) => ({ id: p.user_id, nome: p.nome }));
  }

  // Atualiza lista de conversas ao abrir
  useEffect(() => {
    if (userId) {
      buscarUsuariosComMensagens(userId).then(setConversasSupabase);
    }
  }, [userId, mensagens]);

  // Função para abrir o chat (janela de mensagens)
  function abrirChat(id: string) {
    setAmigoSelecionado(id);
    setConversaSelecionada(id);
    setMostrarPerfil(false);
  }

  // Certifique-se de que conversasFiltradas está definida antes do return e tipada corretamente
  const conversasFiltradas: { id: string, nome: string }[] = conversasSupabase.filter((c: { id: string, nome: string }) => c.nome.toLowerCase().includes(pesquisaConversas.toLowerCase()));

  // Certifique-se de que amigosFiltrados está definido antes do return e tipada corretamente
  const amigosFiltrados: { id: string, nome: string }[] = amigos.filter((a: { nome: string }) => a.nome.toLowerCase().includes(pesquisaAmigo.toLowerCase()));

  // Fecha o menu ao clicar fora
  React.useEffect(() => {
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

  // Fecha o menu de amigo ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuAmigoAberto) {
        const menu = document.getElementById('menu-amigo');
        if (menu && !menu.contains(event.target as Node)) {
          setMenuAmigoAberto(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuAmigoAberto]);

  // Fecha o menu de conversa ao clicar fora
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuConversaAberto) {
        const menu = document.querySelector('[id^="menu-conversa"], [id^="menu-conversa-"]');
        if (menu && !menu.contains(event.target as Node)) {
          setMenuConversaAberto(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuConversaAberto]);

  // Busca cor do tema do localStorage a cada renderização do header
  useEffect(() => {
    const savedColor = localStorage.getItem('paletaCor');
    setHeaderColor(savedColor || '#fff');
  }, []);

  // Atualiza o status de não lida ao buscar conversas
  useEffect(() => {
    if (!userId || conversasSupabase.length === 0) return;
    async function fetchNaoLidas() {
      const status: { [id: string]: boolean } = {};
      for (const conversa of conversasSupabase) {
        // Busca se existe pelo menos uma mensagem não lida para o usuário logado nesta conversa
        const { data } = await supabase
          .from('mensagens')
          .select('id')
          .eq('remetente_id', conversa.id)
          .eq('destinatario_id', userId)
          .or('lida_por.is.null,lida_por.not.cs.{"' + userId + '"}')
          .limit(1);
        status[conversa.id] = !!(data && data.length > 0);
      }
      setConversasNaoLidas(status);
    }
    fetchNaoLidas();
  }, [conversasSupabase, userId]);

  return (
    <div style={{ height: '100vh', width: '100vw', background: headerColor, overflow: 'hidden' }}>
      <header style={{
        width: '100%',
        height: 96,
        background: headerColor,
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/simbolo.png" alt="Logo" style={{ width: 72, height: 72, borderRadius: '50%', marginRight: 14 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#000' }}>PerguntaProSub</div>
            <div style={{ fontSize: 12, color: '#000' }}>Sistema de IA para o mundo Militar</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              background: '#1976d2',
              color: '#fff',
              borderRadius: '50%',
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              marginRight: 8,
              cursor: 'pointer',
              userSelect: 'none'
            }}
            title="Menu do usuário"
            onClick={e => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setMenuUsuarioAberto(v => !v);
              setMenuUsuarioPos({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
              });
            }}
          >
            {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : ''}
          </span>
          {menuUsuarioAberto && menuUsuarioPos && (
            <div
              id="menu-usuario"
              style={{
                position: "fixed",
                left: menuUsuarioPos.left - 160,
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
                  window.location.href = "/main";
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
                  window.location.href = "/config";
                }}
              >Menu</button>
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
                  window.location.href = "/";
                }}
              >Sair</button>
            </div>
          )}
        </div>
      </header>
      <div style={{ display: 'flex', height: 'calc(100vh - 96px)', width: '100vw' }}>
        {/* Sidebar Amigos */}
        <aside style={{
          width: 260,
          background: '#fff',
          borderRight: '1px solid #eee',
          padding: 24,
          height: '100%',
          boxSizing: 'border-box'
        }}>
          <nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              <span style={{ fontWeight: 600, marginBottom: 4 }}>Amigos</span>
              <input
                type="text"
                placeholder="Pesquisar usuários..."
                value={pesquisaAmigo}
                onChange={e => setPesquisaAmigo(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  marginBottom: 8
                }}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8 }}>
                {buscandoUsuarios && (
                  <div style={{ color: '#888', fontSize: 13 }}>Buscando usuários...</div>
                )}
                {pesquisaAmigo.length > 1 && usuariosSupabase.length === 0 && !buscandoUsuarios && (
                  <div style={{ color: '#888', fontSize: 13 }}>Nenhum usuário encontrado.</div>
                )}
                {usuariosSupabase.map(usuario => (
                  <button
                    key={usuario.user_id}
                    style={{
                      background: amigoSelecionado === usuario.user_id ? '#e3eaff' : '#f7f7f9',
                      borderRadius: 6,
                      padding: '8px 10px',
                      marginBottom: 6,
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#222',
                      border: amigoSelecionado === usuario.user_id ? '1.5px solid #1976d2' : '1px solid #eee',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setAmigoSelecionado(usuario.user_id);
                      setConversaSelecionada(null);
                      setMostrarPerfil(true);
                      setPerfilUsuarioExibido(usuario);
                      // NÃO atualize ultimoAcesso ou conversasNaoLidas aqui!
                    }}
                  >
                    {usuario.nome} {usuario.nomeguerra ? `(${usuario.nomeguerra})` : ''}<br />
                    <span style={{ color: '#888', fontSize: 12 }}>{usuario.email}</span>
                  </button>
                ))}
                {pesquisaAmigo.length <= 1 && amigosFiltrados.length === 0 && (
                  <div style={{ color: '#888', fontSize: 13 }}>Nenhum amigo encontrado.</div>
                )}
                {pesquisaAmigo.length <= 1 && amigosFiltrados.map(amigo => (
                  <div key={amigo.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <button
                      style={{
                        background: amigoSelecionado === amigo.id ? '#e3eaff' : '#f7f7f9',
                        borderRadius: 6,
                        padding: '8px 10px',
                        marginBottom: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#222',
                        border: amigoSelecionado === amigo.id ? '1.5px solid #1976d2' : '1px solid #eee',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onClick={() => {
                        setAmigoSelecionado(amigo.id);
                        setConversaSelecionada(null);
                        setMostrarPerfil(true);
                        // Busca o perfil completo do amigo na lista de usuariosSupabase ou faz uma busca no Supabase
                        const usuario = usuariosSupabase.find(u => u.user_id === amigo.id);
                        if (usuario) {
                          setPerfilUsuarioExibido(usuario);
                        } else {
                          // Busca no Supabase se não estiver em cache
                          supabase
                            .from('perfil_usuario')
                            .select('*')
                            .eq('user_id', amigo.id)
                            .single()
                            .then(({ data }) => setPerfilUsuarioExibido(data));
                        }
                      }}
                    >
                      <span style={{ flex: 1 }}>{amigo.nome}</span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 20,
                          cursor: 'pointer',
                          color: '#888',
                          padding: '0 6px',
                          borderRadius: 4
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          setMenuAmigoAberto(amigo.id);
                          setMenuAmigoPos({
                            top: rect.bottom + window.scrollY,
                            left: rect.left + window.scrollX
                          });
                        }}
                        title="Mais opções"
                      >&#8942;</span>
                    </button>
                    {menuAmigoAberto === amigo.id && menuAmigoPos && (
                      <div
                        id="menu-amigo"
                        style={{
                          position: 'fixed',
                          left: menuAmigoPos.left - 80,
                          top: menuAmigoPos.top,
                          background: '#fff',
                          border: '1px solid #ddd',
                          borderRadius: 8,
                          boxShadow: '0 2px 8px #0003',
                          zIndex: 9999,
                          minWidth: 100,
                          fontSize: 15,
                          padding: 0,
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <button
                          style={{
                            padding: '10px 18px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            fontWeight: 500,
                            fontSize: 15,
                            color: '#222',
                            cursor: 'pointer',
                            borderRadius: 8
                          }}
                          onClick={() => {
                            setMenuAmigoAberto(null);
                            setMostrarPerfil(false);
                            setAmigoSelecionado(amigo.id);
                            setConversaSelecionada(null);
                          }}
                        >Mensagens</button>
                        <button
                          style={{
                            padding: '10px 18px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            fontWeight: 500,
                            fontSize: 15,
                            color: '#d32f2f',
                            cursor: 'pointer',
                            borderRadius: 8
                          }}
                          onClick={async () => {
                            setMenuAmigoAberto(null);
                            // Aqui você pode implementar a lógica de bloqueio
                            alert('Função de bloqueio implementada aqui.');
                          }}
                        >Bloquear</button>
                        <button
                          style={{
                            padding: '10px 18px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            fontWeight: 500,
                            fontSize: 15,
                            color: '#d32f2f',
                            cursor: 'pointer',
                            borderRadius: 8
                          }}
                          onClick={async () => {
                            if (menuAmigoAberto) {
                              await handleExcluirAmigo(menuAmigoAberto);
                              setMenuAmigoAberto(null);
                            }
                          }}
                        >Deixar de seguir</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </aside>
        {/* Conteúdo principal */}
        <main
          style={{
            flex: 1,
            height: '100%',
            background: '#f7f7f9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            overflowY: 'auto',
            paddingRight: 48
          }}
        >
          {/* Exibe perfil do amigo pesquisado antes do chat */}
          {mostrarPerfil && perfilUsuarioExibido && (
            <div style={{
              width: '100%',
              maxWidth: 500,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px #0001',
              padding: 32,
              margin: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16
            }}>
              <h2 style={{ margin: 0, color: '#222', textShadow: '0 1px 4px #fff' }}>Perfil do Usuário</h2>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#222', textShadow: '0 1px 4px #fff' }}>{perfilUsuarioExibido.nome}</div>
              <div style={{ fontSize: 16, color: '#555' }}>Nome de guerra: {perfilUsuarioExibido.nomeguerra || '-'}</div>
              <div style={{ fontSize: 16, color: '#555' }}>Email: {perfilUsuarioExibido.email}</div>
              <div style={{ fontSize: 16, color: '#555' }}>Posto/Graduação: {perfilUsuarioExibido.posto || '-'}</div>
              <div style={{ fontSize: 16, color: '#555' }}>Força/Instituição: {perfilUsuarioExibido.forca || '-'}</div>
              <div style={{ fontSize: 16, color: '#555' }}>Organização Militar: {perfilUsuarioExibido.om || '-'}</div>
              <div style={{ fontSize: 16, color: '#555' }}>Celular: {perfilUsuarioExibido.celular || '-'}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  style={{
                    background: amigos.some(a => a.id === perfilUsuarioExibido.user_id) ? '#bbb' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    minWidth: 90
                  }}
                  onClick={() => {
                    if (amigos.some(a => a.id === perfilUsuarioExibido.user_id)) {
                      handleExcluirAmigo(perfilUsuarioExibido.user_id);
                    } else {
                      handleAdicionarAmigo(perfilUsuarioExibido);
                    }
                  }}
                >
                  {amigos.some(a => a.id === perfilUsuarioExibido.user_id) ? 'Deixar de seguir' : 'Seguir'}
                </button>
                <button
                  style={{
                    background: '#43a047',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    minWidth: 90
                  }}
                  onClick={() => {
                    setMostrarPerfil(false);
                    setAmigoSelecionado(perfilUsuarioExibido.user_id);
                    setConversaSelecionada(null);
                  }}
                >Mensagens</button>
                <button
                  style={{
                    background: '#d32f2f',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    minWidth: 90
                  }}
                  onClick={() => {
                    alert('Função de bloqueio implementada aqui.');
                  }}
                >Bloquear</button>
              </div>
            </div>
          )}
          {/* Exibe chat apenas se não estiver mostrando perfil */}
          {!mostrarPerfil && amigoSelecionado ? (
            <div style={{
              width: '100%',
              maxWidth: 700,
              height: '80vh',
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 8px #0001',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              margin: 24,
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, width: '100%', overflowY: 'auto', marginBottom: 16 }}>
                {mensagens.length === 0 && (
                  <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
                    Inicie a conversa digitando sua mensagem abaixo.
                  </div>
                )}
                {mensagens.map((msg, idx) => (
                  <div key={msg.id || idx} style={{
                    marginBottom: 18,
                    textAlign: msg.remetente_id === userId ? 'right' : 'left'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      background: msg.remetente_id === userId ? '#1976d2' : '#eee',
                      color: msg.remetente_id === userId ? '#fff' : '#222',
                      borderRadius: 8,
                      padding: '10px 16px',
                      maxWidth: 420,
                      fontSize: 15
                    }}>{msg.texto}</div>
                  </div>
                ))}
              </div>
              <form style={{ display: 'flex', gap: 8, width: '100%' }} onSubmit={handleEnviarMensagem}>
                <input
                  type="text"
                  value={inputMensagem}
                  onChange={e => setInputMensagem(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    fontSize: 16,
                    outline: 'none'
                  }}
                  disabled={enviando}
                />
                <button
                  type="submit"
                  style={{
                    background: enviando ? '#bbb' : '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 24px',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: enviando ? 'not-allowed' : 'pointer'
                  }}
                  disabled={enviando || !inputMensagem.trim()}
                >Enviar</button>
              </form>
            </div>
          ) : conversaSelecionada ? (
            <div style={{
              width: '100%',
              maxWidth: 700,
              height: '80vh',
              background: '#f7f7f9',
              borderRadius: 12,
              boxShadow: '0 2px 8px #0001',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              margin: 24,
              overflow: 'hidden'
            }}>
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
                {/* Mensagens da conversa fictícia */}
                <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
                  Inicie a conversa com {contatosMock.find(c => c.id === conversaSelecionada)?.nome} digitando sua mensagem abaixo.
                </div>
                {/* Aqui você pode mapear mensagens reais se desejar */}
              </div>
              <form style={{ display: 'flex', gap: 8 }} onSubmit={e => { e.preventDefault(); }}>
                <input
                  type="text"
                  placeholder={`Digite sua mensagem para ${contatosMock.find(c => c.id === conversaSelecionada)?.nome}...`}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: '1px solid #ccc',
                    fontSize: 16,
                    outline: 'none'
                  }}
                  disabled={false}
                />
                <button
                  type="submit"
                  style={{
                    background: '#1976d2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0 24px',
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: 'pointer'
                  }}
                  disabled={false}
                >Enviar</button>
              </form>
            </div>
          ) : (
            <div style={{ color: '#888', fontSize: 18, marginTop: 40 }}>Selecione um amigo ou conversa para começar</div>
          )}
        </main>
        {/* Sidebar Conversas */}
        <aside style={{
          width: 260,
          background: '#fff',
          borderLeft: '1px solid #eee',
          padding: 24,
          height: '100%',
          boxSizing: 'border-box'
        }}>
          <nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              <span style={{ fontWeight: 600, marginBottom: 4 }}>Mensagens</span>
              <input
                type="text"
                placeholder="Pesquisar conversas..."
                value={pesquisaConversas}
                onChange={e => setPesquisaConversas(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  marginBottom: 8
                }}
              />
              <div style={{ maxHeight: 180, overflowY: 'auto', marginTop: 8 }}>
                {conversasFiltradas.length === 0 && (
                  <div style={{ color: '#888', fontSize: 13 }}>Nenhuma conversa encontrada.</div>
                )}
                {conversasFiltradas.map(conversa => {
                  return (
                    <div key={conversa.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <button
                        style={{
                          background: conversaSelecionada === conversa.id ? '#e3eaff' : '#f7f7f9',
                          borderRadius: 6,
                          padding: '8px 10px',
                          marginBottom: 6,
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#222',
                          border: conversaSelecionada === conversa.id ? '1.5px solid #1976d2' : '1px solid #eee',
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          position: 'relative'
                        }}
                        onClick={() => {
                          abrirChat(conversa.id);
                          setConversasNaoLidas(prev => ({ ...prev, [conversa.id]: false }));
                        }}
                      >
                        {/* Bolinha verde de não lida */}
                        {conversasNaoLidas[conversa.id] && (
                          <span style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: '#43a047',
                            marginRight: 8
                          }}></span>
                        )}
                        <span style={{ flex: 1 }}>{conversa.nome}</span>
                        <span
                          style={{
                            marginLeft: 8,
                            fontSize: 20,
                            cursor: 'pointer',
                            color: '#888',
                            padding: '0 6px',
                            borderRadius: 4
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setMenuConversaAberto(conversa.id);
                            setMenuConversaPos({
                              top: rect.bottom + window.scrollY,
                              left: rect.left + window.scrollX
                            });
                          }}
                          title="Mais opções"
                        >&#8942;</span>
                      </button>
                      {menuConversaAberto === conversa.id && menuConversaPos && (
                        <div
                          id={`menu-conversa-${conversa.id}`}
                          style={{
                            position: 'fixed',
                            left: menuConversaPos.left - 80,
                            top: menuConversaPos.top,
                            background: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: 8,
                            boxShadow: '0 2px 8px #0003',
                            zIndex: 9999,
                            minWidth: 100,
                            fontSize: 15,
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <button
                            style={{
                              padding: '10px 18px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              fontWeight: 500,
                              fontSize: 15,
                              color: '#222',
                              cursor: 'pointer',
                              borderRadius: 8
                            }}
                            onClick={async () => {
                              setMenuConversaAberto(null);
                              setMostrarPerfil(true);
                              // Busca o perfil do usuário da conversa
                              let perfil = usuariosSupabase.find(u => u.user_id === conversa.id);
                              if (!perfil) {
                                const { data } = await supabase
                                  .from('perfil_usuario')
                                  .select('*')
                                  .eq('user_id', conversa.id)
                                  .single();
                                perfil = data;
                              }
                              setPerfilUsuarioExibido(perfil);
                              setAmigoSelecionado(conversa.id);
                              setConversaSelecionada(null);
                            }}
                          >Perfil</button>
                          <button
                            style={{
                              padding: '10px 18px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              fontWeight: 500,
                              fontSize: 15,
                              color: '#d32f2f',
                              cursor: 'pointer',
                              borderRadius: 8
                            }}
                            onClick={async () => {
                              if (!userId) return;
                              // Excluir todas as mensagens entre o usuário logado e o contato selecionado
                              await removerMensagensParaUsuario(userId, conversa.id, userId);
                              setMenuConversaAberto(null);
                              buscarConversas(userId).then(setConversasSupabase);
                              if (amigoSelecionado === conversa.id) {
                                setMensagens([]);
                                setAmigoSelecionado(null);
                              }
                            }}
                          >Excluir</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default ChatPage;
