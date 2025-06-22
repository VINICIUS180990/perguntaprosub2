import { supabase } from '../supabaseClient';

export type ChatMessage = {
  id?: string;
  remetente_id: string;
  destinatario_id: string;
  texto: string;
  created_at?: string;
};

export async function enviarMensagem(remetente_id: string, destinatario_id: string, texto: string) {
  const { data, error } = await supabase
    .from('chat_mensagens')
    .insert([{ remetente_id, destinatario_id, texto }]);
  if (error) throw error;
  return data;
}

export async function buscarMensagens(remetente_id: string, destinatario_id: string) {
  const { data, error } = await supabase
    .from('chat_mensagens')
    .select('*')
    .or(`and(remetente_id.eq.${remetente_id},destinatario_id.eq.${destinatario_id}),and(remetente_id.eq.${destinatario_id},destinatario_id.eq.${remetente_id})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as ChatMessage[];
}
