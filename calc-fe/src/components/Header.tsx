import { Button } from '@/components/ui/button';
import { Trash2, Calculator, Eraser, Pencil, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
    setReset: (value: boolean) => void;
    clearSolutions: () => void;
    toggleEraser: () => void;
    isEraser: boolean;
    setShowColorPicker: (value: boolean) => void;
    showColorPicker: boolean;
    color: string;
    runRoute: () => void;
    isCalculating: boolean;
    setColor: (color: string) => void;
}

// Define colors with better organization
const SWATCHES = [
    // Row 1: Whites & Grays
    '#FFFFFF', '#E2E8F0', '#94A3B8', '#475569',
    // Row 2: Reds & Pinks
    '#EF4444', '#F87171', '#EC4899', '#D946EF',
    // Row 3: Blues & Cyans
    '#3B82F6', '#06B6D4', '#2DD4BF', '#0EA5E9',
    // Row 4: Greens & Limes
    '#22C55E', '#84CC16', '#14B8A6', '#10B981',
    // Row 5: Yellows & Oranges
    '#F59E0B', '#F97316', '#EA580C', '#FB923C'
];

export function Header({
    setReset,
    clearSolutions,
    toggleEraser,
    isEraser,
    setShowColorPicker,
    showColorPicker,
    color,
    runRoute,
    isCalculating,
    setColor,
}: HeaderProps) {
    return (
        <div className="fixed top-0 left-0 right-0 p-4 toolbar z-30">
            <div className='grid grid-cols-3 gap-4 max-w-6xl mx-auto'>
                {/* Left Section - Logo/Brand */}
                <div className="flex items-center">
                    <span className="text-xl font-semibold text-gray-100">SayonAI</span>
                </div>

                {/* Center Section - Drawing Tools */}
                <div className="flex justify-center items-start gap-3">
                    <div className="relative">
                        <div className="flex bg-gray-800/50 rounded-lg p-1">
                            <Button
                                onClick={toggleEraser}
                                variant={isEraser ? "secondary" : "ghost"}
                                className={`rounded-l-md transition-colors ${
                                    isEraser ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                title={isEraser ? "Switch to Pen" : "Switch to Eraser"}
                            >
                                {isEraser ? (
                                    <Pencil className="w-4 h-4" />
                                ) : (
                                    <Eraser className="w-4 h-4" />
                                )}
                            </Button>

                            <Button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                variant="ghost"
                                className="relative rounded-r-md text-gray-400 hover:text-gray-200"
                                title="Color Picker"
                            >
                                <Palette className="w-4 h-4" />
                                <div 
                                    className="w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-gray-700"
                                    style={{ backgroundColor: color }}
                                />
                            </Button>
                        </div>

                        {/* Color Picker Dropdown */}
                        <AnimatePresence>
                            {showColorPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 mt-2 p-3 min-w-[200px] bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl z-50 border border-gray-700"
                                >
                                    <div className="grid grid-cols-4 gap-2">
                                        {SWATCHES.map((swatch) => (
                                            <motion.button
                                                key={swatch}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setColor(swatch);
                                                    setShowColorPicker(false);
                                                }}
                                                className={`w-6 h-6 rounded-full transition-shadow ${
                                                    color === swatch 
                                                        ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-gray-800 shadow-lg' 
                                                        : 'hover:ring-1 hover:ring-gray-500'
                                                }`}
                                                style={{ 
                                                    backgroundColor: swatch,
                                                    boxShadow: color === swatch ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    
                                    {/* Current Color Preview */}
                                    <div className="mt-2 pt-2 border-t border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-6 h-6 rounded-full border border-gray-600"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-xs text-gray-400 font-mono">
                                                {color.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex bg-gray-800/50 rounded-lg p-1">
                        <Button
                            onClick={() => setReset(true)}
                            variant="ghost"
                            className="rounded-l-md text-gray-400 hover:text-gray-200"
                            title="Clear Canvas"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                            onClick={clearSolutions}
                            variant="ghost"
                            className="rounded-r-md text-gray-400 hover:text-gray-200"
                            title="Clear Solutions"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div className="flex justify-end items-center gap-2">
                    <Button
                        onClick={runRoute}
                        variant="default"
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ${
                            isCalculating ? 'opacity-90 cursor-not-allowed' : ''
                        }`}
                        disabled={isCalculating}
                    >
                        {isCalculating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                <span className="text-sm">Processing...</span>
                            </>
                        ) : (
                            <>
                                <Calculator className="w-4 h-4 mr-2" />
                                <span className="text-sm">Calculate</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
} 