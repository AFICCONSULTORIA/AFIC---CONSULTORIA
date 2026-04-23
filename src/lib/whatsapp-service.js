/**
 * AFIC WhatsApp Service - Meta Cloud API Integration
 * Este serviço gerencia o envio de mensagens automáticas via WhatsApp Business API.
 */

const PHONE_NUMBER_ID = 'SEU_PHONE_NUMBER_ID'; // Obter no Facebook Developers
const ACCESS_TOKEN = 'SEU_ACCESS_TOKEN';       // Token Permanente da Meta
const API_VERSION = 'v21.0';

/**
 * Envia uma mensagem usando um Template aprovado na Meta.
 * A Meta exige o uso de templates para iniciar conversas com leads.
 * 
 * @param {string} to - Número do destinatário (com código do país, ex: 5566991152002)
 * @param {string} templateName - Nome do template aprovado (ex: hello_world)
 * @param {Array} parameters - Variáveis do template (opcional)
 */
export const sendWhatsAppTemplate = async (to, templateName, parameters = []) => {
    // Normalizar número (remover caracteres não numéricos)
    const cleanNumber = to.replace(/\D/g, '');
    
    // Se o número não começar com 55, assumimos Brasil (ajuste se necessário)
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;

    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        to: finalNumber,
        type: 'template',
        template: {
            name: templateName,
            language: {
                code: 'pt_BR'
            }
        }
    };

    // Adicionar parâmetros se existirem
    if (parameters.length > 0) {
        payload.template.components = [
            {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p }))
            }
        ];
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Erro ao enviar WhatsApp');
        }

        console.log('WhatsApp enviado com sucesso:', data);
        return { success: true, data };
    } catch (error) {
        console.error('Erro no serviço de WhatsApp:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Envia uma mensagem de texto simples (Apenas se o usuário interagiu nas últimas 24h)
 */
export const sendWhatsAppMessage = async (to, message) => {
    const cleanNumber = to.replace(/\D/g, '');
    const finalNumber = cleanNumber.length <= 11 ? `55${cleanNumber}` : cleanNumber;
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

    const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: finalNumber,
        type: 'text',
        text: { body: message }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        return { success: response.ok, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};
/**
 * Notifica o administrador sobre novos eventos (leads, vendas, etc).
 */
export const sendAdminNotification = async (message) => {
    const ADMIN_NUMBER = '5566991152002'; // Substitua pelo seu número de administrador
    return sendWhatsAppMessage(ADMIN_NUMBER, message);
};
