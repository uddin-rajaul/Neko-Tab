# Claude Code Configuration

## Core Principles
When working with this codebase, prioritize readability over cleverness. Ask clarifying questions before making architectural changes.

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that wasn't requested
- No error handling for impossible scenarios
- If you write 200 lines and it could be 50, rewrite it

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- If you notice unrelated dead code, mention it - don't delete it

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless asked

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Workflow Patterns

### Research → Plan → Code → Commit
1. **Research**: Read relevant files, understand context
2. **Plan**: State approach, get confirmation before coding
3. **Code**: Implement with tests
4. **Commit**: Clear commit messages describing the change

### Test-Driven Development
1. Write tests that demonstrate the desired behavior
2. Confirm tests fail
3. Implement solution
4. Confirm tests pass
5. Refactor if needed

## Code Standards

- Use clear, descriptive variable and function names
- Write self-documenting code with minimal comments
- Comments should explain "why", not "what"
- Keep functions small and focused on single responsibility
- Prefer composition over inheritance
- Follow existing patterns in the codebase

## Success Indicators

These guidelines are working if:
- Fewer unnecessary changes in diffs
- Fewer rewrites due to overcomplication  
- Clarifying questions come before implementation rather than after mistakes
- Code reviews focus on logic rather than style or unnecessary changes
