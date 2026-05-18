import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';

type ControllerType = { prototype: Record<string, object>; name: string };

type RouteEntry = { method: string; path: string; controller: string; handler: string };

const methodNames: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
  [RequestMethod.SEARCH]: 'SEARCH',
};

function normalizeSegment(segment: string): string {
  if (/^:.+/.test(segment) || /^\{.+\}$/.test(segment)) return '{param}';
  return segment;
}

function normalizePath(...parts: string[]): string {
  const joined = parts.filter(Boolean).join('/');
  const segments = joined.split('/').filter(Boolean).map(normalizeSegment);
  return `/api/v1/${segments.join('/')}`.replace(/\/+/g, '/');
}

function asPath(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(asPath);
  if (typeof value === 'string') return [value];
  return [''];
}

function collectControllers(moduleClass: object | null | undefined, seen = new Set<object>()): ControllerType[] {
  if (!moduleClass || seen.has(moduleClass)) return [];
  seen.add(moduleClass);
  const controllersMetadata: unknown = Reflect.getMetadata('controllers', moduleClass);
  const importsMetadata: unknown = Reflect.getMetadata('imports', moduleClass);
  const controllers = Array.isArray(controllersMetadata) ? (controllersMetadata as ControllerType[]) : [];
  const imports = Array.isArray(importsMetadata) ? (importsMetadata as unknown[]) : [];
  return [...controllers, ...imports.flatMap((imported) => (typeof imported === 'object' ? collectControllers(imported, seen) : []))];
}

function collectRoutes(): RouteEntry[] {
  return collectControllers(AppModule).flatMap((controller) => {
    const controllerPaths = asPath(Reflect.getMetadata(PATH_METADATA, controller));
    return Object.getOwnPropertyNames(controller.prototype).flatMap((handler) => {
      if (handler === 'constructor') return [];
      const handlerRef = controller.prototype[handler];
      const method = Reflect.getMetadata(METHOD_METADATA, handlerRef) as number | undefined;
      if (method === undefined) return [];
      const routePaths = asPath(Reflect.getMetadata(PATH_METADATA, handlerRef));
      return controllerPaths.flatMap((controllerPath) => routePaths.map((routePath) => ({ method: methodNames[method] ?? String(method), path: normalizePath(controllerPath, routePath), controller: controller.name, handler })));
    });
  });
}

describe('HTTP route registration uniqueness', () => {
  it('does not declare duplicate HTTP method + normalized path pairs', () => {
    const routes = collectRoutes();
    const byKey = new Map<string, RouteEntry[]>();
    for (const route of routes) {
      const key = `${route.method} ${route.path}`;
      byKey.set(key, [...(byKey.get(key) ?? []), route]);
    }

    const duplicates = [...byKey.entries()]
      .filter(([, entries]) => entries.length > 1)
      .map(([key, entries]) => `${key} => ${entries.map((entry) => `${entry.controller}.${entry.handler}`).join(', ')}`);

    expect(duplicates).toEqual([]);
  });
});
