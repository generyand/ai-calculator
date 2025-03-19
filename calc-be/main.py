from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import google.generativeai as genai
import logging
import sys
import os
from apps.calculator.route import router as calculator_router
from constants import SERVER_URL, PORT, ENV, GEMINI_API_KEY

# Set up basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("calculator-api")

# CORS Configuration
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite development server
    "http://127.0.0.1:5173",  # Alternative localhost
    "http://localhost:3000",  # React development server
    "http://127.0.0.1:3000",  # Alternative localhost
]

# Create FastAPI application
app = FastAPI(
    title="Calculator API",
    description="API for mathematical expression analysis using Gemini AI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility function to check Gemini API
def verify_gemini_api():
    """Verify Gemini API connection and configuration."""
    logger.info("Verifying Gemini API connection...")
    
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not set in environment variables")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        response = model.generate_content("Test connection")
        
        if not response or not response.text:
            logger.error("Empty response from Gemini API")
            return False
            
        logger.info("Gemini API connection verified successfully")
        return True
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return False

# Startup event
@app.on_event("startup")
async def startup_event():
    """Run when the application starts."""
    logger.info("=" * 50)
    logger.info("Starting Calculator API Server")
    logger.info(f"Environment: {ENV}")
    logger.info(f"Server URL: http://{SERVER_URL}:{PORT}")
    logger.info(f"API Documentation: http://{SERVER_URL}:{PORT}/docs")
    logger.info("=" * 50)
    
    # Verify Gemini API
    if not verify_gemini_api():
        logger.warning("Starting server despite Gemini API verification failure")
    else:
        logger.info("All systems go!")

# Shutdown event
@app.on_event("shutdown")
def shutdown_event():
    """Run when the application is shutting down."""
    logger.info("Application shutting down")

# Health check endpoint
@app.get('/health')
async def health_check():
    """Health check endpoint"""
    logger.info("Health check accessed")
    if verify_gemini_api():
        return {"status": "healthy", "message": "Server and Gemini API are functioning correctly"}
    else:
        return {"status": "unhealthy", "message": "Gemini API connection failed"}

# Root endpoint
@app.get('/')
async def root():
    """Root endpoint"""
    logger.info("Root endpoint accessed")
    return {
        "message": "Calculator API is running",
        "status": "online",
        "version": "1.0.0"
    }

# Include calculator routes
app.include_router(calculator_router, prefix="/calculate", tags=["calculate"])

# Main function to run the app
def main():
    """Main function to start the server."""
    logger.info("Starting server...")
    
    # Print startup banner to ensure it's visible
    print("\n" + "=" * 50)
    print(f"CALCULATOR API SERVER v1.0.0")
    print(f"Environment: {ENV}")
    print(f"Server URL: http://{SERVER_URL}:{PORT}")
    print(f"API Documentation: http://{SERVER_URL}:{PORT}/docs")
    print("=" * 50 + "\n")
    
    try:
        # Start the server
        uvicorn.run(
            app,
            host=SERVER_URL,
            port=int(PORT),
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Failed to start server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()