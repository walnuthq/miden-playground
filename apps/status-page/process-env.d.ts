// Keep in sync with .env.example and the `status-page#*` env lists in turbo.json.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // private
      readonly WEB_URL?: string;
      readonly API_URL?: string;
      readonly STATUS_PAGE_URL?: string;
      readonly STATUS_PAGE_BASE?: string;
      readonly SLACK_WEBHOOK_URL?: string;
      // GitHub Actions
      readonly GITHUB_SERVER_URL?: string;
      readonly GITHUB_REPOSITORY?: string;
      readonly GITHUB_RUN_ID?: string;
    }
  }
}

export {};
