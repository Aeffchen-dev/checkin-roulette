import { useState, useEffect } from 'react';
import { QuizCard } from './QuizCard';
import { CategorySelector } from './CategorySelector';
import { IntroSlide } from './IntroSlide';
import { Switch } from './ui/switch';

interface Question {
  question: string;
  category: string;
  depth: 'light' | 'deep';
}

interface SlideItem {
  type: 'intro' | 'question';
  question?: Question;
}

// Smart shuffle algorithm to distribute categories more evenly
const smartShuffle = (questions: Question[]): Question[] => {
  // Group questions by category
  const categorizedQuestions: { [category: string]: Question[] } = {};
  questions.forEach(q => {
    if (!categorizedQuestions[q.category]) {
      categorizedQuestions[q.category] = [];
    }
    categorizedQuestions[q.category].push(q);
  });

  // Shuffle questions within each category
  Object.keys(categorizedQuestions).forEach(category => {
    categorizedQuestions[category] = categorizedQuestions[category].sort(() => Math.random() - 0.5);
  });

  const categories = Object.keys(categorizedQuestions);
  const result: Question[] = [];
  const categoryCounters: { [category: string]: number } = {};
  
  // Initialize counters
  categories.forEach(cat => categoryCounters[cat] = 0);

  // Distribute questions more evenly
  while (result.length < questions.length) {
    // Shuffle categories for each round
    const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
    
    for (const category of shuffledCategories) {
      const categoryQuestions = categorizedQuestions[category];
      const counter = categoryCounters[category];
      
      if (counter < categoryQuestions.length) {
        result.push(categoryQuestions[counter]);
        categoryCounters[category]++;
        
        // Break if we've added all questions
        if (result.length >= questions.length) break;
      }
    }
  }

  return result;
};

