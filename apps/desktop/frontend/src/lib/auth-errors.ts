// Turn an axios / fetch error from the auth endpoints into a sentence a
// student can act on. The error.message strings axios produces ("Network
// Error", "Request failed with status code 401") read like stack-trace
// crumbs — fine for devtools, not fine for a panic-inducing login form.

import { AxiosError } from "axios";

export function authErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof AxiosError) {
    // No response at all = the request never reached the server — the
    // student's offline, or the API is down. First-launch needs the
    // network, so we tell them clearly.
    if (!err.response) {
      return "Can't reach the server. Check your internet connection and try again.";
    }
    const { status, data } = err.response;
    // Grit API returns { error: { code, message } } per the project's
    // contract — surface its message verbatim when present.
    const message = (data as { error?: { message?: string } })?.error?.message;
    if (message) return message;
    if (status === 401) return "Invalid email or password.";
    if (status === 409) return "An account with that email already exists.";
    if (status === 422) return "Please check the fields and try again.";
    if (status >= 500) return "The server is having trouble. Try again in a moment.";
    return `Request failed (${status}).`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
