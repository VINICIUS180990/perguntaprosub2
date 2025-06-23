import { supabase } from '../supabaseClient';

export type ChatMessage = {
  id?: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  created_at?: string;
  removido_por?: string[];
};

export async function enviarMensagem(remetente_id: string, destinatario_id: string, texto: string) {
  const { data, error } = await supabase
    .from('mensagens')
    .insert([{ remetente_id, destinatario_id, texto }]);
  if (error) throw error;
  return data;
}

export async function buscarMensagens(remetente_id: string, destinatario_id: string, userId: string) {
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .or(`and(remetente_id.eq.${remetente_id},destinatario_id.eq.${destinatario_id}),and(remetente_id.eq.${destinatario_id},destinatario_id.eq.${remetente_id})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  // Filtra mensagens que não foram removidas pelo usuário logado
  return (data as ChatMessage[]).filter(msg => !msg.removido_por || !msg.removido_por.includes(userId));
}

export async function removerMensagensParaUsuario(remetente_id: string, destinatario_id: string, userId: string) {
  // Busca todas as mensagens entre os dois usuários
  const { data, error } = await supabase
    .from('mensagens')
    .select('id, removido_por')
    .or(`and(remetente_id.eq.${remetente_id},destinatario_id.eq.${destinatario_id}),and(remetente_id.eq.${destinatario_id},destinatario_id.eq.${remetente_id})`);
  if (error) throw error;
  if (!data) return;
  // Atualiza cada mensagem individualmente para adicionar o userId ao array removido_por
  for (const msg of data) {
    const removidoPor = Array.isArray(msg.removido_por) ? msg.removido_por : [];
    if (!removidoPor.includes(userId)) {
      await supabase
        .from('mensagens')
        .update({ removido_por: [...removidoPor, userId] })
        .eq('id', msg.id);
    }
  }
}
