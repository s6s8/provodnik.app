version: 1
last_verified: 2026-03-16
purpose: "Machine-usable prompt guide for Nano Banana / Nano Banana Pro image generation."
format: "YAML stored in .md by request."

model_map:
  nano_banana:
    api_name: "gemini-2.5-flash-image"
    role: "fast high-volume image gen"
  nano_banana_2:
    api_name: "gemini-3.1-flash-image-preview"
    role: "preview tier with more image controls"
  nano_banana_pro:
    api_name: "gemini-3-pro-image-preview"
    role: "highest-fidelity output, strong instruction following, better text"

core_rules:
  - "Describe scenes in natural language; do not use keyword soup."
  - "Use complete, coherent descriptions before adding modifiers."
  - "State what to create, not just what to avoid."
  - "Prefer positive scene descriptions over bare negative bans."
  - "Be specific about subject, setting, lighting, camera, and intent."
  - "Use iterative refinement; do not expect perfect first-pass output."
  - "For edits, explicitly say what changes and what must stay the same."
  - "When API/UI supports aspect ratio and image size controls, set them out-of-band instead of spending prompt tokens."
  - "Use English unless there is a reason not to; official docs show strongest support there."

high_signal_findings:
  natural_language_bias: "Descriptive sentences usually beat disconnected keywords."
  negative_wording_bias: "Use semantic negatives; prefer clean/empty/minimal scene description over raw ban lists."
  photo_realism: "Think like a photographer: shot, lens, angle, light, surface, texture, focus."
  editing_strength: "Strong at conversational edits, local changes, and multi-turn refinement."
  consistency_limit: "Consistency can drift across long edit chains; restart with a fresh full prompt if needed."
  text_limit: "Text rendering is good but still wants short exact copy and explicit layout intent."

preferred_prompt_order:
  - intent
  - subject
  - action_or_pose
  - environment
  - composition
  - lighting
  - camera
  - materials_textures
  - style_or_medium
  - quality_target
  - optional_constraints

prompt_schema:
  intent: "What the image is for: portrait, product shot, logo, comic panel, infographic, edit, mockup."
  subject: "Primary entity with defining attributes."
  action_or_pose: "What subject is doing or how it is positioned."
  environment: "Location, background, surface, weather, room type, era."
  composition: "Framing, placement, crop, negative space, foreground/background relationships."
  lighting: "Source, direction, softness, temperature, contrast, mood."
  camera: "Shot type, angle, lens, focal feel, focus behavior."
  materials_textures: "Matte, glossy, brushed metal, ceramic, linen, skin detail, steam, dust, water."
  style_or_medium: "Photoreal, editorial, kawaii sticker, noir comic, minimal poster, oil painting."
  quality_target: "Ultra-realistic, crisp edges, shallow depth of field, clean typography, print-ready, etc."
  optional_constraints: "Preserve composition, keep same aspect ratio, leave everything else unchanged, white background."

machine_builder:
  build_method:
    - "Use 3-6 compact sentences, not a comma dump."
    - "Sentence 1 = intent + subject."
    - "Sentence 2 = environment + action/pose."
    - "Sentence 3 = lighting + mood."
    - "Sentence 4 = camera/composition."
    - "Sentence 5 = materials/details."
    - "Sentence 6 = only if needed: text/layout/constraints."
  compression_rules:
    - "Remove duplicate adjectives."
    - "Keep only one dominant style unless intentionally mixing."
    - "Do not repeat aspect ratio if UI/API already controls it."
    - "Do not list synonyms for the same look."
    - "Prefer one precise noun over two vague adjectives."

semantic_negatives:
  rule: "Translate bans into desired visual outcomes."
  avoid:
    - "no cars"
    - "no blur"
    - "no clutter"
    - "no dark shadows"
    - "no people"
    - "no text"
  prefer:
    - "an empty street with clear pavement and closed storefronts"
    - "sharp focus with crisp edges and high clarity"
    - "minimal set with only the hero object on a clean surface"
    - "soft diffused light with gentle shadow transitions"
    - "deserted environment with no visible pedestrians"
    - "clean composition free of signage or typography"
  note: "If absence matters, phrase it as scene intent, not a raw blacklist."

