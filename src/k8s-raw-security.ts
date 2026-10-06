// k8s_raw security helpers: per-call read-only gate + Secret masking.
// Контракт: specs/20261006-233657-mcp-rancher-node-ssh/contracts/k8s-raw-security.md
// (FR-013/FR-014: безопасные дефолты с per-call снятием, без перезагрузки MCP).

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** true для POST/PUT/PATCH/DELETE (регистронезависимо). */
export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(String(method ?? "").toUpperCase());
}

/**
 * Бросает ошибку для мутирующих методов, если запись не разрешена per-call.
 * Дефолт `allowWrite=false`: запрос к кластеру не выполняется (вызывающий код
 * обязан вызвать эту функцию ДО отправки HTTP-запроса).
 */
export function assertWriteAllowed(
  method: string,
  allowWrite: boolean | undefined,
): void {
  if (isMutatingMethod(method) && !allowWrite) {
    throw new Error("mutations disabled; pass allowWrite: true in this call");
  }
}

/**
 * Глубокая копия `value`, в которой значения `data`/`stringData` у объектов
 * `kind: "Secret"` (единичных и в списках `items`) заменены на `"***"`.
 * Исходный объект не мутируется.
 *
 * Важно: в списках Kubernetes элементы НЕ несут `kind` — тип задаёт список
 * (`SecretList`), поэтому контекст передаётся вниз по дереву. Дополнительно
 * маскируются элементы `kind: "Secret"` внутри generic `List`.
 */
export function maskSensitiveData<T>(value: T): T {
  const clone: any = structuredClone(value);
  const seen = new WeakSet();

  const walk = (node: any, secretContext: boolean) => {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item, secretContext);
      return;
    }

    const isSecret = secretContext || node.kind === "Secret";
    if (isSecret) {
      for (const field of ["data", "stringData"]) {
        const bag = node[field];
        if (bag && typeof bag === "object") {
          for (const key of Object.keys(bag)) {
            bag[key] = "***";
          }
        }
      }
    }

    // Typed lists (`SecretList`) do not set `kind` on their items, so every
    // item inherits the secret context. A generic heterogeneous `List` sets
    // `kind` on each item — those are handled by the `node.kind === "Secret"`
    // check when the item itself is visited.
    const isTypedSecretList = node.kind === "SecretList";

    for (const key of Object.keys(node)) {
      if (key === "data" || key === "stringData") continue;
      if (key === "items" && isTypedSecretList) {
        walk(node[key], true);
        continue;
      }
      walk(node[key], false);
    }
  };

  walk(clone, false);
  return clone as T;
}
