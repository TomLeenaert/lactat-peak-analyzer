// Edge function: parse a photo/screenshot of a paper lactate test sheet
// into structured step data using Lovable AI Gateway (vision).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ParsedStep {
  distance?: number | null;     // meters
  time_sec?: number | null;     // seconds
  speed?: number | null;        // km/h
  lactate?: number | null;      // mmol/L
  hr?: number | null;           // bpm
}

interface ParsedSheet {
  resting_lactate?: number | null;
  steps: ParsedStep[];
  notes?: string;
}

const SYSTEM_PROMPT = `Je leest een foto of screenshot van een papieren of digitaal meetblad van een lactaattest (loop- of fietstest).
Extraheer ALLE testtredes uit de tabel en geef een strikt JSON-object terug — geen uitleg, geen markdown.

Schema:
{
  "resting_lactate": <number|null>,   // rustlactaat in mmol/L als zichtbaar, anders null
  "steps": [
    {
      "distance": <number|null>,      // afstand per trede in METERS (1.2 km -> 1200, 0.6 km -> 600). null als onbekend.
      "time_sec": <number|null>,      // totale duur trede in seconden. "0:07:36" -> 456. "7:36" -> 456.
      "speed": <number|null>,         // km/h als zichtbaar, anders null
      "lactate": <number|null>,       // mmol/L
      "hr": <number|null>             // bpm
    }
  ],
  "notes": <string>                   // korte opmerking als iets onduidelijk was
}

Regels:
- Komma is decimaalteken (1,7 -> 1.7).
- Tijden kunnen mm:ss of h:mm:ss zijn.
- Afstanden zijn vaak in km (1,2 -> 1200 m).
- Behoud de volgorde van de tredes zoals op het blad.
- Als een veld onleesbaar is, gebruik null. Maak NIETS op.
- Geef ALLEEN het JSON-object terug, niets anders.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { image, text } = await req.json();
    if ((!image || typeof image !== 'string') && (!text || typeof text !== 'string')) {
      return new Response(JSON.stringify({ error: 'Missing image or text' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dataUrl = image ? (image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`) : null;

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
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Lees deze lactaattest in en geef het JSON terug volgens het schema.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit bereikt. Probeer zo opnieuw.' }), {
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
    const content: string = aiData?.choices?.[0]?.message?.content ?? '{}';

    let parsed: ParsedSheet;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { steps: [] };
    }

    if (!Array.isArray(parsed.steps)) parsed.steps = [];

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
