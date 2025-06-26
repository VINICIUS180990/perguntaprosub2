// Script de teste para verificar a inserção na tabela perfil_usuario
import { supabase } from "./supabaseClient";

async function testarConexao() {
  console.log("=== TESTE DE CONEXÃO SUPABASE ===");
  
  try {
    // Teste 1: Verificar estrutura da tabela
    console.log("1. Verificando estrutura da tabela perfil_usuario...");
    const { data: schema, error: schemaError } = await supabase
      .from("perfil_usuario")
      .select("*")
      .limit(0);
    
    if (schemaError) {
      console.error("❌ Erro ao acessar tabela:", schemaError);
      return;
    }
    
    console.log("✅ Tabela acessível");
    
    // Teste 2: Verificar se existem registros
    console.log("2. Verificando registros existentes...");
    const { data: registros, error: registrosError } = await supabase
      .from("perfil_usuario")
      .select("*")
      .limit(5);
    
    if (registrosError) {
      console.error("❌ Erro ao buscar registros:", registrosError);
    } else {
      console.log(`✅ Encontrados ${registros.length} registros:`, registros);
    }
    
    // Teste 3: Tentar inserir um registro de teste
    console.log("3. Tentando inserir registro de teste...");
    const dadosTeste = {
      user_id: "test-uuid-12345",
      nome: "Usuario Teste",
      nomeguerra: "Teste",
      posto: "Teste",
      forca: "teste",
      om: "OM Teste",
      celular: "11999999999",
      email: "teste@exemplo.com"
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from("perfil_usuario")
      .insert([dadosTeste])
      .select();
    
    if (insertError) {
      console.error("❌ Erro ao inserir teste:", insertError);
      console.error("Detalhes do erro:", insertError.message);
      console.error("Código do erro:", insertError.code);
      console.error("Dica:", insertError.hint);
    } else {
      console.log("✅ Inserção de teste bem-sucedida:", insertData);
      
      // Limpar o teste
      await supabase
        .from("perfil_usuario")
        .delete()
        .eq("user_id", "test-uuid-12345");
      console.log("🧹 Registro de teste removido");
    }
    
  } catch (error) {
    console.error("💥 Erro geral:", error);
  }
}

// Executar teste
testarConexao();
