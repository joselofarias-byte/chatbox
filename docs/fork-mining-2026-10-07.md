# Fork mining report — 2026-10-07

Base reviewed: `chatboxai/chatbox@0ac6385ae1ff5bf778777826da3c5edcd55b61b8`

Our fork `joselofarias-byte/chatbox` was still byte-for-byte on that upstream commit when this work started. Changes are being isolated on `feat/community-plus-bootstrap-20261007`.

## Goal

Mine the Chatbox fork network for useful GPLv3 work, then port small, reviewable ideas onto the current upstream instead of replacing the repository with an older fork.

## High-value candidates

### Labyrinth0419/chatbox-plus

Source fork of `chatboxai/chatbox`. Last pushed 2026-06-08. It contains substantial custom work and a committed Android project.

Useful commits identified:

- `f7fdb956178d46ba32d86fe8e88c154535ee320b` — split Android release APKs by ABI.
- `1bd0644cc79b02f4731396333663b23a17b0c0a9` — prepare release builds, Android signing scaffold, package identity and Capacitor config.
- `28971e9413b87cd0788881d878b6eacdc0d72636` — route chat generation through an orchestration layer.
- `154d5db5bc23e3b2434ce14d473fdc5db5ba49ca` — preserve DeepSeek reasoning context.
- `92d51e06b3dd222844431dac277e584c1409a612` — reasoning effort controls and tool-call grouping.

Decision: mine selectively. Do not merge its branch wholesale because it predates current upstream architecture.

### jwang287/ai-chatbox

Source fork of `chatboxai/chatbox`. Last pushed 2026-08-21.

High-value commit:

- `60a36268b4cb7f246103c923d9492aec7d5ae7d1` — rebrand to AI Hub, remove Chatbox account/license/cloud coupling, disable Chatbox telemetry/update infrastructure, retain multi-provider chat/MCP/knowledge-base/web-search, add CI/release automation.

Decision: use as a map for cloud decoupling and rebranding. Port the intent file-by-file against current upstream 1.23.5 rather than cherry-picking a large 1.22.x-era deletion commit.

### Tlntin/chatbox-android

True upstream fork, but last pushed 2023-07-09. Android-specific history is useful only as archaeology; it is far too old for direct code transplant.

Decision: no direct merge.

### ciddid53/chatbox-android-1.22.1

Not an upstream fork and repository size is effectively empty; described as an Android release archive.

Decision: no code value.

## First implementation

The current upstream already includes Capacitor 7 dependencies and scripts such as `mobile:sync:android`, but does not version `capacitor.config.ts` or an `android/` project.

This branch therefore adds:

1. a minimal Capacitor configuration with a non-official Android application ID;
2. a GitHub Actions workflow that generates the Android project, targets Android API 35, builds an installable debug APK, and uploads it as an artifact.

This follows the useful release-build pattern found in `chatbox-plus` without copying its stale generated Android tree.

## Next ports to evaluate

1. Make Android CI green and install the produced APK on a physical device.
2. Port ABI-specific APK outputs after the universal debug build is verified.
3. Audit `jwang287/ai-chatbox@60a36268` into three separate change sets:
   - telemetry/update decoupling;
   - Chatbox cloud/account UI decoupling;
   - branding/package identity.
4. Add a first-class OpenAI-compatible preset for Experiential Labs while retaining generic custom providers.
5. DeepSeek/reasoning review: current upstream already has dedicated reasoning-effort controls, `reasoning_content` handling, provider tests and newer tool-call orchestration. Do **not** port the older ChatPlus reasoning/tool grouping patches wholesale.
6. Keep GPLv3 notices and upstream attribution intact in distributed builds.

## Additional implementation completed

- Added `Experiential Labs` as a first-class OpenAI-compatible provider with remote `/models` discovery and the existing free Qwen model as a convenience default.
- Disabled upstream runtime telemetry in fork builds by removing GA/Plausible script loading and skipping renderer telemetry startup.
- Replaced main-process GA/Sentry reporting with no-op compatibility surfaces.
- Disabled the official Chatbox auto-update feeds and removed the official R2 publish destination from the fork packaging config.

## Attribution

- Fork-network research and coordination: OpenAI GPT-5.6 Sol.
- Android release/build concepts inspected: Labyrinth0419, especially commits `1bd0644` and `f7fdb956`.
- Cloud-decoupling reference implementation inspected: jwang287, commit `60a36268`.
- Integration target and product direction: joselofarias-byte.
