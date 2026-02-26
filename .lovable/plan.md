

# AI Field Assistant for Model Workspace

## Overview
Add a per-field AI coaching assistant that helps users think through their answers with examples and suggestions. Admins can configure both a **global system prompt** (in Settings) and **per-model specific instructions** (in Model form). The assistant sees the current user's full progress across all fields/steps for cross-referencing, but never shares data between users.

## How It Works for Users
- A sparkle button appears next to each field label
- Clicking opens a popover with an initial AI hint and a mini-chat for follow-ups
- The AI sees: the model context, admin instructions, the current field, and ALL of this user's answers across steps -- enabling cross-references like "In step 1 you mentioned X, consider how that connects here"
- The AI coaches but never writes the answer

## Admin Configuration
- **Global AI prompt** in Settings: general coaching tone, do's and don'ts, audience context
- **Per-model AI prompt** in AdminModelForm: model-specific context, examples, domain expertise to inject

---

## Technical Plan

### 1. Database: Add `ai_assistant_prompt` to `models` table
Add a nullable text column to store per-model AI instructions.

```sql
ALTER TABLE public.models ADD COLUMN ai_assistant_prompt text;
```

### 2. Admin Settings: Add global assistant prompt
Add a new textarea field `ai_assistant_global_prompt` to the AdminSettings page, stored in `platform_settings`.

### 3. Admin Model Form: Add per-model assistant prompt
Add a new "AI Assistant" card in AdminModelForm with a textarea for `ai_assistant_prompt`. This gets saved with the model.

### 4. Edge Function: `model-assistant`
**File:** `supabase/functions/model-assistant/index.ts`

- Accepts: `modelId`, `fieldId`, `fieldLabel`, `stepTitle`, `stepInstruction`, `currentValue`, `allProgress` (the user's full formData across all steps), `messages` (follow-up chat history)
- Fetches from DB: model name + `ai_assistant_prompt`, global prompt from `platform_settings`
- Builds system prompt combining: global prompt, model-specific prompt, current field context, and the user's full progress for cross-referencing
- Calls Lovable AI gateway (`google/gemini-3-flash-preview`) with streaming
- Handles 429/402 errors
- `verify_jwt = false` in config.toml

### 5. Component: `FieldAssistant`
**File:** `src/components/FieldAssistant.tsx`

- Sparkles icon button next to field labels
- On click: opens a Popover, auto-fetches an initial hint via streaming
- Mini-chat input for follow-up questions
- Receives props: `modelId`, `stepTitle`, `stepInstruction`, `fieldId`, `fieldLabel`, `fieldType`, `currentValue`, `allProgress`
- Streams responses token-by-token

### 6. Integrate into ModelWorkspace
- Import `FieldAssistant` and place next to each field's Label (line ~446)
- Pass `model.id`, step context, field info, current value, and full `formData`

### 7. Integrate into ProgramWorkspace
- Same integration for the program workspace, passing the program's `model_id`

### 8. Update `supabase/config.toml`
- Add `[functions.model-assistant]` with `verify_jwt = false`

## Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/...` | Add `ai_assistant_prompt` column to models |
| `supabase/functions/model-assistant/index.ts` | New edge function |
| `supabase/config.toml` | Add function config |
| `src/components/FieldAssistant.tsx` | New component |
| `src/pages/admin/AdminModelForm.tsx` | Add AI prompt textarea |
| `src/pages/admin/AdminSettings.tsx` | Add global AI prompt setting |
| `src/pages/ModelWorkspace.tsx` | Integrate FieldAssistant |
| `src/pages/program/ProgramWorkspace.tsx` | Integrate FieldAssistant |