export function QuizApp() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [introSlide, setIntroSlide] = useState<Question | null>(null);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isMixedMode, setIsMixedMode] = useState(true);
  const [categoryColorMap, setCategoryColorMap] = useState<{ [category: string]: number }>({});

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Add touch/mouse handlers for desktop swipe
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const handleStart = (clientX: number, clientY: number) => {
      startX = clientX;
      startY = clientY;
      isDragging = true;
    };

    const handleEnd = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      // Only trigger if horizontal movement is greater than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          prevQuestion();
        } else {
          nextQuestion();
        }
      }
      
      isDragging = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      handleEnd(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const fetchQuestions = async () => {
    try {
      let csvText = '';
      
      try {
        // Use the new Google Sheets URL with cache busting
        const spreadsheetId = '1ROCLsLu2rSJKRwkX5DkZHLHKzy_bksmHbgGqORG2DOk';
        const timestamp = new Date().getTime();
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0&cachebust=${timestamp}`;
        
        const response = await fetch(csvUrl, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch spreadsheet data');
        }
        
        csvText = await response.text();
      } catch (sheetsError) {
        console.log('Google Sheets failed, trying local CSV file:', sheetsError);
        // Fallback to local CSV file
        const localResponse = await fetch('/quiz_questions.csv');
        if (!localResponse.ok) {
          throw new Error('Failed to fetch local CSV data');
        }
        csvText = await localResponse.text();
      }
      
      // Parse CSV data
      const lines = csvText.split('\n').filter(line => line.trim());
      const questions: Question[] = [];
      let introContent: Question | null = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Proper CSV parsing to handle quoted fields with commas
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          
          if (char === '"') {
            if (inQuotes && line[j + 1] === '"') {
              // Escaped quote
              current += '"';
              j++; // Skip next quote
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator outside quotes
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        
        // Add the last field
        values.push(current.trim());
        
        // Skip header row
        if (i === 0 && (values[0]?.toLowerCase().includes('categor') || values[1]?.toLowerCase().includes('question'))) {
          continue;
        }
        
        if (values.length >= 3 && values[0] && values[1] && values[2]) {
          const question: Question = {
            category: values[0],
            question: values[1],
            depth: values[2].toLowerCase().includes('light') ? 'light' : 'deep'
          };
          
          // First row (after header) becomes intro slide content
          if (i === 1) {
            introContent = question;
          } else {
            questions.push(question);
          }
        }
      }
      
      if (questions.length > 0) {
        // Better shuffling algorithm to distribute categories evenly
        const shuffledQuestions = smartShuffle(questions);
        
        setAllQuestions(shuffledQuestions);
        setIntroSlide(introContent);
        
        // Extract unique categories and assign colors
        const categories = Array.from(new Set(questions.map(q => q.category)));
        const colorMap: { [category: string]: number } = {};
        categories.forEach((category, index) => {
          colorMap[category] = index;
        });
        setCategoryColorMap(colorMap);
        setAvailableCategories(categories);
        setSelectedCategories(categories); // Start with all categories selected
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < slides.length - 1) {
      setAnimationClass('animate-slide-out-left');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setAnimationClass('animate-slide-in-right');
        setTimeout(() => setAnimationClass(''), 500);
      }, 300);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setAnimationClass('animate-slide-out-right');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setAnimationClass('animate-slide-in-left');
        setTimeout(() => setAnimationClass(''), 500);
      }, 300);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevQuestion();
    } else if (e.key === 'ArrowRight') {
      nextQuestion();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  // Filter and order slides based on categories and mode
  useEffect(() => {
    const isFiltered = selectedCategories.length < availableCategories.length;
    const isLightMode = !isMixedMode;
    
    // Filter by categories
    let filteredQuestions = allQuestions.filter(q => 
      selectedCategories.includes(q.category)
    );
    
    // Filter by depth if in light mode
    if (isLightMode) {
      filteredQuestions = filteredQuestions.filter(q => q.depth === 'light');
    }
    
    setQuestions(filteredQuestions);
    
    const slides: SlideItem[] = [];
    
    // Add intro slide if not filtered and not in light mode and intro content exists
    if (!isFiltered && !isLightMode && introSlide) {
      slides.push({ type: 'intro', question: introSlide });
    }
    
    // Add question slides
    filteredQuestions.forEach(q => {
      slides.push({ type: 'question', question: q });
    });
    
    setSlides(slides);
    setCurrentIndex(0); // Reset to first slide when filtering/mode changes
  }, [selectedCategories, allQuestions, availableCategories.length, isMixedMode, introSlide]);

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  return (
    <div className="min-h-[100svh] h-[100svh] bg-background overflow-hidden flex flex-col" style={{ height: '100svh' }}>
      {/* App Header */}
      <div className="bg-black mt-4 flex items-center" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="flex justify-between items-baseline px-6 w-full">
          <h1 className="text-white font-kokoro text-2xl" style={{ fontFamily: 'Kokoro, serif', fontWeight: 'bold', fontStyle: 'italic' }}>Checkin Roulette</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span 
                className="text-white font-normal text-xs cursor-pointer hover:opacity-70 transition-opacity px-1 py-1"
                onClick={() => setIsMixedMode(false)}
              >
                light
              </span>
              <div className="relative">
                <Switch 
                  checked={isMixedMode}
                  onCheckedChange={setIsMixedMode}
                  className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white"
                />
                <div 
                  className={`absolute top-1/2 w-5 h-5 flex items-center justify-center pointer-events-none transition-transform duration-200 ${isMixedMode ? 'translate-x-5' : 'translate-x-0'}`}
                  style={{
                    transform: `translate(${isMixedMode ? '20px' : '0px'}, calc(-50% - 1px))`,
                    left: '2px'
                  }}
                >
                  <span className="text-xs" style={{ fontSize: '0.64rem' }}>👀</span>
                </div>
              </div>
              <span 
                className="text-white font-normal text-xs cursor-pointer hover:opacity-70 transition-opacity px-1 py-1"
                onClick={() => setIsMixedMode(true)}
              >
                deep
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Quiz Container */}
      <div className="flex-1 flex flex-col px-4 overflow-hidden mt-4 gap-4" style={{ minHeight: 0 }}>
        <div className="flex-1 flex items-stretch justify-center min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white text-xl">Lade Fragen...</div>
          ) : slides.length > 0 ? (
            slides[currentIndex].type === 'intro' ? (
              <div className="flex items-center justify-center h-full">
                <QuizCard
                  question={slides[currentIndex].question!}
                  onSwipeLeft={nextQuestion}
                  onSwipeRight={prevQuestion}
                  animationClass={animationClass}
                  categoryIndex={categoryColorMap[slides[currentIndex].question!.category] || 0}
                />
              </div>
            ) : (
              <QuizCard
                question={slides[currentIndex].question!}
                onSwipeLeft={nextQuestion}
                onSwipeRight={prevQuestion}
                animationClass={animationClass}
                categoryIndex={categoryColorMap[slides[currentIndex].question!.category] || 0}
              />
            )
          ) : (
            <div className="text-white text-xl">Keine Fragen verfügbar</div>
          )}
        </div>
        
        {/* Bottom Links */}
        <div className="flex justify-between items-center w-full px-2 flex-shrink-0 mb-4" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}>
          <a 
            href="https://relationshipbydesign.de/" 
            className="text-white font-normal text-xs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Relationship by design
          </a>
          <button 
            onClick={() => setCategorySelectorOpen(true)}
            className="text-white font-normal text-xs flex items-center"
          >
            Kategorien wählen
          </button>
        </div>
      </div>
      
      <CategorySelector
        open={categorySelectorOpen}
        onOpenChange={setCategorySelectorOpen}
        categories={availableCategories}
        selectedCategories={selectedCategories}
        onCategoriesChange={handleCategoriesChange}
      />
    </div>
  );
}