from constants import GEMINI_API_KEY
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_gemini():
    try:
        logger.info(f"API Key present: {'Yes' if GEMINI_API_KEY else 'No'}")
        if GEMINI_API_KEY:
            logger.info("API Key length: %d", len(GEMINI_API_KEY))
            
        # Configure Gemini API
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Successfully configured Gemini API")
        
        # Try to initialize the model
        model = genai.GenerativeModel(model_name="gemini-2.0-flash")
        logger.info("Successfully initialized Gemini model")
        
        # Try a simple test generation
        response = model.generate_content("Test connection")
        logger.info("Successfully generated test response")
        logger.info(f"Response: {response.text}")
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")

if __name__ == "__main__":
    test_gemini() 