import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type CompanyMembership = {
  company_id: string;
};

export async function resolveUserCompanyId(user: User) {
  if (!user.email) {
    return null;
  }

  /*
   * Solução temporária da Fase 4:
   * enquanto não há cadastro de empresa nem vínculo direto com auth.users,
   * o painel resolve a empresa pelo e-mail do usuário autenticado na tabela
   * public.users. Isso preserva o isolamento por company_id e evita usar
   * qualquer empresa fixa, dado real ou fallback inseguro.
   */
  const { data, error } = await supabase
    .from('users')
    .select('company_id')
    .eq('email', user.email)
    .eq('active', true)
    .maybeSingle<CompanyMembership>();

  if (error) {
    throw error;
  }

  return data?.company_id ?? null;
}
