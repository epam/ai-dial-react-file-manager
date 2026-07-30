# Plan a new component

Before writing code, produce a short plan for the requested file-manager
component:

1. **Name** - Export name and folder under the existing component directory.
2. **Props** - Extend native element props where appropriate; list required vs
   optional props and defaults.
3. **States** - Loading, error, disabled, empty, selected, long names; keyboard
   and screen-reader notes.
4. **Dependencies** - Peer deps vs internal components/hooks/utilities.
5. **Deliverables** - Files to add or update: component, stories/examples,
   specs, exports; verification must include `npm run typecheck` when present
   plus lint/test.
6. **Risks** - Async file flows, permissions, large lists, bundle size, SSR, or
   breaking changes for consumers.

Do not implement until the user confirms the plan unless they asked for plan +
implementation in one go.
