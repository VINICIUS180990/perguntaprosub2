import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const amigosMock = [
  { id: '1', nome: 'João Silva' },
  { id: '2', nome: 'Maria Souza' },
  { id: '3', nome: 'Carlos Oliveira' }
];
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const nome = data?.user?.user_metadata?.full_name || data?.user?.email || '';
      setUserName(nome);
    });
  }, []);

  const amigosFiltrados = amigosMock.filter(a => a.nome.toLowerCase().includes(pesquisaAmigo.toLowerCase()));
  const conversasFiltradas = contatosMock.filter(c => c.nome.toLowerCase().includes(pesquisaConversas.toLowerCase()));

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

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#fff', overflow: 'hidden' }}>
      <header style={{
        width: '100%',
        height: 96,
        background: '#fff',
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
                placeholder="Pesquisar amigos..."
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
                {amigosFiltrados.length === 0 && (
                  <div style={{ color: '#888', fontSize: 13 }}>Nenhum amigo encontrado.</div>
                )}
                {amigosFiltrados.map(amigo => (
                  <button
                    key={amigo.id}
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
                      cursor: 'pointer'
                    }}
                    onClick={() => setAmigoSelecionado(amigo.id)}
                  >
                    {amigo.nome}
                  </button>
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
          {/* Exibe perfil do amigo ou conversa */}
          {amigoSelecionado ? (
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
              <h2>Perfil do Amigo</h2>
              <div style={{ fontSize: 20, margin: 16 }}>{amigosMock.find(a => a.id === amigoSelecionado)?.nome}</div>
              <div style={{ color: '#888' }}>[Informações do perfil do amigo aqui]</div>
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
              <span style={{ fontWeight: 600, marginBottom: 4 }}>Conversas</span>
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
                {conversasFiltradas.map(conversa => (
                  <button
                    key={conversa.id}
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
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      setConversaSelecionada(conversa.id);
                      setAmigoSelecionado(null);
                    }}
                  >
                    {conversa.nome}
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </aside>
      </div>
    </div>
  );
};

export default ChatPage;
