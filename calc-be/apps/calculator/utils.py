import google.generativeai as genai
import ast
import json
import re
from PIL import Image
from constants import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

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
        print(f"Error processing response: {e}")
        print(f"Original response was: {response_text}")
        return []

def analyze_image(img: Image, dict_of_vars: dict):
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
    prompt = (
        f"You are a specialized mathematical expression analyzer. Your task is to analyze the handwritten mathematical content in the image and provide precise calculations. "
        f"IMPORTANT RULES:\n"
        f"1. ALWAYS follow PEMDAS (Parentheses, Exponents, Multiplication/Division left-to-right, Addition/Subtraction left-to-right)\n"
        f"2. Show step-by-step calculations in the 'steps' field\n"
        f"3. Return ALL numbers with full precision\n"
        f"4. For variables, use values from this dictionary: {dict_of_vars_str}\n\n"
        
        f"RESPONSE FORMAT:\n"
        f"Return a LIST of objects, where each object MUST follow this structure:\n"
        f"{{\n"
        f"  'expr': 'original expression',\n"
        f"  'result': 'final calculated result',\n"
        f"  'steps': ['step1', 'step2', ...],\n"
        f"  'type': 'one of: arithmetic|equation|variable_assignment|function',\n"
        f"  'assign': boolean,\n"
        f"  'latex': 'LaTeX formatted expression'\n"
        f"}}\n\n"
        
        f"EXPRESSION TYPES AND EXAMPLES:\n"
        f"1. Arithmetic: '2 + 3 * 4'\n"
        f"   Response: {{'expr': '2 + 3 * 4', 'result': '14', 'steps': ['3 * 4 = 12', '2 + 12 = 14'], 'type': 'arithmetic', 'assign': false, 'latex': '2 + 3 \\\\times 4 = 14'}}\n\n"
        
        f"2. Equations: 'x^2 + 2x + 1 = 0'\n"
        f"   Response: {{'expr': 'x', 'result': '-1', 'steps': ['x^2 + 2x + 1 = 0', '(x + 1)^2 = 0', 'x = -1'], 'type': 'equation', 'assign': true, 'latex': 'x = -1'}}\n\n"
        
        f"3. Variable Assignment: 'y = 5'\n"
        f"   Response: {{'expr': 'y', 'result': '5', 'steps': ['y = 5'], 'type': 'variable_assignment', 'assign': true, 'latex': 'y = 5'}}\n\n"
        
        f"4. Functions: 'sin(30°)'\n"
        f"   Response: {{'expr': 'sin(30°)', 'result': '0.5', 'steps': ['sin(30°) = 0.5'], 'type': 'function', 'assign': false, 'latex': '\\\\sin(30°) = 0.5'}}\n\n"
        
        f"SPECIAL INSTRUCTIONS:\n"
        f"- For fractions, return both decimal and fractional forms: '1/3' → '0.3333... (1/3)'\n"
        f"- For trigonometric functions, assume degrees unless radians are specified\n"
        f"- For equations with multiple variables, solve and return each variable separately\n"
        f"- Always include proper LaTeX formatting for mathematical symbols\n"
        f"- Handle special mathematical constants (π, e, etc.) with full precision\n"
        f"- For complex expressions, break down the steps clearly\n\n"
        
        f"DO NOT USE BACKTICKS OR MARKDOWN FORMATTING IN THE RESPONSE.\n"
        f"ENSURE ALL STRINGS ARE PROPERLY QUOTED FOR Python's ast.literal_eval.\n"
    )

    try:
        response = model.generate_content([prompt, img])
        print("Raw response from Gemini:", response.text)
        answers = parse_gemini_response(response.text)
        
        # Add missing fields if necessary
        for answer in answers:
            if 'assign' not in answer:
                answer['assign'] = False
            if 'steps' not in answer:
                answer['steps'] = []
            if 'type' not in answer:
                answer['type'] = 'arithmetic'
            if 'latex' not in answer:
                answer['latex'] = f"{answer['expr']} = {answer['result']}"
        
        print('Processed answers:', answers)
        return answers
        
    except Exception as e:
        print(f"Error in processing image or Gemini response: {e}")
        return []