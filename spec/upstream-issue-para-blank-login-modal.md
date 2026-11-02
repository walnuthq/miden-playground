# Upstream issue: Para login modal stays blank right after page load

Status: draft, written 2026-11-02, not filed yet. To be filed with Para (getpara.com), on the issue tracker or support channel for `@getpara/react-sdk-lite`. The related Miden-side issue is in `upstream-issue-para-react-unstable-client-config.md`.

Notes for whoever files this:
- The playground works around it in its e2e tests (PR #730): `para(page).login()` in `apps/web/e2e/para.ts` waits until the page has been up 30 s (`PARA_WARM_UP`). Remove that wait once Para ships a fix.
- Investigated with Playwright traces and a temporary repro spec (deleted) that ran tutorial 4 ("Private transfers"), logged into Para, disconnected, optionally reloaded, and logged in again, logging `auth/start` / `auth/flows` responses and `/v2/warm` requests.
- Before filing, check whether a newer `@getpara/react-sdk-lite` (after 3.25.0) changed `PreloadIFrame`, and retest.

---

**Title:** Login modal stays blank ("Login", no code screen) when the login starts shortly after page load

**Environment**
- `@getpara/react-sdk-lite` 3.25.0, `@getpara/web-sdk` 3.25.0, `@getpara/react-core` 3.25.0
- Para environment: BETA
- React 19.3.1, Vite 8.3.5, Chromium (Playwright), Desktop Chrome viewport
- Para mounted through `@miden-sdk/para-react` 0.17.8 (`ParaSignerProvider`, which wraps `ParaProvider`)

**What happens**

When a user opens the Para login and enters their email within a few seconds of a page load, the modal moves on but stays blank: it shows the "Login" header, back and close buttons, and an empty body. The code entry screen never appears, and typing a code does nothing. Para's API answers normally:

```
POST /internal/v1/auth/start      200 {"status":"needs_verification","verification":{"method":"EMAIL","codeLength":6},"isNewUser":false,...}
GET  /internal/v1/auth/flows/<id> 200 {"status":"needs_verification",...}
```

While the modal is stuck, the page polls `POST /touch?regenerate=false&flowId=<id>` about every 1.2 s.

**Steps to reproduce**
1. Load a page that mounts `ParaProvider` (BETA environment).
2. Within 1–2 seconds, open the Para modal and submit an email (we used a `@test.getpara.com` test account).
3. The modal goes blank instead of showing the code screen.

**Frequency**
- A login started right after page load hit it in 3 of 4 runs.
- With a 30 s wait after page load, 4 of 4 logins worked, including one after a reload.
- Logins started a minute or more after load have never shown the problem in our runs.

**What we saw in `PreloadIFrame`**
- The preload iframe (`/v2/warm?...`) loads several times around startup. Some of those loads are aborted (status -1 in the trace).
- In one run, a `/v2/warm` reload started about 750 ms _after_ `auth/start`, during the login. That run went through. In the failing runs the login started as close to page load, while those startup reloads were still happening.
- More `/v2/warm` loads followed later in the session.
- During that time the parent app's `ParaProvider` rendered only twice, both at startup. So the reloads aren't caused by the parent re-rendering.

From reading the code:
- `PreloadIFrame` resets `preloadReady` and re-sets the iframe `src` when `client` changes (`useEffect(..., [client])`).
- `PARA_NAVIGATE` is posted once from a `useLayoutEffect` keyed on `[iFrameUrl, canHandle]`, or queued until the next `LOADED`.

Our guess is that a navigation posted to the iframe, or queued for it, gets lost when the iframe reloads mid-login, and the modal then shows the empty placeholder. We haven't confirmed which reload causes it.

**Expected**

The code screen appears, whenever the login starts relative to page load. Or Para exposes a public readiness signal (for example an `isPreloadReady` hook) so apps can disable their login button until the modal is usable.

**Workaround**

In our e2e tests, we wait until the page has been up 30 s before opening the login.
