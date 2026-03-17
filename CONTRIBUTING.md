# Contributing to FlightFinder

Thank you for your interest in contributing!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yumorepos/flight-discovery.git
cd flight-discovery

# Install dependencies
npm install

# Run development server
cd frontend && npm run dev
```

## Project Structure

- `frontend/src/app/` - Next.js app pages
- `frontend/src/components/` - React components
- `frontend/src/lib/` - Utilities and data
- `frontend/tests/` - Playwright tests

## Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

## Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Write descriptive commit messages
- Add tests for new features

## Testing

```bash
# Run unit tests
npm test

# Run visual regression tests
npm run test:visual
```

## Questions?

Open an issue or reach out via GitHub discussions.
