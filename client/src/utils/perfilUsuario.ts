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
  // Insere perfil do usuário na tabela perfil_usuario
  return await supabase.from("perfil_usuario").insert([
    { user_id, nome, nomeguerra, posto, forca, om, celular, email }
  ]);
}

// Função para alterar a senha do usuário autenticado
export async function alterarSenhaUsuario(novaSenha: string) {
  // Atualiza a senha do usuário autenticado
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  return { error };
}
