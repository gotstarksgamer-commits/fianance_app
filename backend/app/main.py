import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.init_db import init_database
from routers import auth, AIAnalysis, budget, dashboard, expense, goal, income, investment, loan, util

# Initialize database on startup
init_database()

# Create the main app
app = FastAPI(
    title="Personal Finance Tracker",
    description="Privacy-first personal finance management with local AI and user management",
    version="2.0.0"
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(loan.router, prefix="/api")
app.include_router(expense.router, prefix="/api")
app.include_router(income.router, prefix="/api")
app.include_router(investment.router, prefix="/api")
app.include_router(budget.router, prefix="/api")
app.include_router(goal.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(AIAnalysis.router, prefix="/api")
app.include_router(util.router, prefix="/api")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Personal Finance Tracker API", "version": "2.0.0"}

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    try:
        uvicorn.run(app, host="0.0.0.0", port=8001)
    except Exception as e:
        print(f"Error starting server: {e}")