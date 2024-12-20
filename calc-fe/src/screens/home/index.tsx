import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import {SWATCHES} from '@/constants';
import { Trash2, Calculator, Eraser, Pencil } from 'lucide-react';
// import {LazyBrush} from 'lazy-brush';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    steps: string[];
    type: 'arithmetic' | 'equation' | 'variable_assignment' | 'function';
    assign: boolean;
    latex: string;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [isEraser, setIsEraser] = useState(false);
    const [previousColor, setPreviousColor] = useState(color);
    const [isCalculating, setIsCalculating] = useState(false);

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
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        };

    }, []);

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
                setIsCalculating(true);  // Start loading
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
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        // dict_of_vars[resp.result] = resp.answer;
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                });
                const ctx = canvas.getContext('2d');
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                setLatexPosition({ x: centerX, y: centerY });
                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result
                        });
                    }, 1000);
                });
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsCalculating(false);  // Stop loading
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

    return (
        <div className="min-h-screen bg-[#121212]">
            {/* Top Toolbar */}
            <div className="fixed top-0 left-0 right-0 p-4 toolbar z-30">
                <div className='grid grid-cols-3 gap-4 max-w-6xl mx-auto'>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setReset(true)}
                            variant="ghost"
                            className='hover:bg-gray-800'
                        >
                            <Trash2 className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-300">Clear</span>
                        </Button>

                        <div className="flex gap-2 ml-4">
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
                        </div>
                    </div>

                    <div className="flex justify-center items-center gap-2">
                        {!isEraser && (
                            <div className="color-swatch-container p-2 rounded-lg">
                                <div className="flex gap-2">
                                    {SWATCHES.map((swatch) => (
                                        <div
                                            key={swatch}
                                            onClick={() => setColor(swatch)}
                                            className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                                                color === swatch ? 'ring-2 ring-blue-500' : ''
                                            }`}
                                            style={{ backgroundColor: swatch }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
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

            {/* Main Canvas */}
            <canvas
                ref={canvasRef}
                id='canvas'
                className='absolute top-0 left-0 w-full h-full bg-[#121212] cursor-crosshair'
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />

            {/* Floating Results */}
            {latexExpression && latexExpression.map((latex, index) => (
                <Draggable
                    key={index}
                    defaultPosition={latexPosition}
                    onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                >
                    <div className="absolute p-3 bg-[#2A2A2A] rounded-lg shadow-lg border border-gray-700">
                        <div className="latex-content text-gray-200">{latex}</div>
                    </div>
                </Draggable>
            ))}

            {/* Loading Overlay */}
            {isCalculating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-[#1E1E1E] rounded-lg p-6 shadow-xl border border-gray-800">
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
