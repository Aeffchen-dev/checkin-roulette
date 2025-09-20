import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategorySelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategorySelector({ 
  open, 
  onOpenChange, 
  categories, 
  selectedCategories, 
  onCategoriesChange 
}: CategorySelectorProps) {
  const [tempSelection, setTempSelection] = useState<string[]>(selectedCategories);

  // Update temp selection when selectedCategories prop changes
  useEffect(() => {
    setTempSelection(selectedCategories);
  }, [selectedCategories]);

  // Generate random width for each category
  const getRandomWidth = (index: number) => {
    // Use index as seed for consistent random values across renders
    const seed = (index + 1) * 137; // Simple pseudo-random
    const random = (seed % 100) / 100;
    return 77 + (random * 6); // 77% to 83% (6% total variation)
  };

  const getCategoryColors = (index: number) => {
    const colorIndex = (index % 6) + 1;
    return {
      stripColor: `hsl(var(--quiz-category${colorIndex}-bg))`,
      cardBgColor: `hsl(var(--quiz-category${colorIndex}-bg-pastel))`,
      textColor: `hsl(var(--quiz-category${colorIndex}-text-dark))`
    };
  };

  const handleCategoryToggle = (category: string) => {
    setTempSelection(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onCategoriesChange(tempSelection);
    onOpenChange(false);
  };

  const handleClose = () => {
    onCategoriesChange(tempSelection); // Apply changes when closing
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[500px] mx-auto bg-background border-0 rounded-2xl p-0 overflow-hidden [&>button]:hidden h-[100svh] md:h-[90vh]">
        <DialogDescription className="sr-only">
          Wählen Sie die Kategorien aus, die Sie sehen möchten
        </DialogDescription>
        <div className="flex flex-col h-full relative w-full max-h-full min-h-0">
          {/* Header */}
          <div className="absolute top-6 left-6 right-6 z-10 flex items-baseline justify-between">
            <h2 className="text-white text-xl font-normal">
              Kategorien wählen
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Categories List */}
          <ScrollArea className="flex-1 pt-20 min-h-0">
            <div className="px-4 space-y-4 pb-6">
              {categories.map((category, index) => {
              const isSelected = tempSelection.includes(category);
              const categoryColors = getCategoryColors(index);
              const itemWidth = isSelected ? getRandomWidth(index) : 80; // Same width when inactive
              
              return (
                <div 
                  key={category}
                  className={`flex items-center justify-between cursor-pointer transition-transform duration-300 ease-out ${isSelected ? 'animate-bounce-right' : ''}`}
                  style={{ 
                    borderTopLeftRadius: '8px',
                    borderBottomLeftRadius: '8px',
                    borderTopRightRadius: '999px',
                    borderBottomRightRadius: '999px',
                    backgroundColor: categoryColors.cardBgColor,
                    padding: '8px 8px 8px 16px',
                    transformOrigin: 'left center',
                    transform: isSelected ? 'scaleX(1.12)' : 'scaleX(1)',
                    width: `${itemWidth}%`
                  }}
                  onClick={() => handleCategoryToggle(category)}
                >
                  <span 
                    className="font-bold text-lg"
                    style={{ 
                      color: categoryColors.textColor,
                      fontFamily: 'Kokoro, serif',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      letterSpacing: '0'
                    }}
                  >
                    {category}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <div
                      className="relative cursor-pointer"
                      onClick={() => {
                        const newCategories = isSelected 
                          ? tempSelection.filter(c => c !== category)
                          : [...tempSelection, category];
                        setTempSelection(newCategories);
                      }}
                    >
                       <div
                        className="flex items-center justify-center"
                        style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '999px',
                          border: isSelected ? 'none' : `2px solid ${categoryColors.textColor}`,
                          backgroundColor: isSelected ? categoryColors.stripColor : 'transparent',
                          transform: isSelected ? 'scaleX(0.893)' : 'scaleX(1)' // Counter-transform to maintain 1:1 ratio
                        }}
                      >
                        {isSelected && (
                          <svg 
                            width="52" 
                            height="52" 
                            viewBox="0 0 24 24" 
                            fill="none"
                            style={{ 
                              color: categoryColors.textColor
                            }}
                          >
                            <path
                              d="m9 12 2 2 4-4"
                              stroke="currentColor"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{
                                strokeDasharray: '12',
                                strokeDashoffset: '12',
                                animation: 'drawCheckmark 0.3s ease-out forwards'
                              }}
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}