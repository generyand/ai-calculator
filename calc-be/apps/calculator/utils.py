import google.generativeai as genai
import ast
import json
import re
from PIL import Image
from constants import GEMINI_API_KEY
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Validate API key
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set in environment variables")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    logger.info("Successfully configured Gemini API")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {str(e)}")
    raise

def clean_gemini_response(response_text: str) -> str:
    """Clean the Gemini response by removing markdown code blocks and other artifacts"""
    # Remove ```json and ``` markers
    response_text = re.sub(r'```json\s*', '', response_text)
    response_text = re.sub(r'```\s*', '', response_text)
    
    # Remove any leading/trailing whitespace
    response_text = response_text.strip()
    
    return response_text

def validate_response_item(item: dict) -> bool:
    """Validate that a response item has the required fields"""
    required_fields = {'expr', 'result'}
    return all(field in item for field in required_fields)

def parse_gemini_response(response_text: str) -> list:
    """Safely parse the Gemini response into a list of dictionaries"""
    try:
        # First try ast.literal_eval
        try:
            parsed = ast.literal_eval(clean_gemini_response(response_text))
            if not isinstance(parsed, list):
                parsed = [parsed]
            return [item for item in parsed if validate_response_item(item)]
        except:
            # If ast.literal_eval fails, try json.loads
            cleaned_response = clean_gemini_response(response_text)
            parsed = json.loads(cleaned_response)
            if not isinstance(parsed, list):
                parsed = [parsed]
            return [item for item in parsed if validate_response_item(item)]
    except Exception as e:
        logger.error(f"Error processing response: {e}")
        logger.error(f"Original response was: {response_text}")
        return []

