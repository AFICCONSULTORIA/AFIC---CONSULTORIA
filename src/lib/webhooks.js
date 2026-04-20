// AFIC Event Webhooks - Automation Triggers
// Este código pode ser executado como Edge Function no Supabase

// Gatilho 1: Quando usuário conclui Módulo 3
// Endpoint: https://sueyfodlqcviojivlxgv.supabase.co/functions/v1/webhook-trigger
// Called when: POST with { event_type: 'module_completed', module_id: 'modulo_3' }

export const triggerModuleCompleted = async (userId, moduleId) => {
  try {
    // 1. Registrar evento no banco
    const { error } = await supabase
      .from('afic_events')
      .insert({
        user_id: userId,
        event_type: 'modulo_3_concluido',
        event_data: { 
          module_id: moduleId,
          timestamp: new Date().toISOString()
        },
        processed: false
      });

    if (error) throw error;

    // 2. Enviar para CRM/ActiveCampaign (exemplo)
    // Você precisa configurar a API do seu CRM
    /*
    await fetch('https://your-crm-api.com/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'modulo_3_concluido',
        user_id: userId,
        module: moduleId,
        campaign: 'O Próximo Nível'
      })
    });
    */

    console.log('Evento modulo_3_concluido registrado para usuário:', userId);
    return { success: true };

  } catch (err) {
    console.error('Erro ao registrar evento:', err);
    return { error: err.message };
  }
};

// Gatilho 2: Trial expirado (21 dias após criação)
// Este pode ser executado via Cron Job (supabase functions cron)
// Configuration: "0 9 * * *" (todo dia às 9h)

export const checkAndTriggerExpiredTrials = async () => {
  try {
    const twentyOneDaysAgo = new Date();
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

    // Buscar usuários com trial expirado
    const { data: users } = await supabase
      .from('afic_subscriptions_tier')
      .select('user_id, started_at, trial_ends_at')
      .eq('status', 'trial')
      .lt('trial_ends_at', new Date().toISOString())
      .lt('started_at', twentyOneDaysAgo.toISOString());

    if (!users || users.length === 0) {
      console.log('Nenhum trial para expirar hoje');
      return { processed: 0 };
    }

    // Registrar eventos para cada usuário
    for (const user of users) {
      await supabase
        .from('afic_events')
        .insert({
          user_id: user.user_id,
          event_type: 'trial_ferramentas_expirado',
          event_data: {
            days_since_creation: 21,
            timestamp: new Date().toISOString()
          },
          processed: false
        });

      // Atualizar status do trial
      await supabase
        .from('afic_subscriptions_tier')
        .update({ status: 'expired' })
        .eq('user_id', user.user_id);
    }

    console.log(`Processados ${users.length} trials expirados`);
    return { processed: users.length };

  } catch (err) {
    console.error('Erro ao verificar trials:', err);
    return { error: err.message };
  }
};

// Função para verificar se é hora de fazer upgrade
export const checkUpgradeOpportunity = async (userId) => {
  try {
    // Buscar progresso do usuário
    const { data: progress } = await supabase
      .from('afic_module_progress')
      .select('module_id, completed')
      .eq('user_id', userId)
      .eq('completed', true);

    // Se completou módulos 1, 2 e 3, sugerir upgrade
    const completedModules = progress?.map(p => p.module_id) || [];
    const shouldUpsell = ['modulo_1', 'modulo_2', 'modulo_3'].every(
      m => completedModules.includes(m)
    );

    if (shouldUpsell) {
      // Registrar evento de upsell
      await supabase
        .from('afic_events')
        .insert({
          user_id: userId,
          event_type: 'upsell_opportunity',
          event_data: {
            reason: 'completed_modules_1_3',
            timestamp: new Date().toISOString()
          },
          processed: false
        });
    }

    return { shouldUpsell };

  } catch (err) {
    console.error('Erro ao verificar opportunity:', err);
    return { error: err.message };
  }
};

// Exportar como Edge Function
/*
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { event_type, user_id, module_id } = await req.json();

    if (event_type === 'module_completed' && module_id === 'modulo_3') {
      await triggerModuleCompleted(user_id, module_id);
    }

    if (event_type === 'check_trials') {
      const result = await checkAndTriggerExpiredTrials();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
*/