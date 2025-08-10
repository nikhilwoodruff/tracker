# Personal tracker

A clean, monospace-styled Next.js app that uses Claude AI to extract structured metrics from daily journal entries. Features automatic dark mode, D3 animated charts, and comprehensive health/productivity tracking.

## Features

- **Smart data extraction**: Claude AI analyzes your daily logs to extract:
  - Nutrition metrics (calories, protein, carbs, fat with certainty scores)
  - Exercise data (duration, type, intensity, steps)
  - Mood and energy levels (1-10 scale with certainty)
  - Sleep tracking (hours and quality)
  - Hourly activity mapping
  - Productive hours calculation

- **Beautiful visualizations**: Animated D3 charts show trends over time
- **Dark mode**: Automatically follows system preference
- **Clean UI**: Monospace font throughout for a neat, terminal-like aesthetic
- **Real-time updates**: Charts refresh as you add new entries
- **Certainty intervals**: AI provides confidence scores for inferred vs stated values

## Setup

1. Create a Supabase project at https://supabase.com

2. Run the SQL schema in `supabase/schema.sql` in your Supabase SQL editor

3. Update `.env.local` with your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Usage

Simply type natural language entries like:

"Woke up at 7am feeling great. Had 2 eggs and toast for breakfast (about 350 cal). Worked from 9-5 on the new project, very productive day. Ran 5k at 6pm, took 25 minutes. Had grilled chicken with rice for dinner. Mood was excellent today, energy 8/10. Slept 7.5 hours last night."

The AI will extract all relevant metrics and display them in charts.
