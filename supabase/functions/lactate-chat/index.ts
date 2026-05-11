// Conversational assistant for the LacTest data-entry screen.
// Uses the Lovable AI Gateway. Server-side only.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `Je bent de ingebouwde assistent van MyLactest, op het data-invoer scherm van een lactaattest.

Op dit scherm kan de gebruiker:
- Per trap de tijd (mm:ss), lactaatwaarde (mmol/L) en hartslag (bpm) invullen.
- Bovenaan één keer de afstand per trap instellen (standaard 1600 m).
- De rustlactaat invullen (optioneel).
- Trappen toevoegen of verwijderen, een trap markeren als all-out.
- Een screenshot of foto van een papieren testblad plakken of uploaden — die wordt automatisch ingelezen.
- Een JSON-bestand importeren.
- Het protocol aanpassen via "Protocol instellingen".
- Met sneltoetsen werken: Tab = volgende cel, Enter = nieuwe rij, ⌘/Ctrl+S = berekenen, ⌘/Ctrl+V = plakken, ⌘/Ctrl+Enter = versturen in dit chatvenster.
- Op "Genereer rapport" klikken zodra minstens 3 trappen ingevuld zijn — dan worden LT1 en LT2 berekend.

Antwoord altijd in het Nederlands, kort, vriendelijk en concreet. Geen lange uitleg, geen mmol/L drempels noemen (focus op HR en tempo). Gebruik markdown met bullets waar nuttig. Bied hulp aan zoals: "wil je dat ik je screenshot inlees?" als de vraag daarover gaat.`;

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json() as { messages: ChatMessage[] };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing messages' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Even rustig — limiet bereikt. Probeer zo opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: 'AI-credits opgebruikt. Voeg credits toe in Lovable Cloud.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: `AI gateway error: ${txt}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResp.json();
    const reply: string = aiData?.choices?.[0]?.message?.content ?? '…';

    return new Response(JSON.stringify({ reply }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
