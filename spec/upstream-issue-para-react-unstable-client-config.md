# Upstream issue: `@miden-sdk/para-react` recreates the Para client on every render

Status: draft, written 2026-11-02, not filed yet. To be filed on 0xMiden's web SDK repository (the one that publishes `@miden-sdk/para-react`; the `frontend-source-guide` skill maps it). It was found while investigating `upstream-issue-para-blank-login-modal.md`, but it isn't that issue's main cause.

Notes for whoever files this:
- Everything below comes from reading the installed code (`@miden-sdk/para-react` 0.17.8 `dist/index.mjs`, `@getpara/react-sdk-lite` 3.25.0 `dist/provider/ParaProviderMin.js` and `dist/provider/components/PreloadIFrame.js`, `@getpara/react-core` 3.25.0 `dist/provider/ParaProviderCore.js`). It wasn't observed at runtime: in the playground, `ParaSignerProvider` re-renders only at startup.
- Before filing, check whether a newer `@miden-sdk/para-react` already memoizes the config.
- Once it's fixed upstream, nothing needs to change in the playground (`apps/web/components/providers/para-provider.tsx` passes `paraProviderConfig={{ externalWalletConfig: { wallets: [] } }}`, which also builds a new object on every render; make it a module constant at the same time).

---

**Title:** `ParaSignerProvider` passes a new `paraClientConfig` object on every render, so Para recreates its client on every re-render

**Version:** `@miden-sdk/para-react` 0.17.8, with `@getpara/react-sdk-lite` / `@getpara/react-core` 3.25.0

**Problem**

`ParaSignerProvider` builds `paraClientConfig` inline on every render (`dist/index.mjs`):

```js
jsx(ParaProvider, {
  paraClientConfig: { env: getEnvironmentValue(environment), apiKey },
  config: { appName },
  ...paraProviderConfig,
  ...
})
```

Para treats a new `paraClientConfig` object as a new client:
1. `ParaProviderMin` memoizes on it: `useMemo(() => ({ apiKey, env, opts, createClient }), [paraClientConfig])`.
2. `ParaProviderCore` creates a client whenever that input's identity changes: `if (clientResolutionRef.current?.input !== paraClientInput) client = paraClientInput.createClient(...)`, which calls `new ParaWeb(...)`.
3. `PreloadIFrame` reacts to the new client (`useEffect(..., [client])`) by resetting its ready state and reloading the portal iframe.

So each re-render of `ParaSignerProvider`, for example when an ancestor re-renders, creates a new `ParaWeb` instance and reloads Para's preload iframe. A re-render during a login could interrupt it (see the related Para issue about blank login modals).

Apps can't work around it through the API: `paraProviderConfig` is typed `Partial<Omit<ParaProviderProps, "children" | "paraClientConfig">>`, so a stable `paraClientConfig` can't be passed without a cast and relying on the spread order.

**Suggested fix**

Memoize the config on its inputs:

```js
const paraClientConfig = useMemo(
  () => ({ env: getEnvironmentValue(environment), apiKey }),
  [environment, apiKey],
);
```

Optionally, also memoize the `config: { appName }` object the same way.

**Notes**
- This comes from reading the installed code. In our app, `ParaSignerProvider` re-renders only at startup, so this isn't the main cause of the blank-modal problem we hit. But any app that re-renders above `ParaSignerProvider` would recreate the Para client each time.
- `paraVitePlugin` and the other exports aren't involved.
