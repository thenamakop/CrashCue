# Contributing to CrashCue

First off --- thank you for considering contributing to CrashCue.

CrashCue exists to help developers catch silent terminal failures
instantly. We welcome contributions of all kinds: bug fixes, feature
improvements, documentation updates, and performance optimizations.

------------------------------------------------------------------------

## Code of Conduct

Be respectful. Be constructive. Be professional.

We aim to maintain a welcoming and inclusive environment for everyone.

------------------------------------------------------------------------

## How to Contribute

### 1. Fork the Repository

Click the **Fork** button on GitHub and clone your fork locally:

``` bash
git clone https://github.com/<your-username>/crashcue.git
cd crashcue
```

------------------------------------------------------------------------

### 2. Create a Branch

Always create a feature branch from `main`:

``` bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:

-   `feature/...` -- New features
-   `fix/...` -- Bug fixes
-   `docs/...` -- Documentation updates
-   `refactor/...` -- Code refactoring
-   `test/...` -- Test improvements

------------------------------------------------------------------------

### 3. Install Dependencies

``` bash
npm install
```

------------------------------------------------------------------------

### 4. Run the Project

``` bash
npm run build
npm test
```

Ensure all tests pass before submitting a PR.

------------------------------------------------------------------------

## Pull Request Guidelines

Before submitting a PR, ensure:

-   Code builds successfully
-   Tests pass
-   No linting errors
-   Changes are documented (if applicable)
-   Commit messages are clear and descriptive

### Commit Message Format

Use clear, concise messages:

    feat: add debounce control for rapid error detection
    fix: resolve Windows audio playback issue
    docs: update installation instructions

------------------------------------------------------------------------

## Reporting Bugs

When reporting bugs, please include:

-   Operating system
-   Shell (bash, zsh, fish, PowerShell)
-   Node.js version
-   Steps to reproduce
-   Expected behavior
-   Actual behavior

Open an issue with a clear title and detailed description.

------------------------------------------------------------------------

## Suggesting Features

We welcome feature suggestions.

Please:

-   Check if the feature already exists
-   Open a new issue
-   Clearly explain the use case
-   Provide example behavior if possible

------------------------------------------------------------------------

## Development Structure

CrashCue is organized into:

    packages/
      notifier/          # Core sound playback logic
      cli/               # CLI wrapper and command execution
      vscode-extension/  # VSCode integration

------------------------------------------------------------------------

## Security Policy

CrashCue runs locally and does not collect telemetry.

If you discover a security vulnerability:

-   Do NOT open a public issue.
-   Email the maintainer directly (to be defined).
-   Provide detailed reproduction steps.

------------------------------------------------------------------------

## Good First Issues

Look for issues labeled:

-   `good first issue`
-   `help wanted`
-   `documentation`

These are great starting points.

------------------------------------------------------------------------

## License

By contributing, you agree that your contributions will be licensed
under the MIT License.

------------------------------------------------------------------------

## Final Note

CrashCue is built for developers who care about feedback loops.

Thank you for helping make terminal failures impossible to ignore.
