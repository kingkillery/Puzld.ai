---
domain: data
keywords: [api, rest, graphql, endpoint, refactor, fastapi, express, flask]
confidence: high
---

# API Refactoring Pattern

## Context
Use when restructuring REST API endpoints, migrating frameworks, or improving API design.

## Steps
1. Document existing API contracts (OpenAPI/Swagger if available)
2. Create/update API tests for current behavior (contract tests)
3. Design new endpoint structure maintaining backwards compatibility
4. Implement new handlers alongside old ones (parallel routes)
5. Add deprecation warnings to old endpoints
6. Migrate consumers to new endpoints
7. Remove deprecated endpoints after migration period

## Pitfalls
- Never break existing consumers without deprecation period
- Maintain consistent error response formats
- Don't forget to update API documentation
- Watch for authentication/authorization changes

## Example
```python
# Deprecation pattern
@app.get("/api/v1/users/{id}")  # Old - deprecated
@app.get("/api/v2/users/{id}")  # New - preferred
async def get_user(id: str, version: str = "v2"):
    if version == "v1":
        logger.warning("Deprecated API v1 called")
    return await user_service.get(id)
```

## Verification Commands
- `pytest tests/api/` - Run API tests
- `npm run test:integration` - Integration tests
- `curl -X GET /api/health` - Health check
