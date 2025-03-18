from fastapi import APIRouter, HTTPException
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    try:
        # Validate input data
        if not data.image:
            raise ValueError("No image data provided")
            
        try:
            # Decode and process image
            image_data = base64.b64decode(data.image.split(",")[1])
            image_bytes = BytesIO(image_data)
            image = Image.open(image_bytes)
        except base64.binascii.Error as e:
            logger.error(f"Invalid base64 image data: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid image data format")
        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to process image data")
        
        try:
            # Get responses from analysis
            responses = analyze_image(image, dict_of_vars=data.dict_of_vars)
            data = []
            
            # Process all responses
            for response in responses:
                data.append(response)
                
            # Log successful processing
            logger.info(f"Successfully processed image with {len(data)} responses")
            
            return {
                "message": "Image processed successfully", 
                "data": data, 
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Error in image analysis: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to analyze image")
            
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except ValueError as ve:
        # Handle validation errors
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
