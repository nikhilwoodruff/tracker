// Deploy this as a Supabase Edge Function
// Run: supabase functions deploy process-entry

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.38.0'

const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set')
}

const anthropic = new Anthropic({
  apiKey: apiKey,
})

const SYSTEM_PROMPT = `You are an AI assistant that extracts structured data from daily journal entries. Analyze the user's message and extract ALL relevant metrics with certainty scores (0-1 scale).

CRITICAL CALORIE ESTIMATION RULES:
- Be RIGOROUS with calorie counting - aim for CENTRAL CASE estimates, not conservative ones

Return ONLY a JSON object with the following structure (no additional text or notes):
{
  "nutrition": {
    "calories": number (ALWAYS estimate, never null),
    "calories_certainty": 0-1,
    "protein_g": number (ALWAYS estimate, never null),
    "protein_certainty": 0-1,
    "carbs_g": number (ALWAYS estimate, never null),
    "carbs_certainty": 0-1,
    "fat_g": number (ALWAYS estimate, never null),
    "fat_certainty": 0-1,
    "fiber_g": number (ALWAYS estimate, never null),
    "meals": ["list of meals/foods mentioned"]
  },
  "exercise": {
    "minutes": number (ALWAYS estimate, 0 if no exercise),
    "types": ["running", "weights", "yoga", etc],
    "intensity": "low" | "moderate" | "high" | "none",
    "steps": number (estimate based on activities)
  },
  "mood": {
    "score": 1-10 (ALWAYS estimate from tone/content),
    "certainty": 0-1,
    "energy_level": 1-10 (ALWAYS estimate),
    "notes": "any mood-related observations"
  },
  "sleep": {
    "hours": number (ALWAYS estimate, typical 7-8 if not mentioned),
    "quality": 1-10 (ALWAYS estimate based on mood/energy)
  },
  "weight": {
    "kg": number or null (ONLY if explicitly mentioned),
    "lbs": number or null (ONLY if explicitly mentioned),
    "certainty": 0-1
  },
  "hourly_activities": {
    "0": "sleeping",
    "1": "sleeping",
    "2": "sleeping",
    "3": "sleeping",
    "4": "sleeping",
    "5": "sleeping",
    "6": "activity at 6am",
    "7": "activity at 7am",
    "8": "activity at 8am",
    "9": "activity at 9am",
    "10": "activity at 10am",
    "11": "activity at 11am",
    "12": "activity at 12pm",
    "13": "activity at 1pm",
    "14": "activity at 2pm",
    "15": "activity at 3pm",
    "16": "activity at 4pm",
    "17": "activity at 5pm",
    "18": "activity at 6pm",
    "19": "activity at 7pm",
    "20": "activity at 8pm",
    "21": "activity at 9pm",
    "22": "activity at 10pm",
    "23": "activity at 11pm"
  },
  "productive_hours": number (ALWAYS estimate based on work/study mentions),
  "category": "work" | "personal" | "health" | "mixed",
  "tags": ["relevant", "tags"],
  "summary": "brief summary of the day"
}

IMPORTANT INSTRUCTIONS:
1. ALWAYS provide estimates for ALL metrics except weight - never use null except for weight
2. For nutrition: Estimate calories, protein, carbs, fat, fiber for EVERYTHING eaten. VERIFY: calories ≈ (protein_g × 4) + (carbs_g × 4) + (fat_g × 9). Adjust if needed
3. For hourly_activities: Fill in ALL 24 hours (0-23). Use reasonable assumptions:
   - Default sleeping hours: 0-6 or 23-6 based on bedtime mentions
   - Fill work hours if mentioned (e.g., "worked 9-5" = working from 9-17)
   - Estimate meal times if not specified (breakfast ~7-8, lunch ~12-13, dinner ~18-19)
   - Fill gaps with likely activities (commuting, relaxing, preparing for bed, etc.)
4. For sleep: If not mentioned, estimate 7-8 hours based on energy/mood
5. For exercise: If no exercise mentioned, use 0 minutes. Include walking/commuting as light exercise
6. For mood/energy: ALWAYS estimate from tone, even if subtle (1=terrible, 5=neutral, 10=excellent)
7. For productive_hours: Count work, study, chores, errands as productive
8. Weight is the ONLY metric that should be null if not explicitly mentioned
9. Set certainty scores lower (0.3-0.5) for estimates, higher (0.7-1.0) for explicit mentions
10. CRITICAL: Return ONLY valid JSON - no explanatory text, notes, or comments before or after the JSON object`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { message } = await req.json()
    
    if (!message) {
      throw new Error('No message provided in request body')
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: message }
      ],
    })

    const responseText = completion.content[0].type === 'text' ? completion.content[0].text : ''
    
    // Try to parse the JSON response, with better error handling
    let analysis
    try {
      // First attempt: parse as-is
      analysis = JSON.parse(responseText)
    } catch (parseError) {
      // Second attempt: extract JSON from the response
      try {
        // Find the first { and last } to extract just the JSON object
        const jsonStart = responseText.indexOf('{')
        const jsonEnd = responseText.lastIndexOf('}')
        
        if (jsonStart === -1 || jsonEnd === -1) {
          throw new Error('No JSON object found in response')
        }
        
        const jsonString = responseText.substring(jsonStart, jsonEnd + 1)
        analysis = JSON.parse(jsonString)
      } catch (extractError) {
        console.error('Failed to parse AI response:', responseText)
        throw new Error(`Invalid JSON response from AI: ${parseError.message}`)
      }
    }

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
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
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