def analyze_image(img: Image, dict_of_vars: dict):
    try:
        # Initialize model with error handling
        try:
            model = genai.GenerativeModel(model_name="gemini-2.0-flash")
            logger.info("Successfully initialized Gemini model")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {str(e)}")
            raise ValueError("Failed to initialize AI model")

        dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
        prompt = (
            f"You are a specialized mathematical expression analyzer. Your task is to analyze the handwritten mathematical content in the image and provide precise calculations. "
            f"IMPORTANT RULES:\n"
            f"1. ALWAYS follow PEMDAS (Parentheses, Exponents, Multiplication/Division left-to-right, Addition/Subtraction left-to-right)\n"
            f"2. Show step-by-step calculations in the 'steps' field\n"
            f"3. Return ALL numbers with full precision\n"
            f"4. For variables, use values from this dictionary: {dict_of_vars_str}\n"
            f"5. Keep text explanations concise and clear\n"
            f"6. Break long mathematical expressions into smaller steps\n"
            f"7. For complex problems, explain each major concept before calculations\n"
            f"8. Handle dimensional analysis and unit conversions explicitly\n\n"
            
            f"RESPONSE FORMAT:\n"
            f"Return a LIST of objects, where each object MUST follow this structure:\n"
            f"{{\n"
            f"  'expr': 'original expression',\n"
            f"  'result': 'final calculated result',\n"
            f"  'steps': [  // Array of step objects\n"
            f"    {{\n"
            f"      'type': 'text',  // For explanations\n"
            f"      'content': 'Brief, clear explanation of the next step'\n"
            f"    }},\n"
            f"    {{\n"
            f"      'type': 'math',  // For equations\n"
            f"      'content': 'Mathematical expression with proper spacing'\n"
            f"    }}\n"
            f"  ],\n"
            f"  'type': 'arithmetic|equation|variable_assignment|function',\n"
            f"  'assign': boolean,\n"
            f"  'latex': 'LaTeX formatted expression'\n"
            f"}}\n\n"
            
            f"STEP FORMATTING RULES:\n"
            f"1. Text steps:\n"
            f"   - Keep explanations under 100 characters\n"
            f"   - Use clear, simple language\n"
            f"   - For complex concepts, add a brief explanation first\n"
            f"   - Example: {{'type': 'text', 'content': 'Using integration by parts where u = x and dv = e^x dx'}}\n\n"
            
            f"2. Math steps:\n"
            f"   - Include proper spacing around operators\n"
            f"   - Break long expressions into multiple lines\n"
            f"   - Show intermediate steps for complex calculations\n"
            f"   - Example: {{'type': 'math', 'content': '\\\\int x e^x dx = x e^x - \\\\int e^x dx'}}\n\n"
            
            f"COMPLEX PROBLEM HANDLING:\n"
            f"1. Calculus:\n"
            f"   - Show derivative/integral rules being applied\n"
            f"   - Break down chain rule steps\n"
            f"   - Example: d/dx(sin(x^2)) → 2x * cos(x^2)\n\n"
            
            f"2. Linear Algebra:\n"
            f"   - Show matrix operations step by step\n"
            f"   - Explain row operations in text steps\n"
            f"   - Include determinant calculations\n\n"
            
            f"3. Geometry:\n"
            f"   - State relevant theorems/formulas first\n"
            f"   - Break down 3D problems into components\n"
            f"   - Include units in each step\n\n"
            
            f"4. Physics/Engineering:\n"
            f"   - Show unit analysis in each step\n"
            f"   - Convert units when necessary\n"
            f"   - State assumptions in text steps\n\n"
            
            f"SPECIAL FORMATTING:\n"
            f"- Units: Always add space between number and unit (e.g., '5 m' not '5m')\n"
            f"- Exponents: Use proper formatting (e.g., 'm^3' for cubic meters)\n"
            f"- Fractions: Show both forms (e.g., '0.3333... (1/3)')\n"
            f"- Scientific notation: Use proper LaTeX (e.g., '3 \\\\times 10^8')\n"
            f"- Vectors/Matrices: Use proper notation (e.g., '\\\\vec{{v}}', '\\\\begin{{matrix}}')\n"
            f"- Greek letters: Use LaTeX commands (e.g., '\\\\alpha', '\\\\beta')\n"
            f"- Long expressions: Break into multiple steps\n"
            f"- Equations: Show each transformation step\n\n"
            
            f"DO NOT USE BACKTICKS OR MARKDOWN FORMATTING IN THE RESPONSE.\n"
            f"ENSURE ALL STRINGS ARE PROPERLY QUOTED FOR Python's ast.literal_eval.\n"
        )

        # Generate content with error handling
        try:
            response = model.generate_content([prompt, img])
            logger.info("Successfully received response from Gemini")
            
            if not response or not response.text:
                logger.error("Empty response received from Gemini")
                raise ValueError("Empty response from AI model")
                
            logger.debug(f"Raw response from Gemini: {response.text}")
            answers = parse_gemini_response(response.text)
            
            if not answers:
                logger.warning("No valid answers parsed from Gemini response")
                raise ValueError("No valid answers found in AI response")
            
            # Add missing fields and ensure proper step formatting
            for answer in answers:
                if 'steps' not in answer:
                    answer['steps'] = []
                elif isinstance(answer['steps'], list) and all(isinstance(step, str) for step in answer['steps']):
                    # Convert old string steps to new format
                    answer['steps'] = [
                        {'type': 'math' if any(c in step for c in '=+-*/^') else 'text',
                         'content': step}
                        for step in answer['steps']
                    ]
                
                if 'assign' not in answer:
                    answer['assign'] = False
                if 'type' not in answer:
                    answer['type'] = 'arithmetic'
                if 'latex' not in answer:
                    answer['latex'] = f"{answer['expr']} = {answer['result']}"
            
            logger.info(f"Successfully processed {len(answers)} answers")
            return answers
            
        except Exception as e:
            logger.error(f"Error during Gemini API call: {str(e)}")
            raise ValueError(f"Failed to process image with AI: {str(e)}")
            
    except ValueError as ve:
        logger.error(f"Validation error in analyze_image: {str(ve)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_image: {str(e)}")
        raise ValueError(f"Unexpected error during image analysis: {str(e)}")