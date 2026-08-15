import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export const VOICE_TOOLS_SCHEMA = [
  {
    type: 'function',
    function: {
      name: 'get_children',
      description: 'Get the list of all registered children with their names, ages, and developmental stages.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_feeding_history',
      description: 'Retrieve logged feeding history for a specific child.',
      parameters: {
        type: 'object',
        properties: {
          child_name: {
            type: 'string',
            description: 'Name of the child (e.g., Ava or Mira).',
          },
          limit: {
            type: 'number',
            description: 'Number of recent records to retrieve (default 5).',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_todays_feeding_summary',
      description: "Get today's total feedings and summary for a child.",
      parameters: {
        type: 'object',
        properties: {
          child_name: {
            type: 'string',
            description: 'Name of the child (e.g., Ava or Mira).',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_feeding',
      description: 'Log a new feeding session for a specific child into the health database.',
      parameters: {
        type: 'object',
        properties: {
          child_name: {
            type: 'string',
            description: 'Name of the child (e.g., Ava or Mira).',
          },
          feeding_type: {
            type: 'string',
            enum: ['breastfeeding', 'expressed', 'formula', 'solids'],
            description: 'Type of feeding.',
          },
          amount_ml: {
            type: 'number',
            description: 'Volume in milliliters if applicable.',
          },
          duration_minutes: {
            type: 'number',
            description: 'Nursing duration in minutes if applicable.',
          },
          food_name: {
            type: 'string',
            description: 'Name of solid food or puree if solids.',
          },
          notes: {
            type: 'string',
            description: 'Observations, reactions, or notes.',
          },
        },
        required: ['child_name', 'feeding_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hydration',
      description: "Get the mother's daily water intake status and hydration goal.",
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_hydration',
      description: "Log water or beverage consumption in milliliters for the mother's hydration tracker.",
      parameters: {
        type: 'object',
        properties: {
          amount_ml: {
            type: 'number',
            description: 'Amount in milliliters (e.g. 250, 400, 500).',
          },
          beverage_type: {
            type: 'string',
            description: 'Type of beverage (water, herbal tea, electrolyte). Defaults to water.',
          },
        },
        required: ['amount_ml'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_meals',
      description: "Retrieve recent meal scanner analyses and nutrient breakdowns for the mother's plate.",
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to_section',
      description: 'Navigate the application UI to a specific screen or section upon user request.',
      parameters: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: ['dashboard', 'scanner', 'journey', 'feeding', 'wellness', 'hydration', 'nutrition', 'history', 'profile', 'settings'],
            description: 'Target section route to open.',
          },
          target_child: {
            type: 'string',
            description: 'Optional name of child if navigating to child-specific view like journey or feeding.',
          },
        },
        required: ['section'],
      },
    },
  },
];

type ChildItem = {
  name: string;
  ageFormatted?: string;
  ageMonths?: number;
  developmentalStage?: string;
  feedingMethod?: string;
  complications?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      messages = [],
      motherContext,
      childrenContext = [],
    } = body as {
      messages?: unknown[];
      motherContext?: {
        name?: string;
        postpartumDay?: number;
        postpartumStage?: string;
        feedingMethod?: string;
        dietaryRestrictions?: string;
        complications?: string;
        todayWaterMl?: number;
      };
      childrenContext?: ChildItem[];
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const motherName = motherContext?.name || 'Mama';
    const postpartumDay = motherContext?.postpartumDay ?? 42;
    const postpartumStage = motherContext?.postpartumStage || 'Postpartum recovery';
    const feedingMethod = motherContext?.feedingMethod || 'mixed';
    const dietary = motherContext?.dietaryRestrictions || 'None';
    const motherComplications = motherContext?.complications || 'Mild Anaemia';
    const todayWater = motherContext?.todayWaterMl ?? 1250;

    const childrenSummary = childrenContext.length > 0
      ? childrenContext.map((c, i) => {
          return `- Child ${i + 1}: ${c.name}, ${c.ageFormatted || ''} (${c.ageMonths ?? 0}m), Stage: ${c.developmentalStage || 'Standard'}, Feeding: ${c.feedingMethod || 'solids'}${c.complications && c.complications !== 'None' ? `, Medical note: ${c.complications}` : ''}`;
        }).join('\n')
      : '- Demo Children: Ava (8 months, solids exploration), Mira (2 months, exclusive breastfeeding, mild reflux)';

    const systemPrompt = `You are NavAura Voice AI, a calm, warm, human, supportive, and concise maternal & infant nutrition companion powered by Groq.
You are speaking directly with ${motherName} via real-time voice.

MOTHER PROFILE:
- Name: ${motherName}
- Postpartum Stage: Day ${postpartumDay} (${postpartumStage})
- Feeding Method: ${feedingMethod}
- Dietary Notes: ${dietary}
- Medical Complications: ${motherComplications}
- Today's Water: ${(todayWater / 1000).toFixed(1)} L / 2.5 L goal

REGISTERED CHILDREN:
${childrenSummary}

CRITICAL MULTI-CHILD & CONVERSATION RULES:
1. Multi-Child Disambiguation:
   - When the user asks about or wants to log an action for "the baby" and multiple children exist, ask gently which child she means (e.g. "Should I check that for Ava or Mira?").
   - Never confuse Ava's records with Mira's records.
   - When a specific child is named (e.g. "Ava"), operate strictly on that child.
2. Tool Usage:
   - Use functions (tools) to retrieve real database data (get_feeding_history, get_todays_feeding_summary, get_hydration, get_recent_meals) or write data (log_feeding, log_hydration).
   - Use 'navigate_to_section' when the user asks to see or open a screen (e.g. "Show me baby journey", "Take me to meal scanner", "Open hydration").
3. Voice-Friendly Tone:
   - Speak naturally and warmly. Keep responses concise (1 to 3 short sentences) because this is a spoken conversation.
   - Do NOT use markdown asterisks (*, **), bullet lists, or robotic greetings.
   - For database writes (e.g. log_feeding), confirm once completed: "Done. I've logged 120 ml of formula for Ava."
4. Clinical Safety:
   - Provide educational nutrition guidance grounded in WHO/UNICEF/AAP guidelines.
   - Never diagnose, prescribe medications, or replace a healthcare provider. For concerning symptoms, kindly advise consulting a pediatrician or obstetrician.`;

    const MODELS = [
      'llama-3.3-70b-versatile',
      'qwen/qwen3.6-27b',
      'llama-3.1-8b-instant',
    ];

    for (const model of MODELS) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            tools: VOICE_TOOLS_SCHEMA,
            tool_choice: 'auto',
            temperature: 0.5,
            max_tokens: 300,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          const errText = await response.text();
          throw new Error(`Groq HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const choice = data?.choices?.[0];

        if (!choice) throw new Error('No choice returned from Groq');

        return NextResponse.json({
          message: choice.message,
          finish_reason: choice.finish_reason,
        });
      } catch (err) {
        console.warn(`Model ${model} attempt error:`, err);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: `I'm here with you, ${motherName}. How can I assist you and your little ones today?`,
      },
      finish_reason: 'stop',
    });
  } catch (err) {
    console.error('Voice chat error:', err);
    return NextResponse.json({ error: 'Failed to process voice conversation' }, { status: 500 });
  }
}
