// Deploy this as a Supabase Edge Function
// Run: supabase functions deploy chatbot

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import Anthropic from 'npm:@anthropic-ai/sdk@0.38.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0'

const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
if (!anthropicKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set')
}

const anthropic = new Anthropic({
  apiKey: anthropicKey,
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { message, history } = await req.json()
    
    if (!message) {
      throw new Error('No message provided')
    }

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Fetch last 10 days of data
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const { data: entries, error: dataError } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', tenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (dataError) {
      throw new Error(`Failed to fetch data: ${dataError.message}`)
    }

    // Build system prompt with context
    const systemPrompt = `You are a helpful health and wellness assistant analyzing the user's tracked data from the last 10 days. 
        
The data includes:
- Nutrition: calories, protein, carbs, fat, fiber
- Exercise: duration, type, intensity
- Sleep: hours and quality
- Mood: score and energy level
- Weight measurements
- Daily activities by hour
- Productive hours

Provide helpful insights, identify patterns, and answer questions about their health data. Be concise but thorough.
Keep responses friendly and supportive. Use specific numbers and dates when referencing their data.

Here is their recent data (last 10 days):
${JSON.stringify(entries, null, 2)}`

    // Build messages array for Claude
    const messages: Array<{ role: 'user' | 'assistant', content: string }> = []

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        }
      })
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    })

    // Get response from Claude
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages,
    })

    const responseText = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : 'Sorry, I could not generate a response.'

    return new Response(
      JSON.stringify({ success: true, response: responseText }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error) {
    console.error('Chatbot error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
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