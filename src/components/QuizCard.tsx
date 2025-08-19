import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  question: string;
  category: string;
}

interface QuizCardProps {
  question: Question;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  animationClass?: string;
}

export function QuizCard({ question, onSwipeLeft, onSwipeRight, animationClass = '' }: QuizCardProps) {
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

  // Get category-specific colors
  const getCategoryColors = (category: string) => {
    switch (category.toLowerCase()) {
      case 'werte':
        return {
          bg: 'bg-quiz-werte-bg',
          text: 'text-quiz-werte-text'
        };
      case 'bedürfnisse':
        return {
          bg: 'bg-quiz-bedürfnisse-bg',
          text: 'text-quiz-bedürfnisse-text'
        };
      case 'kommunikation':
        return {
          bg: 'bg-quiz-kommunikation-bg',
          text: 'text-quiz-kommunikation-text'
        };
      case 'motivation':
        return {
          bg: 'bg-quiz-motivation-bg',
          text: 'text-quiz-motivation-text'
        };
      case 'grenzen':
        return {
          bg: 'bg-quiz-grenzen-bg',
          text: 'text-quiz-grenzen-text'
        };
      case 'vision':
        return {
          bg: 'bg-quiz-vision-bg',
          text: 'text-quiz-vision-text'
        };
      case 'no go':
        return {
          bg: 'bg-quiz-no-go-bg',
          text: 'text-quiz-no-go-text'
        };
      case 'risiko':
        return {
          bg: 'bg-quiz-risiko-bg',
          text: 'text-quiz-risiko-text'
        };
      case 'regeln':
        return {
          bg: 'bg-quiz-regeln-bg',
          text: 'text-quiz-regeln-text'
        };
      case 'info':
        return {
          bg: 'bg-quiz-info-bg',
          text: 'text-quiz-info-text'
        };
      case 'reflexion':
        return {
          bg: 'bg-quiz-reflexion-bg',
          text: 'text-quiz-reflexion-text'
        };
      case 'bindung':
        return {
          bg: 'bg-quiz-bindung-bg',
          text: 'text-quiz-bindung-text'
        };
      default:
        return {
          bg: 'bg-quiz-category-bg',
          text: 'text-quiz-category-text'
        };
    }
  };

  const categoryColors = getCategoryColors(question.category);

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

      {/* Category Strip */}
      <div className={`absolute left-0 top-0 h-full w-8 ${categoryColors.bg} flex items-center justify-center`}>
        <div className="transform -rotate-90 whitespace-nowrap">
          {Array(20).fill(question.category).map((cat, index) => (
            <span key={index} className={`${categoryColors.text} font-bold text-sm tracking-wide uppercase`} style={{ marginRight: index < 19 ? '8px' : '0' }}>
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-8 lg:ml-10 h-full flex flex-col justify-center px-8 lg:pr-10">

        <div ref={containerRef} className="flex-1 flex items-start justify-start text-left pt-16 w-full">
          <h1 
            ref={textRef}
            className="text-3xl md:text-4xl lg:text-4xl font-normal text-foreground leading-tight w-full max-w-full" 
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {processedText.length > 0 ? processedText : question.question}
          </h1>
        </div>

      </div>

    </div>
  );
}