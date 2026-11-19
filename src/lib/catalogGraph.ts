// "Appears in" lookups over the codegen'd catalog graph (`data/generated/catalog-graph.ts`): slim
// nodes (key, title, path) and typed edges, never catalog bodies, so any detail pane can import it.
import { catalogGraph } from '../data/generated/catalog-graph';

import type {
  CatalogEdge,
  CatalogGraph,
  CatalogNode,
  CatalogNodeType,
  CatalogRel,
} from '../data/generated/catalog-graph';

export type { CatalogNode, CatalogNodeType, CatalogRel };

export function nodeKey(type: CatalogNodeType, id: string): string {
  return `${type}:${id}`;
}

export interface RelatedNode extends CatalogNode {
  rel: CatalogRel;
  /** `out`: this record declares the link. `in`: the other record points here. */
  direction: 'out' | 'in';
  /** Set for a song reached through a cutaway or scene rather than linked directly. */
  via?: CatalogNode;
}

export interface RelatedGroup {
  /** A node type, or `promotion` for the cartoon ⇄ cutaway link. */
  key: CatalogNodeType | 'promotion';
  label: string;
  nodes: RelatedNode[];
}

const GROUP_ORDER: readonly CatalogNodeType[] = [
  'episode',
  'cutaway',
  'scene',
  'song',
  'sequence',
  'cartoon',
  'character',
  'still',
];

const GROUP_LABELS: Record<CatalogNodeType, string> = {
  song: 'Songs',
  cutaway: 'Suggestions',
  scene: 'Scenes',
  still: 'Stills',
  episode: 'Episodes',
  character: 'Characters',
  cartoon: 'Cartoons',
  sequence: '3D sequences',
};

/** Types whose songs also count for a record linked to them (a character in a cutaway "is in" its song). */
const SONG_CARRIERS = new Set<CatalogNodeType>(['cutaway', 'scene']);

export interface CatalogGraphIndex {
  node(type: CatalogNodeType, id: string): CatalogNode | undefined;
  /**
   * Every record linked to `type:id`, either direction, grouped in a fixed order (promotion first).
   * With `throughSongs`, songs of linked cutaways and scenes are added, marked `via`.
   */
  related(type: CatalogNodeType, id: string, options?: { throughSongs?: boolean }): RelatedGroup[];
}

export function indexCatalogGraph(graph: CatalogGraph): CatalogGraphIndex {
  const nodes = new Map(graph.nodes.map((node) => [node.key, node]));
  const order = new Map(graph.nodes.map((node, index) => [node.key, index]));
  const adjacent = new Map<string, Array<{ edge: CatalogEdge; other: string; out: boolean }>>();
  const attach = (key: string, entry: { edge: CatalogEdge; other: string; out: boolean }) => {
    const list = adjacent.get(key);
    if (list) list.push(entry);
    else adjacent.set(key, [entry]);
  };
  for (const edge of graph.edges) {
    attach(edge.from, { edge, other: edge.to, out: true });
    attach(edge.to, { edge, other: edge.from, out: false });
  }

  const neighbours = (key: string): RelatedNode[] =>
    (adjacent.get(key) ?? []).flatMap(({ edge, other, out }) => {
      const node = nodes.get(other);
      return node
        ? [{ ...node, rel: edge.rel, direction: out ? ('out' as const) : ('in' as const) }]
        : [];
    });

  return {
    node: (type, id) => nodes.get(nodeKey(type, id)),

    related(type, id, { throughSongs = false } = {}) {
      const self = nodeKey(type, id);
      const seen = new Set<string>([self]);
      const found: RelatedNode[] = [];
      for (const node of neighbours(self)) {
        if (seen.has(node.key)) continue;
        seen.add(node.key);
        found.push(node);
      }

      if (throughSongs) {
        for (const carrier of [...found]) {
          if (!SONG_CARRIERS.has(carrier.type)) continue;
          for (const song of neighbours(carrier.key)) {
            if (song.type !== 'song' || song.rel !== 'song' || song.direction !== 'out') continue;
            if (seen.has(song.key)) continue;
            seen.add(song.key);
            found.push({ ...song, via: carrier });
          }
        }
      }

      const groups = new Map<RelatedGroup['key'], RelatedNode[]>();
      for (const node of found) {
        const key = node.rel === 'promotion' ? 'promotion' : node.type;
        groups.set(key, [...(groups.get(key) ?? []), node]);
      }
      const byCatalogOrder = (a: RelatedNode, b: RelatedNode) =>
        (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0);

      const result: RelatedGroup[] = [];
      const promotion = groups.get('promotion');
      if (promotion) {
        result.push({
          key: 'promotion',
          label: type === 'cartoon' ? 'Promoted to Suggestions' : 'Promoted from cartoon',
          nodes: promotion.sort(byCatalogOrder),
        });
      }
      for (const key of GROUP_ORDER) {
        const members = groups.get(key);
        if (members) {
          result.push({ key, label: GROUP_LABELS[key], nodes: members.sort(byCatalogOrder) });
        }
      }
      return result;
    },
  };
}

/** The app's graph, indexed once. */
export const catalogLinks = indexCatalogGraph(catalogGraph);