camera_controls:
  shot_types:
    - "close-up"
    - "medium shot"
    - "full-body shot"
    - "wide shot"
    - "macro shot"
    - "aerial shot"
    - "isometric shot"
  angles:
    - "eye level"
    - "top-down"
    - "45-degree"
    - "low-angle"
    - "high-angle"
    - "from below"
    - "Dutch angle"
  lenses:
    - "macro lens"
    - "35mm"
    - "50mm"
    - "85mm portrait lens"
    - "wide-angle"
    - "fisheye"
  focus_fx:
    - "bokeh"
    - "soft focus"
    - "deep focus"
    - "motion blur"
    - "shallow depth of field"
  guidance:
    - "Use one lens language set that matches the scene."
    - "Portraits: 50mm-85mm feel."
    - "Products/food/details: macro or close-up."
    - "Architecture/landscapes: wide-angle."

lighting_controls:
  qualities:
    - "soft"
    - "diffused"
    - "dramatic"
    - "hard"
    - "warm"
    - "cool"
    - "natural"
    - "studio-lit"
  sources:
    - "golden hour window light"
    - "three-point softbox setup"
    - "overcast daylight"
    - "neon practicals"
    - "rim light"
    - "backlight"
    - "top light"
  mood_map:
    serene: "soft, warm, low-contrast"
    premium: "clean studio lighting, controlled highlights, soft shadows"
    cinematic: "directional light, stronger contrast, selective highlights"
    editorial: "balanced but intentional, crisp subject separation"
    minimal: "soft diffused light, clean falloff, restrained contrast"

style_recipes:
  photoreal:
    must_have:
      - "real camera language"
      - "specific lighting"
      - "material realism"
      - "focus behavior"
    avoid:
      - "generic 'high quality photo' only"
  product_mockup:
    template: "A high-resolution, studio-lit product photograph of [product] on [surface]. Lighting uses [setup] to create [highlight/shadow goal]. Camera angle is [angle] to showcase [feature]. Sharp focus on [detail]."
    best_for:
      - "e-commerce"
      - "ads"
      - "branding"
  portrait:
    template: "A photorealistic [close-up/medium] portrait of [subject] in [setting]. Lit by [light]. Captured with [lens]. Emphasize [skin, fabric, hair, expression]."
  minimalist_negative_space:
    template: "A minimalist composition with a single [subject] placed in [frame position]. Background is a vast empty [color/material] field with clean negative space for copy."
  sticker_icon_asset:
    template: "A [style] sticker/icon of [subject] with [key traits], [outline style], [shading style], [palette]. Background must be white."
  comic_storyboard:
    template: "A single [comic/storyboard] panel in [style]. Foreground: [character + action]. Background: [setting]. Lighting creates a [mood] mood."

text_rendering:
  rules:
    - "Keep rendered text short when possible."
    - "Quote exact text to render."
    - "Specify font family feel, not exact font dependency."
    - "Specify placement and overall design intent."
    - "Use Nano Banana Pro when text fidelity matters."
  template: "Create a [logo/poster/card] with the text '[exact text]' in a [font style]. The design should be [style], with a [color scheme] and [layout direction]."

editing_recipes:
  add_remove_modify:
    template: "Using the provided image of [subject], [add/remove/modify] [element]. Make it integrate naturally with the original style, lighting, and perspective."
  local_edit:
    template: "Change only the [element] to [new element]. Keep everything else exactly the same, preserving style, lighting, composition, and background."
  style_transfer:
    template: "Transform the provided image into [style]. Preserve composition while rendering with [stylistic markers]."
  multi_image_composition:
    template: "Create a new image by taking [element from image 1] and placing it with/on [element from image 2]. Final scene should be [target scene]. Match lighting, shadows, and perspective."

iteration_loop:
  use_when:
    - "first result is close but off"
    - "lighting is wrong"
    - "composition is right but styling is off"
    - "consistency drift appears"
  follow_up_patterns:
    - "Keep everything the same, but make the lighting warmer."
    - "Keep composition unchanged. Move the camera slightly lower."
    - "Preserve the subject and scene. Increase negative space on the left."
    - "Same setup, but switch to a softer diffused studio light."
    - "Same image, but sharpen the ceramic texture and reduce background detail."
  reset_rule: "If the model drifts after several turns, restart with a fresh full prompt instead of stacking more corrections."

