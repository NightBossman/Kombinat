// refs.ts — Statyczna analiza formuly: jakie odwolania do stanu i jakie funkcje sa uzyte.
// Studio (Faza 5) uzywa tego do walidacji ("czy formula czyta tylko znane przestrzenie nazw i ID").
import type { Node } from './ast';

export interface RefInfo {
  refs: Set<string>;
  functions: Set<string>;
}

export function collectRefs(node: Node, into?: RefInfo): RefInfo {
  const info: RefInfo = into ?? { refs: new Set(), functions: new Set() };
  switch (node.kind) {
    case 'num':
    case 'bool':
      break;
    case 'ref':
      info.refs.add(node.path);
      break;
    case 'unary':
      collectRefs(node.arg, info);
      break;
    case 'binary':
      collectRefs(node.left, info);
      collectRefs(node.right, info);
      break;
    case 'call':
      info.functions.add(node.name);
      for (const a of node.args) collectRefs(a, info);
      break;
  }
  return info;
}
