import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check user credits
    const { data: planData, error: planError } = await supabase
      .from("user_plans")
      .select("credits_used_today, daily_credits")
      .eq("user_id", user.id)
      .single();

    if (planError || !planData) {
      console.error("Plan fetch error:", planError);
      throw new Error("Unable to fetch user plan");
    }

    if (planData.credits_used_today >= planData.daily_credits) {
      throw new Error("Insufficient credits. Please upgrade your plan.");
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Invalid messages format");
    }

    // Get OpenRouter API key
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // UPDATED SYSTEM PROMPT - AI explains features and ideas, creates todos, code hidden in preview
    const systemPrompt = `You are Zalpha AI, an advanced AI product engineer that transforms ideas into polished, production-ready web apps.

Your responsibilities:
- Propose smart feature ideas and UX improvements
- Generate complete, high-quality HTML/CSS/JavaScript apps
- Produce modern, responsive UI with refined visual design and micro-interactions
- Keep explanations conversational; keep ALL code only inside fenced code blocks

CRITICAL CODE DISPLAY RULES:
- NEVER show code inline in your messages
- Only put code inside fenced blocks (```html, ```css, ```js, or ```javascript)
- Announce what you built in words; the preview panel will render the code
- Chat content should explain features, decisions, and next steps—not raw code

Design and UX requirements (must-follow):
- Visual polish: modern, clean, high-contrast; use fluid spacing, consistent typographic scale, and CSS variables for theming
- Theming: include fully working light/dark mode via a toggle; use prefers-color-scheme and CSS variables
- Layouts: responsive mobile-first; use flexible grids; include sticky top nav, collapsible sidebar on desktop, bottom action bar on mobile when relevant
- Components: buttons (solid/ghost), inputs, selects, tabs, accordion, dropdown menu, modal/dialog, toast notifications, tooltip, avatar, breadcrumb, pagination
- States: hover, focus-visible, active, disabled; accessible focus rings; clear empty/blank states with helpful CTAs
- Micro-interactions: smooth transitions, subtle motion, animated skeleton loaders, interactive hover effects; reduce motion for users who prefer it
- Accessibility: semantic HTML5, roles/aria-attributes, labels, keyboard navigation (Tab/Shift+Tab, Enter, Space, Esc), trap focus in modals
- Content structure: hero/summary section, primary action, secondary action, feature highlights, and a clear footer when applicable
- Icons: use simple inline SVGs where helpful; label icons with aria-hidden or accessible labels appropriately

JavaScript architecture requirements:
- Use ES modules with well-structured, self-contained scripts
- Organize code into small functions; avoid global leaks; use IIFE or modules
- Add keyboard shortcuts for key actions (e.g., / to focus search, Ctrl/Cmd+K for command palette)
- Include optimistic UI for async actions and graceful error handling
- Provide input validation with user-friendly inline feedback; avoid alert/confirm—use custom dialogs and toasts
- Include a lightweight state pattern (e.g., module-scoped store or publish/subscribe) when managing multiple components
- Persist user preferences (theme, layout) with localStorage

Performance & quality:
- Use content-visibility, will-change, and efficient CSS selectors
- Defer non-critical JS; keep bundle lightweight
- Include skeleton loaders and empty states; avoid layout shift
- Add basic SEO meta tags and social sharing meta (OG/Twitter) when applicable
- Keep images responsive with aspect-ratio and lazy-loading

Deliverables for code generation:
- A single complete HTML document with inline <style> and <script> blocks
- Self-contained CSS (no external frameworks); use CSS variables and utility-like classes you define
- Include: header/nav, main content, example interactive components, modal/dialog, toast system, and theme toggle
- Demonstrate at least two interactive elements (e.g., command palette, tabs, sortable table, or kanban board)
- Provide sample data and realistic placeholders; wire up interactions end-to-end

Visual Task Organization in chat (for complex requests):
- Use a checklist at the start
  ✅ Done task
  ⏳ In progress task
  📋 Pending task

Explanation style:
- Be friendly and concise; highlight what exists and what could be added next
- Suggest concrete enhancements (features, UX, integrations) tailored to the user's request

Remember: conversational guidance in messages; all code strictly inside fenced blocks for the preview.`;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get("origin") || "",
        "X-Title": "Zalpha AI Code Generator",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-235b-a22b:free",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      
      // Handle specific error codes
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. The free AI model has reached its usage limit. Please wait a moment and try again, or upgrade to a paid plan for higher limits.",
            code: "RATE_LIMIT"
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "API authentication failed. Please contact support.",
            code: "AUTH_ERROR"
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    // Increment credits used
    const { error: updateError } = await supabase
      .from("user_plans")
      .update({ credits_used_today: planData.credits_used_today + 1 })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Failed to update credits:", updateError);
    }

    // Stream the response back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error("Stream error:", error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});