anti_patterns:
  - pattern: "keyword soup"
    why_bad: "reduces coherence and underuses language understanding"
    fix: "rewrite as 3-6 natural sentences"
  - pattern: "raw blacklist negatives"
    why_bad: "often weaker than positive scene description"
    fix: "describe the target empty/clean/minimal scene"
  - pattern: "conflicting style stack"
    why_bad: "causes muddy output"
    fix: "pick one dominant style and one secondary modifier max"
  - pattern: "underspecified product prompts"
    why_bad: "generic commodity output"
    fix: "add surface, lighting rig, camera angle, hero detail"
  - pattern: "editing without preservation clause"
    why_bad: "unwanted collateral changes"
    fix: "say what must remain unchanged"
  - pattern: "long text blocks inside images"
    why_bad: "rendering quality drops"
    fix: "keep copy short or split into iterative passes"

api_ui_controls:
  prefer_external_controls:
    aspect_ratio: true
    image_size: true
  supported_aspect_ratios:
    - "1:1"
    - "3:2"
    - "2:3"
    - "3:4"
    - "4:3"
    - "4:5"
    - "5:4"
    - "9:16"
    - "16:9"
    - "21:9"
  notes:
    - "2.5 Flash Image: aspect ratio control."
    - "3.1 Flash Image Preview / 3 Pro Image Preview: aspect ratio + image size controls."

language:
  default: "en"
  recommendation: "Prefer English for prompt fidelity unless a different language is required."

prompt_examples:
  concise_photo: "A photorealistic 45-degree product shot of a matte black ceramic coffee mug on a white stone pedestal in a clean studio. Soft diffused daylight creates gentle shadows and controlled highlights. Captured with a close product-photography lens, sharp focus on the mug texture and rim."
  semantic_negative_example: "An empty side street at dawn with clean facades, shuttered storefronts, clear pavement, and a composition free of traffic, pedestrians, and signage."
  premium_logo: "Create a minimalist logo for 'Northline' in a bold sans-serif font. Integrate a simple geometric compass icon with the wordmark. Black and off-white palette, clean spacing, premium modern brand feel."
  edit_example: "Using the provided image, change only the blue sofa to a vintage brown leather chesterfield. Keep the room layout, pillows, lighting, and composition unchanged."

machine_checklist:
  before_send:
    - "Is the intent explicit?"
    - "Is the subject concrete and visually identifiable?"
    - "Is there exactly one main composition?"
    - "Is lighting specified?"
    - "Is camera language specified if realism matters?"
    - "Are style conflicts removed?"
    - "Are negative bans translated into positive outcomes?"
    - "Are aspect ratio / size omitted from text if UI/API already sets them?"
  after_result:
    - "Did the subject match?"
    - "Did lighting match?"
    - "Did composition match?"
    - "Did the model over-style or under-specify?"
    - "Should next turn be a small edit or full reset?"

sources:
  - type: "official_doc"
    title: "Gemini API image generation"
    url: "https://ai.google.dev/gemini-api/docs/image-generation"
    use: "model names, Nano Banana identity, multi-turn edits, image config"
  - type: "official_blog"
    title: "How to prompt Gemini 2.5 Flash Image Generation for the best results"
    url: "https://developers.googleblog.com/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results/"
    use: "natural description, product/photo templates, semantic negatives, camera, iterative edits"
  - type: "official_doc"
    title: "Prompt and image attribute guide"
    url: "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/img-gen-prompt-guide"
    use: "photography, lighting, lens vocabulary, prompt detail"
  - type: "official_doc"
    title: "Generate images with Gemini on Vertex AI"
    url: "https://docs.cloud.google.com/vertex-ai/generative-ai/docs/multimodal/image-generation"
    use: "supported models, aspect ratios, iterative editing, language guidance"
  - type: "official_doc"
    title: "Prompt design strategies"
    url: "https://ai.google.dev/gemini-api/docs/prompting-strategies"
    use: "clarity, specificity, concise structure"

status: "optimized_for_machine_use"
