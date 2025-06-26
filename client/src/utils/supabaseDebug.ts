// Arquivo para debug e teste das configurações do Supabase
import { supabase } from "../supabaseClient";

export async function testarConexaoSupabase() {
  console.log("=== TESTE DE CONEXÃO SUPABASE ===");
  
  try {
    // Teste 1: Verificar conexão básica
    console.log("1. Testando conexão básica...");
    const { error: testError } = await supabase
      .from("perfil_usuario")
      .select("count")
      .limit(1);
    
    if (testError) {
      console.error("❌ Erro na conexão:", testError);
      return false;
    }
    
    console.log("✅ Conexão básica OK");
    
    // Teste 2: Verificar configurações de autenticação
    console.log("2. Testando configurações de auth...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Erro ao verificar sessão:", sessionError);
    } else {
      console.log("✅ Auth configurado OK. Sessão atual:", session ? "Logado" : "Não logado");
    }
    
    // Teste 3: Verificar políticas RLS
    console.log("3. Testando acesso à tabela perfil_usuario...");
    const { error: rslError } = await supabase
      .from("perfil_usuario")
      .select("*")
      .limit(1);
    
    if (rslError) {
      console.error("❌ Erro RLS/Permissões:", rslError);
      console.log("💡 Verifique as políticas RLS na tabela perfil_usuario");
    } else {
      console.log("✅ Acesso à tabela OK");
    }
    
    return true;
  } catch (error) {
    console.error("💥 Erro geral:", error);
    return false;
  }
}

export async function testarCriacaoUsuario(email: string, senha: string, nome: string, nomeguerra: string) {
  console.log("=== TESTE DE CRIAÇÃO DE USUÁRIO ===");
  console.log("Email:", email);
  console.log("Nome:", nome);
  console.log("Nome de guerra:", nomeguerra);
  
  try {
    // Primeiro, verificar se o email já existe
    console.log("1. Verificando se email já existe...");
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          full_name: nome,
          nomeguerra: nomeguerra
        }
      }
    });
    
    console.log("Resultado signUp:", { signUpData, signUpError });
    
    return { data: signUpData, error: signUpError };
    
  } catch (error) {
    console.error("Erro inesperado no teste:", error);
    return { data: null, error };
  }
}
