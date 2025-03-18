# AI Calculator

An intelligent calculator application that can process and solve mathematical expressions from images using AI. This application combines modern web technologies with artificial intelligence to provide a seamless experience for solving mathematical problems.

## Features

- Image-based mathematical expression recognition
- Support for both handwritten and printed mathematical expressions
- Real-time processing and results
- Modern, responsive user interface
- RESTful API architecture

## Tech Stack

### Frontend
- React + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Modern ESLint configuration

### Backend
- FastAPI (Python)
- Image processing capabilities
- AI/ML integration for mathematical expression recognition
- Gemini LLM for advanced text processing
- CORS support for cross-origin requests

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- Git
- Google Cloud API key for Gemini LLM

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd calc-be
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `calc-be` directory with the following content:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```
Replace `your_gemini_api_key_here` with your actual Google Cloud API key for Gemini LLM. This key is required for the Gemini 1.5 Flash model used for mathematical expression analysis.

Note: The application uses the Gemini 1.5 Flash model for processing mathematical expressions. Make sure your API key has access to this model.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd calc-fe
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start the Backend Server

1. From the `calc-be` directory:
```bash
python main.py
```
The backend server will start at `http://localhost:8000`

### Start the Frontend Development Server

1. From the `calc-fe` directory:
```bash
npm run dev
```
The frontend development server will start at `http://localhost:5173`

## Usage

1. Open your web browser and navigate to `http://localhost:5173`
2. Upload an image containing a mathematical expression
3. The application will process the image and display the recognized expression and its solution
4. You can also view the processing history and save results

## API Endpoints

### POST /calculate
- Accepts image data in base64 format
- Returns processed mathematical expressions and solutions
- Supports additional variables through `dict_of_vars` parameter

### GET /
- Health check endpoint
- Returns server status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to the open-source community for providing the tools and libraries that make this possible 