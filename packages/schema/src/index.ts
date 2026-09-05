export { SCHEMA_VERSION, type SchemaVersion } from "./version.js";

export {
  Beat,
  Delta,
  DELTAS,
  FileRef,
  FullSha,
  Id,
  Label,
  Lens,
  LENSES,
  Line,
  MAX_RENDER_ASSETS,
  MAX_VIEWS,
  Theme,
  THEMES,
  SchemaVersionField,
  Sha,
  Summary,
} from "./primitives.js";

export {
  EdgeEmphasis,
  EdgeKind,
  Flow,
  FlowMessage,
  FlowParticipant,
  GraphDoc,
  GraphEdge,
  GraphNode,
  Lane,
  LayoutHints,
  MessageKind,
  NodeKind,
  Provenance,
  StatChip,
  Stats,
  StepFocus,
  StepStage,
  View,
  ViewScope,
  Walkthrough,
  WalkthroughStep,
  type GraphDocInput,
  type ViewInput,
} from "./graph.js";

export {
  EdgePatch,
  FlowPatch,
  LanePatch,
  NodePatch,
  PatchDoc,
  PatchOp,
  PATCH_OPS,
  targetDescribesATransition,
  type PatchDocInput,
} from "./patch.js";

export { Config, MapCorrections, Selector, type ConfigInput } from "./config.js";

export { RenderAsset, RenderManifest, type RenderManifestInput } from "./manifest.js";

export {
  formatIssues,
  PrLensSchemaError,
  type Parsed,
  type SchemaErrorCode,
  type SchemaIssue,
} from "./errors.js";

export { graphIntegrityIssues, graphSnapshotIssues } from "./integrity.js";

export {
  parseConfig,
  parseGraphDoc,
  parsePatchDoc,
  parseRenderManifest,
  safeParseConfig,
  safeParseGraphDoc,
  safeParsePatchDoc,
  safeParseRenderManifest,
} from "./validate.js";

export { applyPatch, applyPatchDoc, pruneWalkthrough, type Survives } from "./apply.js";

export { assertNever } from "./utils.js";
