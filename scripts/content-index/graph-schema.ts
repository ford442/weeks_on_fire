/**
 * The graph v2 schema lives with the engine (`src/sequences/graph/schema.ts`) so the in-hub
 * editor validates drafts with exactly what codegen runs. Re-exported here for codegen.
 */
export { SequenceGraphSchema, keyframeLists } from '../../src/sequences/graph/schema';
export { formatGraphProblems, graphProblems } from '../../src/sequences/graph/issues';
