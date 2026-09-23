import { createClient } from '@supabase/supabase-js';

// Fallback gracefully se as variáveis não existirem (Mock mode para validação de UI)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';
const isMock = supabaseUrl.includes('mock');

export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveLead = async (email: string, source_tool: string, result_data: any) => {
  if (isMock) {
    console.log('[Supabase Mock] Lead Capturado com Sucesso:', { email, source_tool, result_data });
    
    // Simula latência de rede
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Salva no localStorage para simular o dashboard interno
    let leads: any[] = [];
    try {
      const stored = localStorage.getItem('zyc_mock_leads');
      leads = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(leads)) leads = [];
    } catch {
      leads = [];
    }
    leads.push({ email, source_tool, created_at: new Date().toISOString() });
    localStorage.setItem('zyc_mock_leads', JSON.stringify(leads));
    
    return { success: true, error: null };
  }

  // Operação Real no Supabase
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        { email, source_tool, result_data, created_at: new Date().toISOString() }
      ]);
    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
};
