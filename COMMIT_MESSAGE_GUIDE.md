# Commit Message Guide

Commit message writing guide for Inkwell System project.

**IMPORTANT: Commit messages MUST be in English.**

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

### `feat`
Add new feature

```
feat(plate-exports): add plate export list and detail pages
feat(auth): add OAuth login functionality
feat(orders): add filter by payment status
```

### `fix`
Fix bug

```
fix(api): fix empty string params not being sent
fix(ui): fix incorrect date display in table
fix(auth): fix token expiry not redirecting to login
```

### `refactor`
Refactor code (no behavior change)

```
refactor(hooks): extract pagination logic to separate hook
refactor(components): optimize DieListDialog performance
refactor(api): standardize params handling
```

### `perf`
Improve performance

```
perf(table): optimize large list rendering with virtual scrolling
perf(api): add caching for frequently used requests
perf(bundle): reduce bundle size with code splitting
```

### `style`
Change code formatting, no logic change

```
style(components): fix indentation
style(eslint): fix auto-fixable eslint errors
```

### `docs`
Update documentation

```
docs(readme): add environment setup guide
docs(api): update API documentation
docs(commit): add commit message guide
```

### `test`
Add or fix tests

```
test(hooks): add unit tests for usePlateExports
test(components): add tests for DieDialog
test(api): fix test case for normalizeParams
```

### `chore`
Changes to build, config, dependencies

```
chore(deps): update react-query to v5
chore(config): add prettier config
chore(ci): setup GitHub Actions
```

### `sync`
Sync schema/API with backend

```
sync(api): sync schema with latest swagger
sync(hooks): create hooks for new endpoints
sync(types): update types according to new schema
```

## Scope

Scope is the part of the codebase affected:

- `api` - API calls, endpoints
- `hooks` - React hooks
- `components` - React components
- `pages` - Page components
- `schema` - Zod schemas, types
- `ui` - UI components, styling
- `routes` - Routing
- `config` - Configuration files
- `utils` - Utility functions
- `auth` - Authentication
- `orders` - Orders module
- `proofing` - Proofing/prepress module
- `plate-exports` - Plate exports module
- `dies` - Dies management
- `accounting` - Accounting module
- `inventory` - Inventory module

You can use multiple scopes: `feat(api,hooks): ...`

## Subject

- **MUST be in English** (required)
- Use imperative mood: "add", "fix", "update" (not "added", "will fix")
- Lowercase first letter (except for proper nouns)
- No period at the end
- Limit to 50-72 characters
- Brief description of what the commit does

**Good:**
```
feat(plate-exports): add plate export list and detail pages
fix(api): fix empty string params handling
refactor(hooks): optimize usePlateExports hook
```

**Bad:**
```
feat: add new feature  // missing scope
fix(api): Fixed the bug.  // past tense, has period
feat(plate-exports): Add plate export list and detail pages with full features including filter, pagination, and edit functionality  // too long
```

## Body (Optional)

Describe in more detail:
- Why the change was made (why, not what)
- How it differs from the old approach
- Side effects or breaking changes

**Note: Body can be in Vietnamese for detailed explanation, but subject must be in English.**

```
feat(plate-exports): add plate export list and detail pages

- Create PlateExportListPage with table, filters, pagination
- Create PlateExportDetailPage with edit dialog
- Add routes and menu items
- Use empty string instead of undefined for string params
- UI fit 100vh with flex layout
```

## Footer (Optional)

### Breaking Changes

```
BREAKING CHANGE: API endpoint /api/orders changed response format

Migration: Update OrderResponse type and components using it
```

### Issues

```
Closes #123
Fixes #456
Refs #789
```

## Full Examples

### Simple commit

```
feat(plate-exports): add plate export list page
```

### Commit with body

```
feat(plate-exports): add plate export list and detail pages

- Create PlateExportListPage with table, filters, pagination
- Create PlateExportDetailPage with edit dialog
- Add routes /plate-exports and /plate-exports/:id
- Add menu item "Danh sách xuất kẽm" to Bình bài menu
- Use empty string instead of undefined for string params
- UI fit 100vh with flex layout and min-h-0
- Table displays 10 items with scroll
- Table text is bolder (font-semibold, font-medium)
```

### Fix commit

```
fix(api): fix normalizeParams not removing empty strings

Previously normalizeParams only removed null/undefined, now it also
removes empty strings to avoid sending empty query params to API.
```

### Sync commit

```
sync(api): sync schema with latest swagger

- Add UpdatePlateExportRequest schema
- Update PlateExportResponse schema
- Create useUpdatePlateExport hook
- Update plate-export.schema.ts exports
```

### Breaking change

```
refactor(api): change params handling approach

BREAKING CHANGE: All string params in UI components must use empty
string instead of undefined. normalizeParams will remove empty strings
before sending to API.

Migration: Update all UI components passing params to hooks to use
empty string for string params.
```

## Best Practices

1. **Commit frequently**: Commit after each complete feature/fix
2. **One commit = one change**: Don't combine unrelated changes
3. **Write clearly**: Others reading commit message should understand the change
4. **Use scope**: Helps filter and search commits easier
5. **Reference issues**: Link to issues/tickets if available
6. **Review before commit**: Ensure message follows format
7. **MUST use English**: Subject line must be in English (body can be in Vietnamese for detailed explanation)

## Commit Message Template

Create `.gitmessage` file in root directory:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Use it:
```bash
git config commit.template .gitmessage
```

## Lệnh hữu ích

### Xem commit history
```bash
git log --oneline
git log --oneline --grep="feat"
git log --oneline --grep="fix"
```

### Filter theo type
```bash
git log --oneline --grep="^feat"
git log --oneline --grep="^fix"
git log --oneline --grep="^sync"
```

### Filter theo scope
```bash
git log --oneline --grep="plate-exports"
git log --oneline --grep="api"
```

### Generate changelog
```bash
git log --oneline --grep="^feat" > CHANGELOG_FEATURES.md
git log --oneline --grep="^fix" > CHANGELOG_FIXES.md
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Git Commit Best Practices](https://chris.beams.io/posts/git-commit/)
