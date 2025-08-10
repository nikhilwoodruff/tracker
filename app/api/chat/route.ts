import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
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
8. For weight, extract if mentioned (e.g., "weighed 75kg", "I'm 165 lbs"). Convert between kg/lbs if only one is given (1 kg = 2.20462 lbs)

Example foods for reference:
- Chicken breast (100g): 165 cal, 31g protein, 0g carbs, 3.6g fat
- Rice (1 cup cooked): 205 cal, 4.3g protein, 45g carbs, 0.4g fat
- Banana: 105 cal, 1.3g protein, 27g carbs, 0.4g fat
- Eggs (2 large): 140 cal, 12g protein, 1g carbs, 10g fat`

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await request.json()

  try {
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

    const { error } = await supabase.from('entries').insert({
      user_id: user.id,
      content: message,
      date: new Date().toISOString().split('T')[0],
      
      // Nutrition
      calories: analysis.nutrition?.calories,
      calories_certainty: analysis.nutrition?.calories_certainty,
      protein_g: analysis.nutrition?.protein_g,
      protein_certainty: analysis.nutrition?.protein_certainty,
      carbs_g: analysis.nutrition?.carbs_g,
      carbs_certainty: analysis.nutrition?.carbs_certainty,
      fat_g: analysis.nutrition?.fat_g,
      fat_certainty: analysis.nutrition?.fat_certainty,
      fiber_g: analysis.nutrition?.fiber_g,
      
      // Exercise
      exercise_minutes: analysis.exercise?.minutes,
      exercise_type: analysis.exercise?.types,
      exercise_intensity: analysis.exercise?.intensity,
      steps: analysis.exercise?.steps,
      
      // Mood & wellness
      mood_score: analysis.mood?.score,
      mood_certainty: analysis.mood?.certainty,
      energy_level: analysis.mood?.energy_level,
      sleep_hours: analysis.sleep?.hours,
      sleep_quality: analysis.sleep?.quality,
      
      // Body metrics
      weight_kg: analysis.weight?.kg,
      weight_lbs: analysis.weight?.lbs,
      weight_certainty: analysis.weight?.certainty,
      
      // Time tracking
      hourly_activities: analysis.hourly_activities,
      productive_hours: analysis.productive_hours,
      
      // General
      category: analysis.category,
      tags: analysis.tags,
      metadata: {
        meals: analysis.nutrition?.meals,
        mood_notes: analysis.mood?.notes,
        summary: analysis.summary
      },
      ai_analysis: analysis,
    })

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      data: analysis,
      message: 'Entry logged successfully'
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}