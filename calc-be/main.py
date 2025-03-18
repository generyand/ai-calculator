from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apps.calculator.route import router as calculator_router
from constants import SERVER_URL, PORT, ENV, GEMINI_API_KEY
import google.generativeai as genai
import logging
import sys
import os

# Configure logging before anything else
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    force=True  # Force the configuration to override any existing configuration
)

# Set up logging
logger = logging.getLogger(__name__)

# Disable uvicorn's default logging
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.disabled = True

# Define allowed origins
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite development server
    "http://127.0.0.1:5173",  # Alternative localhost
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",  # Alternative localhost
]

async def check_gemini_api():
    """Verify Gemini API connection and configuration"""
    try:
        logger.info("Checking Gemini API configuration...")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Environment: {ENV}")
        
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY is not set in environment variables")
            
        # Configure Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Successfully configured Gemini API")
        
        # Try to initialize the model
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        logger.info("Successfully initialized Gemini model")
        
        # Try a simple test generation
        response = model.generate_content("Test connection")
        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")
            
        logger.info("Successfully verified Gemini API connection")
        return True
        
    except Exception as e:
        logger.error(f"Failed to verify Gemini API connection: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Gemini API connection failed: {str(e)}"
        )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify Gemini API connection
    logger.info("Starting application...")
    logger.info("Checking environment variables...")
    logger.info(f"SERVER_URL: {SERVER_URL}")
    logger.info(f"PORT: {PORT}")
    logger.info(f"ENV: {ENV}")
    await check_gemini_api()
    logger.info("Application startup completed successfully")
    yield
    # Shutdown: Clean up if needed
    logger.info("Application shutting down")

app = FastAPI(
    title="Calculator API",
    description="API for mathematical expression analysis using Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.get('/')
async def root():
    logger.info("Root endpoint accessed")
    return {
        "message": "Server is running",
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get('/health')
async def health_check():
    """Health check endpoint that verifies Gemini API connection"""
    logger.info("Health check endpoint accessed")
    try:
        await check_gemini_api()
        return {
            "status": "healthy",
            "message": "Server and Gemini API are functioning correctly"
        }
    except HTTPException as he:
        return {
            "status": "unhealthy",
            "message": he.detail
        }

app.include_router(calculator_router, prefix="/calculate", tags=["calculate"])

if __name__ == "__main__":
    logger.info(f"Starting server on {SERVER_URL}:{PORT}")
    logger.info(f"Environment: {ENV}")
    logger.info(f"Reload mode: {'enabled' if ENV == 'dev' else 'disabled'}")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
    uvicorn.run(
        "main:app",
        host=SERVER_URL,
        port=int(PORT),
        reload=(ENV == "dev"),
        log_level="info"
    )