import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, context, history } = await request.json()

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
${JSON.stringify(context, null, 2)}`

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

    return NextResponse.json({ 
      success: true, 
      response: responseText 
    })

  } catch (error: any) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}