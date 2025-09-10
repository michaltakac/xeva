# Contributing to XEVA

We love your input! We want to make contributing to XEVA as easy and transparent as possible.

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing style
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

When you submit code changes, your submissions are understood to be under the same [MIT License](LICENSE) that covers the project.

## Report bugs using Github's [issues](https://github.com/yourusername/xeva/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/xeva/issues/new).

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/xeva.git
cd xeva

# Install dependencies
bun install

# Run tests in watch mode
bun test --watch

# Build the library
bun run build

# Run examples
cd examples/basic-r3f
bun dev
```

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test tests/store.test.ts
```

## Code Style

- We use Prettier for formatting
- TypeScript strict mode is enabled
- Follow the existing patterns in the codebase

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, missing semicolons, etc)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Creating a Changeset

Before submitting a PR with changes that should be released:

```bash
bun changeset
```

Follow the prompts to describe your changes. This will create a changeset file that will be used to generate the changelog and version bump.

## License

By contributing, you agree that your contributions will be licensed under its MIT License.