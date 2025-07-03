import { supabase } from "../supabaseClient";

/**
 * Altera a senha do usuário autenticado no Supabase.
 * @param novaSenha Nova senha a ser definida
 * @returns { error: any } Objeto de erro, caso ocorra
 */
export async function alterarSenhaUsuario(novaSenha: string) {
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  return { error };
}
