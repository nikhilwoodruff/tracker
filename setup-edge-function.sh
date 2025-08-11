#!/bin/bash

# Setup script for Supabase Edge Function
echo "Setting up Supabase Edge Function for tracker..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found. Installing..."
    brew install supabase/tap/supabase
fi

# Initialize Supabase if not already done
if [ ! -d "supabase" ]; then
    echo "Initializing Supabase..."
    supabase init
fi

# Copy the edge function
mkdir -p supabase/functions/process-entry
cp supabase-functions/process-entry/index.ts supabase/functions/process-entry/

# Link to your Supabase project
echo "Enter your Supabase project ref (from your project URL):"
read PROJECT_REF
supabase link --project-ref $PROJECT_REF

# Set the Anthropic API key secret
echo "Enter your Anthropic API key:"
read -s ANTHROPIC_KEY
supabase secrets set ANTHROPIC_API_KEY=$ANTHROPIC_KEY

# Deploy the function
echo "Deploying Edge Function..."
supabase functions deploy process-entry

echo "Edge Function deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with NEXT_PUBLIC_USE_EDGE_FUNCTION=true"
echo "2. Test locally with: npm run dev"
echo "3. Push to GitHub for deployment"