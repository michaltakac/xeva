---
"xreva": minor
---

Renamed package from `xeva` to `xreva` for NPM availability

This release includes a package rename to avoid naming conflicts on NPM. The original `xeva` name was already taken, so the package has been renamed to `xreva`.

### Breaking Changes
- Package renamed from `xeva` to `xreva`
- All imports must be updated: `import { ... } from 'xreva'`
- Component names updated:
  - `XevaPanel` → `XrevaPanel`
  - `XevaPanelXR` → `XrevaPanelXR` 
  - `useXevaStore` → `useXrevaStore`

### Improvements
- Fixed all TypeScript errors
- Improved build configuration
- Added comprehensive NPM publishing documentation
- Added GitHub Pages documentation site
- Fixed XR hook type issues

### Migration Guide
Update your imports:
```diff
- import { useControls, XevaPanel } from 'xeva'
+ import { useControls, XrevaPanel } from 'xreva'
```

Update your components:
```diff
- <XevaPanel />
+ <XrevaPanel />
```