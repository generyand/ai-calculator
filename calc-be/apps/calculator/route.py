from fastapi import APIRouter
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    try:
        # Decode and process image
        image_data = base64.b64decode(data.image.split(",")[1])
        image_bytes = BytesIO(image_data)
        image = Image.open(image_bytes)
        
        # Get responses from analysis
        responses = analyze_image(image, dict_of_vars=data.dict_of_vars)
        data = []
        
        # Process all responses
        for response in responses:
            data.append(response)
            
        # Print the entire data array instead of last response
        print('responses in route: ', data)
        
        return {
            "message": "Image processed", 
            "data": data, 
            "status": "success"
        }
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return {
            "message": str(e),
            "data": [],
            "status": "error"
        }
