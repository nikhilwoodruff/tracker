// Deploy this as a Supabase Edge Function
// Run: supabase functions deploy process-entry

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!,
})

const SYSTEM_PROMPT = `You are an AI assistant that extracts structured data from daily journal entries. Analyze the user's message and extract ALL relevant metrics with certainty scores (0-1 scale).

Return a JSON object with the following structure:
{
  "nutrition": {
    "calories": number or null,
    "calories_certainty": 0-1,
    "protein_g": number or null,
    "protein_certainty": 0-1,
    "carbs_g": number or null,
    "carbs_certainty": 0-1,
    "fat_g": number or null,
    "fat_certainty": 0-1,
    "fiber_g": number or null,
    "meals": ["list of meals/foods mentioned"]
  },
  "exercise": {
    "minutes": number or null,
    "types": ["running", "weights", "yoga", etc],
    "intensity": "low" | "moderate" | "high" | null,
    "steps": number or null
  },
  "mood": {
    "score": 1-10 or null,
    "certainty": 0-1,
    "energy_level": 1-10 or null,
    "notes": "any mood-related observations"
  },
  "sleep": {
    "hours": number or null,
    "quality": 1-10 or null
  },
  "weight": {
    "kg": number or null,
    "lbs": number or null,
    "certainty": 0-1
  },
  "hourly_activities": {
    "6": "activity at 6am",
    "7": "activity at 7am",
    ...
  },
  "productive_hours": number or null,
  "category": "work" | "personal" | "health" | "mixed",
  "tags": ["relevant", "tags"],
  "summary": "brief summary of the day"
}

IMPORTANT INSTRUCTIONS:
1. For nutrition, use your knowledge of common foods to estimate macros. Be specific with numbers.
2. Extract time-based activities into hourly_activities (24-hour format)
3. Infer mood from tone and explicit statements (1=terrible, 5=neutral, 10=excellent)
4. Calculate productive hours based on work/study activities mentioned
5. Include certainty scores for values you're estimating vs explicitly stated
6. If information isn't available, use null rather than guessing wildly
7. Parse times mentioned (e.g., "worked 9-5" = activities from 9 to 17)
8. For weight, extract if mentioned (e.g., "weighed 75kg", "I'm 165 lbs"). Convert between kg/lbs if only one is given (1 kg = 2.20462 lbs)`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { message } = await req.json()

    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: message }
      ],
    })

    const responseText = completion.content[0].type === 'text' ? completion.content[0].text : ''
    const analysis = JSON.parse(responseText)

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})