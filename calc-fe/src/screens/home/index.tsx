import { Header } from '@/components/Header';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import {ChevronDown, ChevronUp, } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

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

    const formatLatex = (latex: string) => {
        const parts = latex.split(/(?<==)|(?==)/g).filter(Boolean);
        return parts.map((part, index) => {
            if (index === 0) return `&${part}`;
            if (part === '=') {
                return index === 1 ? ` ${part}` : `\\\\ &${part}`;
            }
            return part;
        }).join(' ');
    };

    // Format step for KaTeX
    const formatStep = (step: string) => {
        return step
            .replace(/\\\(/g, '')
            .replace(/\\\)/g, '')
            .replace(/≈/g, '\\approx')
            .replace(/\bsqrt\b/g, '\\sqrt');
    };

    return (
        <Draggable defaultPosition={position}>
            <div className="result-card min-w-[320px] max-w-[500px] rounded-xl">
                {/* Type Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide ${
                        response.type === 'arithmetic' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' :
                        response.type === 'equation' ? 'bg-green-500/20 text-green-300 border border-green-500/20' :
                        response.type === 'function' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' :
                        response.type === 'variable_assignment' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/20' :
                        'bg-gray-500/20 text-gray-300 border border-gray-500/20'
                    }`}>
                        {response.type}
                    </span>
                </div>

                {/* Main Result */}
                <div className="p-6 border-b border-gray-700/50">
                    <div className="latex-content text-2xl mb-2 text-gray-100">
                        {`\\(\\begin{align*}${formatLatex(response.latex)}\\end{align*}\\)`}
                    </div>
                </div>

                {/* Steps Dropdown - Only show for non-variable assignments */}
                {response.type !== 'variable_assignment' && response.steps && response.steps.length > 0 && (
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
                                        <InlineMath math={formatStep(step)} />
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
                console.log('Response:', resp);
                
                // Update responses without clearing canvas
                setResponses(prev => [...prev, ...resp.data]);

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
            <Header 
                setReset={setReset}
                clearSolutions={clearSolutions}
                toggleEraser={toggleEraser}
                isEraser={isEraser}
                setShowColorPicker={setShowColorPicker}
                showColorPicker={showColorPicker}
                color={color}
                runRoute={runRoute}
                isCalculating={isCalculating}
                setColor={setColor}
            />

            {/* Main Canvas */}
            <canvas
                ref={canvasRef}
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
