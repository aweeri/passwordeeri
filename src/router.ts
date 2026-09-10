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
  private basePath: string;

  constructor(basePath: string = "") {
    this.basePath = basePath.replace(/\/+$/, "");
  }

  get(path: string, handler: Handler): void {
    this.add("GET", path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add("POST", path, handler);
  }

  put(path: string, handler: Handler): void {
    this.add("PUT", path, handler);
  }

  delete(path: string, handler: Handler): void {
    this.add("DELETE", path, handler);
  }

  private add(method: HttpMethod, path: string, handler: Handler): void {
    const paramNames: string[] = [];
    // Join base + route path, collapsing duplicate slashes (e.g. base "/pw"
    // plus route "/" → "/pw/") and dropping any trailing slash so that a bare
    // base URL like "/pw" resolves to the root route instead of 404ing.
    let fullPath = (this.basePath + path).replace(/\/{2,}/g, "/");
    if (fullPath.length > 1 && fullPath.endsWith("/")) {
      fullPath = fullPath.slice(0, -1);
    }
    const regexStr = fullPath
      .replace(/:([a-zA-Z_]+)/g, (_, name) => {
        paramNames.push(name);
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");
    // The bare root ("/" or "") is the only route without a candidate slash,
    // so it gets an optional "/" — all other routes tolerate a trailing slash.
    const pattern = fullPath === "" ? new RegExp("^\\/?$") : new RegExp(`^${regexStr}/?$`);
    this.routes.push({ method, pattern, paramNames, handler });
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