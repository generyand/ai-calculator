import { Button } from '@/components/ui/button';
import { Trash2, Calculator, Eraser, Pencil, X, Palette } from 'lucide-react';

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
}

export function Header({
    setReset,
    clearSolutions,
    toggleEraser,
    isEraser,
    setShowColorPicker,
    showColorPicker,
    color,
    runRoute,
    isCalculating
}: HeaderProps) {
    return (
        <div className="fixed top-0 left-0 right-0 p-4 toolbar z-30">
            <div className='grid grid-cols-3 gap-4 max-w-6xl mx-auto'>
                {/* Left Section - Logo/Brand */}
                <div className="flex items-center">
                    <span className="text-xl font-semibold text-gray-100">AI Calculator</span>
                </div>

                {/* Center Section - Drawing Tools */}
                <div className="flex justify-center items-center gap-3">
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