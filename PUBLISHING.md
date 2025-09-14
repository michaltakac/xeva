# Publishing XREVA to NPM

This guide walks you through publishing XREVA to NPM for the first time and setting up automated releases.

## 📦 First-Time NPM Publishing

### Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **Verify Package Name**: Check that `xreva` is available:
   ```bash
   npm view xreva
   ```
   If it returns "404 Not Found", the name is available!

### Manual Publishing Steps

1. **Login to NPM**:
   ```bash
   npm login
   ```

2. **Build the Package**:
   ```bash
   bun install
   bun run build
   ```

3. **Test the Package Locally** (Optional but recommended):
   ```bash
   npm pack
   # This creates xreva-0.2.0.tgz
   # You can test it in another project:
   # npm install /path/to/xreva-0.2.0.tgz
   ```

4. **Publish to NPM**:
   ```bash
   npm publish --access public
   ```

   For the first publish, you might need:
   ```bash
   npm publish --access public --registry https://registry.npmjs.org/
   ```

## 🤖 Setting Up Automated Releases with GitHub Actions

The repository is already configured with GitHub Actions for automated releases using Changesets.

### 1. Generate NPM Token

1. Go to [npmjs.com](https://www.npmjs.com/) and login
2. Click your profile icon → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** (for CI/CD)
5. Copy the token (starts with `npm_`)

### 2. Add NPM Token to GitHub Secrets

1. Go to your repository: https://github.com/michaltakac/xreva
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your NPM token
6. Click **Add secret**

### 3. Using Changesets for Version Management

The project uses [@changesets/cli](https://github.com/changesets/changesets) for version management.

#### Creating a Changeset

When you make changes that should trigger a release:

```bash
bun run changeset
```

Follow the prompts to:
1. Select which packages changed (just `xreva` in this case)
2. Choose the type of change (major/minor/patch)
3. Write a summary of the changes

This creates a file in `.changeset/` describing the changes.

#### Releasing

1. **Automatic Release** (Recommended):
   - Push your changes with the changeset to `main`
   - GitHub Actions will create a "Version Packages" PR
   - This PR updates versions and changelogs
   - Merge the PR to trigger automatic NPM publish

2. **Manual Release**:
   ```bash
   bun run changeset version  # Updates version and CHANGELOG
   git add .
   git commit -m "chore: release"
   git push
   bun run release  # Publishes to NPM
   ```

## 📋 Publishing Checklist

Before publishing, ensure:

- [ ] Tests pass: `bun test`
- [ ] TypeScript compiles: `bun run typecheck`
- [ ] Build works: `bun run build`
- [ ] Examples build: `bun run build:examples`
- [ ] Version is correct in `package.json`
- [ ] CHANGELOG.md is updated
- [ ] README.md is up to date
- [ ] All changes are committed
- [ ] You're on the `main` branch

## 🔍 Verifying the Published Package

After publishing:

1. **Check NPM**:
   ```bash
   npm view xreva
   ```

2. **Test Installation**:
   ```bash
   # In a new directory
   npm init -y
   npm install xreva
   ```

3. **View on NPM**: https://www.npmjs.com/package/xreva

## 🚨 Troubleshooting

### "Package name too similar to existing packages"
- This means `xreva` might be considered too similar to another package
- Try alternative names or contact NPM support

### "You must be logged in to publish packages"
```bash
npm logout
npm login
```

### "403 Forbidden"
- Check you have publish permissions
- For scoped packages, ensure you use `--access public`
- Verify your NPM token is valid

### GitHub Actions Release Failing
- Check the NPM_TOKEN secret is set correctly
- Ensure the token has automation permissions
- Check the Actions logs for specific errors

## 📚 Resources

- [NPM Documentation](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)

## 🎉 After First Publish

Once successfully published:

1. Add the NPM badge to your README (already added!)
2. Share on social media
3. Consider writing a blog post about your package
4. Add your package to relevant awesome-lists
5. Create examples on CodeSandbox/StackBlitz

## Version History

- `0.2.0` - Initial NPM release (current)