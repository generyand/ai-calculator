import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import {SWATCHES} from '@/constants';
import { Trash2, Calculator, Eraser, Pencil, ChevronDown, ChevronUp, X, Palette } from 'lucide-react';
// import {LazyBrush} from 'lazy-brush';

interface Response {
    expr: string;
    result: string;
    steps: string[];
    type: 'arithmetic' | 'equation' | 'variable_assignment' | 'function';
    assign: boolean;
    latex: string;
}

interface Result {
    expression: string;
    answer: string;
}

// New Result Card Component
const ResultCard = ({ response, position }: { response: Response; position: { x: number; y: number } }) => {
    const [showSteps, setShowSteps] = useState(false);

    return (
        <Draggable defaultPosition={position}>
            <div className="result-card min-w-[320px] max-w-[500px] rounded-xl">
                {/* Type Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide ${
                        response.type === 'arithmetic' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' :
                        response.type === 'equation' ? 'bg-green-500/20 text-green-300 border border-green-500/20' :
                        response.type === 'function' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' :
                        'bg-gray-500/20 text-gray-300 border border-gray-500/20'
                    }`}>
                        {response.type}
                    </span>
                </div>

                {/* Main Result */}
                <div className="p-6 border-b border-gray-700/50">
                    <div className="latex-content text-2xl mb-2 text-gray-100">
                        {`\\(${response.latex}\\)`}
                    </div>
                </div>

                {/* Steps Dropdown */}
                {response.steps && response.steps.length > 0 && (
                    <div>
                        <button
                            onClick={() => setShowSteps(!showSteps)}
                            className="flex items-center justify-between w-full p-4 text-gray-300 hover:bg-gray-800/30 transition-colors"
                        >
                            <span className="font-medium">Solution Steps</span>
                            {showSteps ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </button>
                        {showSteps && (
                            <div className="p-4 space-y-3 bg-gray-800/20">
                                {response.steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="text-gray-300 text-sm leading-relaxed step-animation"
                                    >
                                        {step}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Draggable>
    );
};

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [responses, setResponses] = useState<Response[]>([]);
    const [isEraser, setIsEraser] = useState(false);
    const [previousColor, setPreviousColor] = useState(color);
    const [isCalculating, setIsCalculating] = useState(false);
    const [latexExpression, setLatexExpression] = useState<string[]>([]);
    const [result, setResult] = useState<Result | undefined>();
    const [showColorPicker, setShowColorPicker] = useState(false);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    const renderLatexToCanvas = useCallback((expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression(prev => [...prev, latex]);

        // Clear the main canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, []);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result, renderLatexToCanvas]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }

        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    processEscapes: true
                },
                messageStyle: 'none',
                showProcessingMessages: false
            });
        };

        return () => {
            document.head.removeChild(script);
        };

    }, []);

    useEffect(() => {
        if (responses.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
            }, 100);
        }
    }, [responses]);

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (isEraser) {
                    // Eraser functionality
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.strokeStyle = 'rgba(0,0,0,1)';
                    ctx.lineWidth = 20; // Bigger width for eraser
                } else {
                    // Normal drawing
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 3;
                }
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
        }
    };
    const stopDrawing = () => {
        setIsDrawing(false);
    };  

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            try {
                setIsCalculating(true);
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    }
                });

                const resp = await response.data;
                console.log('Response', resp);
                
                // Handle variable assignments and update LaTeX expressions
                const newLatexExpressions = resp.data.map((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars(prev => ({
                            ...prev,
                            [data.expr]: data.result
                        }));
                    }
                    return data.latex;
                });

                setLatexExpression(prev => [...prev, ...newLatexExpressions]);
                setResponses(resp.data);

                // Clear canvas after successful calculation
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }

            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsCalculating(false);
            }
        }
    };

    const toggleEraser = () => {
        if (!isEraser) {
            setPreviousColor(color);
        } else {
            setColor(previousColor);
        }
        setIsEraser(!isEraser);
    };

    const clearSolutions = () => {
        setResponses([]);
        setLatexExpression([]);
    };

    return (
        <div className="min-h-screen bg-[#121212]">
            {/* Main Toolbar */}
            <div className="fixed top-0 left-0 right-0 p-4 toolbar z-30">
                <div className='grid grid-cols-3 gap-4 max-w-6xl mx-auto'>
                    {/* Left Section - Canvas Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setReset(true)}
                            variant="ghost"
                            className='hover:bg-gray-800'
                            title="Clear Canvas"
                        >
                            <Trash2 className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-300">Clear Canvas</span>
                        </Button>

                        <Button
                            onClick={clearSolutions}
                            variant="ghost"
                            className='hover:bg-gray-800'
                            title="Clear Solutions"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-300">Clear Solutions</span>
                        </Button>
                    </div>

                    {/* Center Section - Drawing Tools */}
                    <div className="flex justify-center items-center gap-2">
                        <Button
                            onClick={toggleEraser}
                            variant={isEraser ? "secondary" : "ghost"}
                            className={`hover:bg-gray-800 ${isEraser ? 'bg-gray-700' : ''}`}
                            title={isEraser ? "Switch to Pen" : "Switch to Eraser"}
                        >
                            {isEraser ? (
                                <Pencil className="w-5 h-5 text-gray-300" />
                            ) : (
                                <Eraser className="w-5 h-5 text-gray-300" />
                            )}
                        </Button>

                        <Button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            variant="ghost"
                            className='hover:bg-gray-800 relative'
                            title="Color Picker"
                        >
                            <Palette className="w-5 h-5 text-gray-300" />
                            <div 
                                className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border border-gray-700"
                                style={{ backgroundColor: color }}
                            />
                        </Button>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex justify-end gap-2">
                        <Button
                            onClick={runRoute}
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isCalculating}
                        >
                            {isCalculating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Calculating...</span>
                                </>
                            ) : (
                                <>
                                    <Calculator className="w-5 h-5" />
                                    <span>Calculate</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Floating Color Picker */}
            {showColorPicker && !isEraser && (
                <div className="fixed left-4 top-20 color-picker-panel z-40 p-4 rounded-lg shadow-xl">
                    <div className="grid grid-cols-5 gap-2">
                        {SWATCHES.map((swatch) => (
                            <button
                                key={swatch}
                                onClick={() => {
                                    setColor(swatch);
                                    setShowColorPicker(false);
                                }}
                                className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                                    color === swatch ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''
                                }`}
                                style={{ backgroundColor: swatch }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Canvas */}
            <canvas
                ref={canvasRef}
                id='canvas'
                className={`absolute top-0 left-0 w-full h-full canvas-area ${
                    isEraser ? 'eraser-cursor' : 'cursor-crosshair'
                }`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {/* Results Display */}
            {responses.map((response, index) => (
                <ResultCard
                    key={index}
                    response={response}
                    position={{ x: 20 + (index * 30), y: 100 + (index * 30) }}
                />
            ))}

            {/* Loading State */}
            {isCalculating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="loading-card">
                        <div className="flex flex-col items-center gap-4">
                            <div className="loading-animation">
                                <div className="calculation-circle"></div>
                                <div className="calculation-circle"></div>
                                <div className="calculation-circle"></div>
                            </div>
                            <p className="text-gray-300 font-medium">Calculating...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
