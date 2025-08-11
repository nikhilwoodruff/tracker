// Client-side function to process entries
// This can be used in static deployments

import { createClient } from '@/lib/supabase/client'

export async function processEntry(message: string, selectedDate?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const targetDate = selectedDate || new Date().toISOString().split('T')[0]

  // Option 1: Use Supabase Edge Function (recommended for production)
  if (process.env.NEXT_PUBLIC_USE_EDGE_FUNCTION === 'true') {
    const { data, error } = await supabase.functions.invoke('process-entry', {
      body: { message }
    })

    if (error) throw error

    const analysis = data.data

    // Check if entry exists for this date
    const { data: existingEntry } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', targetDate)
      .single()

    const entryData = {
      user_id: user.id,
      content: message,
      date: targetDate,
      
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
    }

    let dbError
    if (existingEntry) {
      // Update existing entry
      const { error } = await supabase
        .from('entries')
        .update(entryData)
        .eq('id', existingEntry.id)
      dbError = error
    } else {
      // Insert new entry
      const { error } = await supabase
        .from('entries')
        .insert(entryData)
      dbError = error
    }

    if (dbError) throw dbError

    return { success: true, data: analysis }
  }

  // Option 2: Use API route (for development/server deployments)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, date: targetDate }),
  })

  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error || 'Failed to process entry')
  }

  return data
}