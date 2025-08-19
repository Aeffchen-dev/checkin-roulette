import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  question: string;
  category: string;
  depth?: 'light' | 'deep';
}

interface QuizCardProps {
  question: Question;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  animationClass?: string;
  categoryIndex?: number;
  isIntroSlide?: boolean;
}

export function QuizCard({ question, onSwipeLeft, onSwipeRight, animationClass = '', categoryIndex = 0, isIntroSlide = false }: QuizCardProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processedText, setProcessedText] = useState<JSX.Element[]>([]);
  
  const textRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  // Process text to handle long words individually
  useEffect(() => {
    const processText = () => {
      if (!containerRef.current) return;

      const words = question.question.split(' ');
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      
      // Create temporary element to measure word width with exact same styles
      const tempElement = document.createElement('span');
      tempElement.style.cssText = `
        position: absolute;
        visibility: hidden;
        white-space: nowrap;
        font-size: 3rem;
        font-family: inherit;
        font-weight: normal;
        padding: 0;
        margin: 0;
        border: 0;
      `;
      
      // Add to same container to inherit styles
      containerRef.current.appendChild(tempElement);

      const processedWords = words.map((word, index) => {
        tempElement.textContent = word;
        const wordWidth = tempElement.getBoundingClientRect().width;
        
        // Only apply hyphenation if word is actually wider than available space
        // Use full container width minus some padding buffer
        const needsHyphenation = wordWidth > (containerWidth - 20);
        
        return (
          <span 
            key={index}
            style={{
              hyphens: needsHyphenation ? 'auto' : 'none',
              overflowWrap: needsHyphenation ? 'break-word' : 'normal',
              wordBreak: 'normal'
            }}
            lang="de"
          >
            {word}
            {index < words.length - 1 && ' '}
          </span>
        );
      });

      containerRef.current.removeChild(tempElement);
      setProcessedText(processedWords);
    };

    const timeoutId = setTimeout(processText, 50);
    window.addEventListener('resize', processText);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', processText);
    };
  }, [question.question]);

  // Get category-specific colors using cycling system
  const getCategoryColors = (categoryIndex: number) => {
    const colorIndex = (categoryIndex % 6) + 1;
    
    // CSS custom properties for the colors
    const colorVars = {
      1: { bg: 'hsl(var(--quiz-category1-bg))', text: 'white' },
      2: { bg: 'hsl(var(--quiz-category2-bg))', text: 'white' },
      3: { bg: 'hsl(var(--quiz-category3-bg))', text: 'black' },
      4: { bg: 'hsl(var(--quiz-category4-bg))', text: 'black' },
      5: { bg: 'hsl(var(--quiz-category5-bg))', text: 'black' },
      6: { bg: 'hsl(var(--quiz-category6-bg))', text: 'black' },
    };
    
    return colorVars[colorIndex as keyof typeof colorVars] || colorVars[1];
  };

  const categoryColors = getCategoryColors(categoryIndex);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }
  };

  // Mouse drag handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    setMouseEnd(null);
    setMouseStart(e.clientX);
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setMouseEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging || !mouseStart || !mouseEnd) {
      setIsDragging(false);
      return;
    }
    
    const distance = mouseStart - mouseEnd;
    const isLeftDrag = distance > minSwipeDistance;
    const isRightDrag = distance < -minSwipeDistance;

    if (isLeftDrag) {
      onSwipeLeft();
    } else if (isRightDrag) {
      onSwipeRight();
    }
    
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`relative w-full max-w-[500px] mx-auto bg-[hsl(var(--card-background))] rounded-2xl shadow-card overflow-hidden select-none max-h-full ${animationClass}`}
      style={{
        height: '100%',
        maxHeight: '100%'
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {/* Left Click Area - Previous */}
      <div 
        className="absolute left-0 top-0 w-20 h-full z-10 cursor-pointer"
        onClick={onSwipeRight}
      />

      {/* Right Click Area - Next */}
      <div 
        className="absolute right-0 top-0 w-20 h-full z-10 cursor-pointer"
        onClick={onSwipeLeft}
      />

      {/* Category Strip - Hidden for intro slide */}
      {!isIntroSlide && (
        <div 
          className="absolute left-0 top-0 h-full w-8 flex items-center justify-center"
          style={{ backgroundColor: categoryColors.bg }}
        >
          <div className="transform -rotate-90 whitespace-nowrap">
            {Array(20).fill(question.category).map((cat, index) => (
              <span 
                key={index} 
                className="font-bold text-sm tracking-wide uppercase" 
                style={{ 
                  color: categoryColors.text,
                  marginRight: index < 19 ? '8px' : '0' 
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`${isIntroSlide ? 'ml-0' : 'ml-8 lg:ml-10'} h-full flex flex-col justify-center px-8 lg:pr-10 relative`}>

        <div ref={containerRef} className={`flex-1 flex ${isIntroSlide ? 'items-center justify-center text-center' : 'items-start justify-start text-left pt-16'} w-full`}>
          <h1 
            ref={textRef}
            className={`${isIntroSlide ? 'text-base md:text-lg lg:text-xl' : 'text-3xl md:text-4xl lg:text-4xl'} font-normal text-foreground leading-tight w-full max-w-full`}
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {processedText.length > 0 ? processedText : question.question}
          </h1>
        </div>

        {/* Navigation instruction for intro slide */}
        {isIntroSlide && (
          <div className="absolute bottom-8 left-0 right-0 text-center px-8">
            <p className="text-xs text-foreground/60">Swipe um weiter zu navigieren</p>
          </div>
        )}

      </div>

    </div>
  );
}