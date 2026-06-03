// Minimal Deno type stubs for IDE support in Supabase Edge Functions.
// These functions are deployed to the Deno runtime — not Node.js.

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  }

  export const env: Env;

  export function serve(
    handler: (request: Request) => Response | Promise<Response>
  ): void;
}
