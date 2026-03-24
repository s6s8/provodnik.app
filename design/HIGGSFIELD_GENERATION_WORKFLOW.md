# Higgsfield Generation Workflow

## Purpose

Document the verified workflow for running image generations on Higgsfield from the current Chrome session and detecting completion reliably.

Verified on:

- Page: `https://higgsfield.ai/image/nano_banana_2`
- Model: `Nano Banana Pro`
- Aspect ratio: `16:9`
- Quality: `2K`
- Generate mode: `Unlimited`

## Key Findings

- The prompt editor is a rich text field, not a plain textarea.
- Direct fill may not replace existing prompt text cleanly.
- Reliable prompt replacement method:
  - focus the editor
  - `Control+A`
  - `Backspace`
  - type the new prompt
- The page does not expose a reliable `Ready` label when a generation finishes.
- Reliable completion signal:
  - `Generating` disappears
  - the first history image changes to a new image URL
- The History tile hover actions are not all image-edit actions.
- The sparkle-image button adds the hovered history image into the reference strip above the prompt.
- The camera button is the animate/video route and should not be used when the goal is image references or image editing.

## History Hover Action Map

Verified on completed History tiles while hovered:

- top-right heart button: like/favorite
- top-right download button: download asset
- top-right three-dots button: tile menu
- bottom-right sparkle-image button: add hovered image as a reference for image editing/recreation
- bottom-right camera button: animate / video flow

Practical note:

- if you need to edit or recreate an image with references, use the sparkle-image button
- do not use the camera button unless you intentionally want the video workflow

## Reference Image Workflow

Verified behavior:

1. Hover a completed History image tile.
2. Click the bottom-right sparkle-image button.
3. The selected image appears above the prompt as a reference thumbnail.
4. Additional hover-clicks on other History tiles append more reference thumbnails instead of replacing the first one.
5. Each reference thumbnail gets its own remove button.
6. Clicking a remove button immediately removes that reference and compacts the strip.

Observed structure in the composer:

- references render above the prompt inside the image form
- each reference is a `56x56` thumbnail chip
- each chip exposes a dedicated remove control in the chip corner
- an empty add slot appears at the end of the strip while space and state allow
- the strip uses wrapping layout, not a fixed single row

## Reference Cleanup

Verified cleanup behavior:

- the reliable cleanup path is the per-chip remove button on each reference thumbnail
- removing one chip updates the strip immediately and leaves the prompt text unchanged
- repeated per-chip removal can fully clear the strip back to `0` references
- no dedicated `Clear all`, `Remove all`, or `Reset references` control was exposed in the current Nano Banana Pro composer
- `Backspace` and `Delete` did not remove references when focus was outside the prompt

Current safe conclusion:

- single-reference removal is supported and reliable
- full cleanup is possible, but it is implemented as repeated per-chip removal rather than a built-in bulk-clear action
- do not rely on keyboard deletion for reference cleanup in this UI

## Reference Limit

The current UI limit is `14` references.

Verified observations:

- 1 reference: works
- 2 references: works
- 3 references: works
- 4 references: works
- 5 references: works
- 6 references: works
- 12 references: works
- 14 references: works
- attempting to add beyond `14` surfaces the validation message `Max image size is 14`
- no validation error appeared before the cap was reached
- the composer remained usable at 14 references
- no additional successful add beyond `14` was verified
- treat `14` as the effective hard cap for the current Nano Banana Pro reference-strip UI

Current safe conclusion:

- the UI supports up to `14` references
- the strip continues to accept more references well beyond `5`
- the add attempt beyond `14` is blocked by the UI validation message `Max image size is 14`
- treat `14` as the strongest verified maximum for this workflow as tested on March 18, 2026

If Higgsfield changes the UI later, rerun the add test and re-check the validation text before assuming the cap is still `14`.

## Online Documentation Check

Official Higgsfield sources found during follow-up research:

- Nano Banana guide: states multi-reference is supported and says to "upload multiple images," but does not give a numeric hard cap for Nano Banana image generation
- Draw-to-Edit guide: describes multi-image workflows with a base image plus additional reference layers, but does not give a numeric hard cap
- Banana Placement guide: explicitly documents `1-2` reference images for that brush-to-edit workflow
- GPT Image 1.5 guide on Higgsfield: says multiple reference images are supported and recommends `up to 5-6`

Practical interpretation:

- the Banana Placement `1-2` number should not be treated as the limit for Nano Banana Pro history references
- the GPT Image 1.5 `5-6 recommended` guidance is model-specific advice, not a platform-wide hard cap
- for the Nano Banana Pro history-reference strip tested in this session, no official numeric maximum was found online
- the strongest defensible statement remains: the live UI allows `14` references and blocks the next add with `Max image size is 14`

## Stable UI Checks Before Submit

Before generating, confirm all of the following:

- Model shows `Nano Banana Pro`
- Aspect ratio shows `16:9`
- Quality shows `2K`
- Unlimited toggle is on
- Action button label is `Unlimited`

If the action button says `Generate with cost`, the page is not in the correct state.

## Sample Prompt

Use this as a simple verification prompt:

`Minimal product photo of a matte black ceramic coffee mug on a white stone pedestal, soft daylight, clean studio background, premium commercial photography, realistic shadows, ultra-detailed.`

## Verified Workflow

1. Open the Higgsfield Nano Banana page in the current Chrome session.
2. Confirm `Nano Banana Pro`, `16:9`, `2K`, and `Unlimited`.
3. Focus the prompt editor.
4. Clear existing content with `Control+A`, then `Backspace`.
5. Type the new prompt.
6. Record the current top history image URL.
7. Click the `Unlimited` button to submit.
8. Wait until `Generating` appears.
9. Poll until both conditions are true:
   - `Generating` is no longer visible
   - the first history image URL is different from the recorded baseline
10. Treat the new first history image as the finished output.

## Reliable Completion Detection

Track the first image tile in the History grid:

- target image selector concept: first `img` where `alt === "image generation"`
- baseline example from an earlier completed run:
  - `hf_20260316_130741_26bc05be-5d98-4f6a-8a89-d1f0f9b0ce88`
- verified new completed result:
  - `hf_20260316_131437_78ff820d-956c-4186-a3a6-e5a3249a5a5e`

Completion should be considered successful only after the top image changes to a new `hf_...` asset and `Generating` is gone.

## Observed Test Result

The workflow was tested end-to-end with the sample mug prompt.

Observed behavior:

- submit succeeded
- page entered `Generating`
- top history image updated to a new asset
- resulting image matched the sample prompt direction: black mug on a light stone pedestal in a clean studio scene

## Automation Notes

For automation against this page:

- do not wait for `Ready`
- do not rely only on button click success
- do not rely only on queue text
- use top-history-image replacement as the final completion check
- when replacing prompts, prefer keyboard clearing over direct field fill
