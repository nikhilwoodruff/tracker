# Deploy Supabase Edge Function for GitHub Pages

To enable logging entries from the deployed GitHub Pages site, you need to set up a Supabase Edge Function.

## Prerequisites

1. Supabase project (you already have this)
2. Supabase CLI installed
3. Your Anthropic API key

## Quick Setup

Run the provided script:

```bash
./setup-edge-function.sh
```

## Manual Setup

If you prefer to set up manually:

### 1. Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

### 2. Initialize Supabase

```bash
supabase init
```

### 3. Link to your project

Get your project ref from your Supabase URL (the part before `.supabase.co`):

```bash
supabase link --project-ref rrwvraadqpuvyiudvjyt
```

### 4. Set your Anthropic API key as a secret

```bash
supabase secrets set ANTHROPIC_API_KEY=your_api_key_here
```

### 5. Deploy the Edge Function

```bash
# Copy the function to the right location
mkdir -p supabase/functions/process-entry
cp supabase-functions/process-entry/index.ts supabase/functions/process-entry/

# Deploy
supabase functions deploy process-entry
```

### 6. Update GitHub Secrets

Add this secret to your GitHub repository:
- `NEXT_PUBLIC_USE_EDGE_FUNCTION`: Set to `true`

### 7. Test the Edge Function

You can test it directly:

```bash
curl -X POST https://rrwvraadqpuvyiudvjyt.supabase.co/functions/v1/process-entry \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test entry"}'
```

## How It Works

1. When you submit an entry on the deployed site, it sends the message to the Edge Function
2. The Edge Function uses your Anthropic API key (stored securely in Supabase) to process the entry
3. The processed data is saved to your Supabase database
4. The UI updates to show your new entry

## Security

- Your Anthropic API key is stored securely in Supabase secrets, never exposed to the client
- The Edge Function runs on Supabase's servers, not in the browser
- Only authenticated users can create entries (enforced by RLS policies)

## Troubleshooting

If the Edge Function doesn't work:

1. Check the function logs:
   ```bash
   supabase functions logs process-entry
   ```

2. Verify your Anthropic API key is set:
   ```bash
   supabase secrets list
   ```

3. Make sure CORS is enabled (the function already includes CORS headers)

4. Test with a simple curl command first before using the web interface