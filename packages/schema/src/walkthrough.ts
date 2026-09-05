import type { Flow, GraphEdge, GraphNode, Lane, StepStage, View, Walkthrough } from "./graph.js";
import { assertNever } from "./utils.js";

const NOTHING: ReadonlySet<string> = new Set();

/** Every view in the drill-down tree, keyed by id, children included. */
export const indexViews = (views: readonly View[]): Map<string, View> =>
  new Map(views.flatMap((view) => [[view.id, view] as const, ...indexViews(view.children)]));

/**
 * The flow steps a stage puts on screen, which is the whole answer to whether
 * a step may focus one: a step the reader will never see is a reference to
 * nothing, however real the id.
 *
 * A flow step is only ever identified within its own flow, so this is the only
 * honest way to ask the question. Two flows may each carry a step called
 * `retry`, and neither document is wrong for it.
 *
 * `unknown-stage` is its own answer rather than an empty set, so a stage that
 * names a view or flow the document lacks is reported once, as the broken
 * reference it is, instead of again for every step underneath it.
 */
export type StagedMessages =
  | { kind: "messages"; ids: ReadonlySet<string> }
  | { kind: "no-stage" }
  | { kind: "unknown-stage" };

const messageIdsOf = (flows: readonly Flow[]): Set<string> =>
  new Set(flows.flatMap((flow) => flow.messages.map((message) => message.id)));

export const stagedMessages = (
  stage: StepStage | undefined,
  flows: readonly Flow[],
  views: ReadonlyMap<string, View>,
): StagedMessages => {
  if (stage === undefined) return { kind: "no-stage" };

  switch (stage.kind) {
    case "flow": {
      const flow = flows.find(({ id }) => id === stage.flow);
      return flow === undefined
        ? { kind: "unknown-stage" }
        : { kind: "messages", ids: messageIdsOf([flow]) };
    }
    case "view": {
      const view = views.get(stage.view);
      if (view === undefined) return { kind: "unknown-stage" };

      switch (view.scope.kind) {
        case "all":
          return { kind: "messages", ids: messageIdsOf(flows) };
        case "selection": {
          const scoped = view.scope.flows;
          return {
            kind: "messages",
            ids: messageIdsOf(flows.filter((flow) => scoped.includes(flow.id))),
          };
        }
        default:
          return assertNever(view.scope, "Unhandled view scope");
      }
    }
    default:
      return assertNever(stage, "Unhandled step stage");
  }
};

/**
 * The parts of a document a walkthrough can point at.
 *
 * Pruning reads the document that survived rather than a list of the ids that
 * went, because a step names a diagram as well as elements, and because a
 * flow step means nothing outside the flow that carries it.
 */
export type WalkthroughSubject = {
  lanes: readonly Lane[];
  nodes: readonly GraphNode[];
  edges: readonly GraphEdge[];
  flows: readonly Flow[];
  views: readonly View[];
};

const stageSurvives = (
  stage: StepStage,
  flows: ReadonlySet<string>,
  views: ReadonlyMap<string, View>,
): boolean => {
  switch (stage.kind) {
    case "view":
      return views.has(stage.view);
    case "flow":
      return flows.has(stage.flow);
    default:
      return assertNever(stage, "Unhandled step stage");
  }
};

/** Both ways of drawing nothing leave nothing a step is allowed to focus. */
const focusable = (staged: StagedMessages): ReadonlySet<string> => {
  switch (staged.kind) {
    case "messages":
      return staged.ids;
    case "no-stage":
    case "unknown-stage":
      return NOTHING;
    default:
      return assertNever(staged, "Unhandled staged messages");
  }
};

/**
 * A step whose diagram is gone has nowhere to play, and a focus that loses
 * its last element has nothing to point at; either way the step goes rather
 * than being left to widen into a step about everything. A tour of one step
 * is a caption, so a walkthrough cut below two steps goes with them.
 *
 * A focused flow step is measured against the stage that draws it, not
 * against the document at large: a step called `retry` surviving in some
 * other flow says nothing about the one this step is playing over.
 */
export const pruneWalkthrough = (
  walkthrough: Walkthrough | undefined,
  subject: WalkthroughSubject,
): Walkthrough | undefined => {
  if (walkthrough === undefined) return undefined;

  const lanes = new Set(subject.lanes.map((lane) => lane.id));
  const nodes = new Set(subject.nodes.map((node) => node.id));
  const edges = new Set(subject.edges.map((edge) => edge.id));
  const flows = new Set(subject.flows.map((flow) => flow.id));
  const views = indexViews(subject.views);

  const steps = walkthrough.steps.flatMap((step) => {
    if (step.stage !== undefined && !stageSurvives(step.stage, flows, views)) return [];

    switch (step.focus.kind) {
      case "all":
        return [step];
      case "selection": {
        const onStage = focusable(stagedMessages(step.stage, subject.flows, views));
        const focus = {
          kind: "selection",
          lanes: step.focus.lanes.filter((id) => lanes.has(id)),
          nodes: step.focus.nodes.filter((id) => nodes.has(id)),
          edges: step.focus.edges.filter((id) => edges.has(id)),
          messages: step.focus.messages.filter((id) => onStage.has(id)),
        } as const;

        const focused =
          focus.lanes.length + focus.nodes.length + focus.edges.length + focus.messages.length;
        return focused === 0 ? [] : [{ ...step, focus }];
      }
      default:
        return assertNever(step.focus, "Unhandled step focus");
    }
  });

  return steps.length < 2 ? undefined : { ...walkthrough, steps };
};
