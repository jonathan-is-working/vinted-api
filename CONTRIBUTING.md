# Contributing

Thanks for your interest! Issues and pull requests are welcome.

## Before opening a pull request

Make sure all checks pass locally before opening a PR:

```sh
# Backend
cd backend
npm run typecheck
npm run lint

# Frontend
cd ../frontend
npm run build
```

CI will automatically run these checks on push and pull requests (see `.github/workflows/ci.yml`).

## Guidelines

- **No hardcoded secrets or tokens**: Never commit cookies, bot tokens, session JWTs, or test dumps containing personal user data. Use `.env.example` templates.
- **Respect upstream throttling**: Upstream requests to Vinted must pass through the `RateLimiter` (`VintedClient`). Do not bypass rate limits or introduce unbounded parallel crawling.
- **Deterministic and safe session bootstrap**: Playwright sessions must run headlessly and clean up context gracefully on exit.
- **Privacy-first**: Telegram bot tokens are sensitive credentials and must be stored masked or environment-bound.

## Reporting issues

- **Bug reports**: Please include your Node version, OS, Docker version (if applicable), and sanitized logs without credentials.
- **Security issues**: If you find an exploit or secret leak, please report it responsibly rather than opening a public issue.

By contributing, you agree that your contributions are licensed under the project's terms (MIT OR Apache-2.0).
