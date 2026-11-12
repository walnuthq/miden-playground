// `fetch`, sent a second time when the first attempt fails before any
// response arrives (`TypeError: Failed to fetch`). Browsers resend idempotent
// requests on their own when a reused connection turns out to be closed, but
// not a PATCH or a POST, nor the CORS preflight in front of one: on
// 2026-11-12 a compile PATCH went out on a connection idle for 29 s and never
// reached the API. Only for requests that are safe to send twice, since the
// first one may have reached the server after all. An HTTP error status is
// returned as is, and an aborted request isn't retried.
export const fetchRetryingNetworkError = async (
  input: string,
  init: RequestInit = {},
) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (!(error instanceof TypeError) || init.signal?.aborted) {
      throw error;
    }
    return fetch(input, init);
  }
};
