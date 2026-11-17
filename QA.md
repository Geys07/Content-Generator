# REKA Studio verification

## Completed

- 41 automated tests passed: exact narration preservation, JSON cleanup, scene parsing, syntax diagnostics, timing ordering, local alignment matching, deterministic rendering, seven style exports, uploaded images, cloud request behavior, and two-scene H.264/AAC export.
- Browser verified direct clipboard copy: 17,301 characters copied and no dialog opened.
- Browser verified automatic storyboard validation after paste and navigation to Narasi after applying.
- Browser verified upload transitions to Sinkron and opens local processing with no API-key field.
- Seven gallery reference images visually inspected by asset task; credits and upstream license included.
- Supabase schema applied with owner RLS and private media bucket. Security advisor returned no lints. Authenticated query without owner identity returned zero rows.

## Limits still requiring validation

- Browser session ended; resumed browser inspection was blocked by environment URL policy. Full mobile click-through and final browser WASM inference were not completed. No physical Android-device performance claim is made.
- Gemini TTS request follows current official REST documentation but has not been sent with a paid/user API key.
- Supabase signup/login and real-account cross-device save/open have not been exercised with the user's credentials. Cloud request tests use mocks; schema/advisor checks use the actual database.
- Local ASR smoke-test result is recorded separately below when completed. Recognition matches are not timestamp-accuracy guarantees. Interpolated words are explicitly marked for review.

## Actual audio smoke test

The timestamp-enabled Whisper base q8 model processed a 1.6-second excerpt from the supplied meter video in the Node CPU runtime. It returned acoustic word timestamps; the custom matcher preserved all five expected words and marked three unmatched words as estimated (two exact normalized matches). This confirms the inference/alignment path executes, not that the result is production-accurate. The browser WASM path remains unverified after its bundling correction. The app must be reviewed by listening to the result, especially for fast informal Indonesian speech.
