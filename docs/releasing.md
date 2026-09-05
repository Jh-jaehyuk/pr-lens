# Releasing

Five packages ship from this repository, and the hosted app consumes two of them. They publish in one order, because each is built against the contract the one before it puts on npm.

## The order

1. **`@coldtea/pr-lens-schema`.** The contract. Nothing else can be published against a version of it npm does not have yet.
2. **`@coldtea/pr-lens-renderer`.** Built against the schema release above.
3. **`@coldtea/pr-lens-cli`** and **`@coldtea/pr-lens-agent-skill`**, in either order. Once the CLI leaves this repository it resolves the schema and the renderer through their published versions, and the skill package carries the pages the CLI embeds.
4. **The GitHub Action.** Its `cli-version` input pins the CLI, so it moves once the CLI is on npm. A test in `packages/action` fails while that pin and the CLI's version in this repository disagree.
5. **The app.** It pins the schema and the renderer, regenerates its validator, and deploys. Deploy it before those two are published and its build resolves versions that do not exist.

Skip a package with nothing to ship. The order between the ones that do ship never changes.

## Before publishing anything

```bash
pnpm install
pnpm skill:sync    # only when the skill pages changed
pnpm verify        # build, typecheck and test, across every package
```

`pnpm skill:sync` runs before `pnpm verify`, not after. It rewrites the root `skills/pr-lens/` mirror and `packages/cli/src/skill-content.generated.ts`, and a drift test fails while either disagrees with `packages/agent-skill`.

## Publishing

Each package is published from its own directory, with the version already committed:

```bash
cd packages/schema && pnpm publish --access public
```

`pnpm release:cli` at the root does the CLI's, verify included.

## Two versions in the schema, and they move separately

`SCHEMA_VERSION` is the contract version, and it is not the schema package's version. A documentation fix ships a new package version and leaves the contract where it stands, so every document written against the older string keeps parsing. Move `SCHEMA_VERSION` only when the shape a document may have changes.

## What an older consumer sees

Below 1.0.0 a parser accepts only its own exact `major.minor`, so a contract that adds an optional field within the same minor stays readable and the version string alone raises no objection. The new field is a different matter: every schema here is strict, so a parser that has not been upgraded rejects the whole document as an invented field.

That is the intended answer rather than a rough edge. A producer writing something the reader cannot draw is better told so than quietly drawn without it. It is also why this is an order and not a set: a consumer has to be upgraded before it can read a document that uses a new field.
