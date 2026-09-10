import type { Server } from "bun";
import type { RequestContext } from "./middleware";

type HttpMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
type Handler = (ctx: RequestContext) => Response | Promise<Response>;

interface Route {
  method: HttpMethod;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  get(path: string, handler: Handler): void {
    this.add("GET", path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add("POST", path, handler);
  }

  delete(path: string, handler: Handler): void {
    this.add("DELETE", path, handler);
  }

  private add(method: HttpMethod, path: string, handler: Handler): void {
    const paramNames: string[] = [];
    const regexStr = path
      .replace(/:([a-zA-Z_]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");
    this.routes.push({ method, pattern: new RegExp(`^${regexStr}$`), paramNames, handler });
  }

  async resolve(request: Request, server?: Server): Promise<Response | null> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method as HttpMethod;

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = pathname.match(route.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      for (let i = 0; i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }

      const ctx: RequestContext = { request, params, userGroups: [], username: "", server };
      return route.handler(ctx);
    }

    return null;
  }
}