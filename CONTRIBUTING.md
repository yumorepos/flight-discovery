# Contributing to Flight Discovery

Thank you for your interest in contributing! This project is primarily a portfolio piece, but contributions are welcome.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yumorepos/flight-discovery.git
   cd flight-discovery
   ```

2. **Backend setup**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Add your KIWI_API_KEY to .env
   uvicorn main:app --reload --port 8000
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local
   npm run dev
   ```

4. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/docs

## Code Standards

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Strict mode enabled, use interfaces
- **Testing**: Add Playwright tests for new features
- **Commits**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Pull Request Process

1. Fork the repo and create a feature branch
2. Make your changes with clear commit messages
3. Add tests if applicable
4. Update documentation (README, ARCHITECTURE.md)
5. Submit a PR with a clear description

## Testing

```bash
# Backend tests
cd backend
pytest

# Frontend E2E tests
cd frontend
npm test
```

## Questions?

Open an issue or reach out via [LinkedIn](https://linkedin.com/in/yumo-xu-1589b7326).
