import uvicorn
import logging
import sys
from constants import SERVER_URL, PORT, ENV

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ],
    force=True
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info(f"Starting server on {SERVER_URL}:{PORT}")
    logger.info(f"Environment: {ENV}")
    logger.info(f"Reload mode: {'enabled' if ENV == 'dev' else 'disabled'}")
    
    # Run the server with reload disabled to see all logs
    uvicorn.run(
        "main:app",
        host=SERVER_URL,
        port=int(PORT),
        reload=False,  # Disable reload to see all logs
        log_level="info"
    ) 