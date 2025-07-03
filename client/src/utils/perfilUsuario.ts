// Função utilitária para inserir perfil do usuário após cadastro
import { supabase } from "../supabaseClient";

export async function inserirPerfilUsuario({
  user_id,
  nome = "",
  nomeguerra = "",
  posto = "",
  forca = "",
  om = "",
  celular = "",
  email = ""
}: {
  user_id: string;
  nome?: string;
  nomeguerra?: string;
  posto?: string;
  forca?: string;
  om?: string;
  celular?: string;
  email?: string;
}) {
  try {
    console.log("=== DEBUG INSERÇÃO PERFIL ===");
    console.log("Dados a inserir:", { user_id, nome, nomeguerra, posto, forca, om, celular, email });
    
    // Insere perfil do usuário na tabela perfil_usuario
    const result = await supabase.from("perfil_usuario").insert([
      { user_id, nome, nomeguerra, posto, forca, om, celular, email }
    ]).select();
    
    console.log("Resultado da inserção:", result);
    
    if (result.error) {
      console.error("Erro na inserção do perfil:", result.error);
      console.error("Detalhes do erro:", {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code
      });
    } else {
      console.log("Perfil inserido com sucesso:", result.data);
    }
    
    return result;
  } catch (error) {
    console.error("Erro inesperado na inserção do perfil:", error);
    return { error, data: null };
  }
}

// Função para alterar a senha do usuário autenticado
export async function alterarSenhaUsuario(novaSenha: string) {
  // Atualiza a senha do usuário autenticado
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  return { error };
}
