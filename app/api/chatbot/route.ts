import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, context, history } = await request.json()

    // Build conversation history for Claude
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful health and wellness assistant analyzing the user's tracked data from the last 10 days. 
        
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
      }
    ]

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      })
    }

    // Add current message
    messages.push({
      role: 'user' as const,
      content: message
    })

    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      messages: messages as any,
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