import { useState, useEffect } from 'react';
import { QuizCard } from './QuizCard';
import { CategorySelector } from './CategorySelector';
import { IntroSlide } from './IntroSlide';

interface Question {
  question: string;
  category: string;
}

interface SlideItem {
  type: 'intro' | 'question';
  introType?: 'welcome' | 'description';
  question?: Question;
}

export function QuizApp() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorySelectorOpen, setCategorySelectorOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      let csvText = '';
      
      try {
        // Try Google Sheets first
        const spreadsheetId = '1ocX6XRk_Y_HcUCg7hcjb1nHuoKqyBUc2KmWX9JNTXrU';
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=0`;
        
        const response = await fetch(csvUrl);
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
      
      // Parse CSV data (skip header row if exists)
      const lines = csvText.split('\n').filter(line => line.trim());
      const questions: Question[] = [];
      
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
        
        if (values.length >= 2 && values[0] && values[1]) {
          // Check if first row is header
          if (i === 0 && values[0].toLowerCase() === 'question') {
            // Skip header row with structure: question,category
            continue;
          } else if (i === 0 && values[0].toLowerCase() === 'category') {
            // Skip header row with structure: category,question
            continue;
          }
          
          // Determine structure based on first non-header row
          if (values[0].toLowerCase() === 'question' || values[0].toLowerCase() === 'category') {
            continue; // Skip if it's still a header
          }
          
          // Check if this looks like a question (longer text) vs category (shorter text)
          const isFirstFieldQuestion = values[0].length > values[1].length || values[0].includes('?');
          
          if (isFirstFieldQuestion) {
            // Structure: question,category
            questions.push({
              question: values[0],
              category: values[1]
            });
          } else {
            // Structure: category,question
            questions.push({
              category: values[0],
              question: values[1]
            });
          }
        }
      }
      
      if (questions.length > 0) {
        // Separate different categories
        const reflexionQuestions = questions.filter(q => q.category === 'Reflexion');
        const bindungQuestions = questions.filter(q => q.category === 'Bindung');
        const otherQuestions = questions.filter(q => q.category !== 'Reflexion' && q.category !== 'Bindung');
        
        // Shuffle all groups
        const shuffledOthers = [...otherQuestions].sort(() => Math.random() - 0.5);
        const shuffledReflexion = [...reflexionQuestions].sort(() => Math.random() - 0.5);
        const shuffledBindung = [...bindungQuestions].sort(() => Math.random() - 0.5);
        
        // Calculate positions for distribution
        const totalQuestions = questions.length;
        const lastThirdStart = Math.floor(totalQuestions * 2 / 3);
        
        // Create base array with others
        const baseQuestions = [...shuffledOthers];
        
        // Distribute Bindung questions evenly
        const distributedQuestions = [...baseQuestions];
        const bindungInterval = Math.max(1, Math.floor(distributedQuestions.length / (shuffledBindung.length + 1)));
        
        shuffledBindung.forEach((bindungQ, index) => {
          const insertPosition = Math.min(
            distributedQuestions.length,
            (index + 1) * bindungInterval + index
          );
          distributedQuestions.splice(insertPosition, 0, bindungQ);
        });
        
        // Add reflexion questions in the last third
        const finalQuestions = [
          ...distributedQuestions.slice(0, lastThirdStart),
          ...shuffledReflexion,
          ...distributedQuestions.slice(lastThirdStart)
        ];
        
        setAllQuestions(finalQuestions);
        setQuestions(finalQuestions);
        
        // Create slides with intro slides at the beginning
        const introSlides: SlideItem[] = [
          { type: 'intro', introType: 'welcome' },
          { type: 'intro', introType: 'description' }
        ];
        
        // Find and move the specific question to 3rd position
        const targetQuestion = "Was wünschst du dir von unserem heutigen Gespräch?";
        const targetQuestionIndex = finalQuestions.findIndex(q => 
          q.question.includes("Was wünschst du dir von unserem heutigen Gespräch")
        );
        
        let reorderedQuestions = [...finalQuestions];
        if (targetQuestionIndex !== -1) {
          const [targetQ] = reorderedQuestions.splice(targetQuestionIndex, 1);
          reorderedQuestions.unshift(targetQ); // Put it first in questions (3rd overall)
        }
        
        const questionSlides: SlideItem[] = reorderedQuestions.map(q => ({
          type: 'question',
          question: q
        }));
        
        setSlides([...introSlides, ...questionSlides]);
        
        // Extract unique categories
        const categories = Array.from(new Set(questions.map(q => q.category)));
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

  // Filter questions based on selected categories
  useEffect(() => {
    if (selectedCategories.length === 0) {
      setQuestions([]);
      setSlides([
        { type: 'intro', introType: 'welcome' },
        { type: 'intro', introType: 'description' }
      ]);
    } else {
      const filteredQuestions = allQuestions.filter(q => 
        selectedCategories.includes(q.category)
      );
      setQuestions(filteredQuestions);
      
      // Check if we're filtering (not showing all categories)
      const isFiltered = selectedCategories.length < availableCategories.length;
      
      if (isFiltered) {
        // Skip intro slides when filtering
        // Find and move the specific question to first position
        const targetQuestionIndex = filteredQuestions.findIndex(q => 
          q.question.includes("Was wünschst du dir von unserem heutigen Gespräch")
        );
        
        let reorderedQuestions = [...filteredQuestions];
        if (targetQuestionIndex !== -1) {
          const [targetQ] = reorderedQuestions.splice(targetQuestionIndex, 1);
          reorderedQuestions.unshift(targetQ); // Put it first
        }
        
        const questionSlides: SlideItem[] = reorderedQuestions.map(q => ({
          type: 'question',
          question: q
        }));
        
        setSlides(questionSlides);
      } else {
        // Show intro slides when all categories are selected
        const introSlides: SlideItem[] = [
          { type: 'intro', introType: 'welcome' },
          { type: 'intro', introType: 'description' }
        ];
        
        // Find and move the specific question to 3rd position for all questions
        const targetQuestionIndex = filteredQuestions.findIndex(q => 
          q.question.includes("Was wünschst du dir von unserem heutigen Gespräch")
        );
        
        let reorderedQuestions = [...filteredQuestions];
        if (targetQuestionIndex !== -1) {
          const [targetQ] = reorderedQuestions.splice(targetQuestionIndex, 1);
          reorderedQuestions.unshift(targetQ); // Put it first in questions (3rd overall)
        }
        
        const questionSlides: SlideItem[] = reorderedQuestions.map(q => ({
          type: 'question',
          question: q
        }));
        
        setSlides([...introSlides, ...questionSlides]);
      }
      
      setCurrentIndex(0); // Reset to first slide when filtering
    }
  }, [selectedCategories, allQuestions, availableCategories.length]);

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  return (
    <div className="min-h-[100svh] h-[100svh] bg-background overflow-hidden flex flex-col" style={{ height: '100svh' }}>
      {/* App Header */}
      <div className="bg-black mt-4 flex items-center" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="flex justify-between items-baseline px-6 w-full">
          <h1 className="text-white font-kokoro text-2xl" style={{ fontFamily: 'Kokoro, serif', fontWeight: 'bold', fontStyle: 'italic' }}>non mono</h1>
          <button 
            onClick={() => setCategorySelectorOpen(true)}
            className="text-white font-normal text-xs flex items-center"
          >
            Kategorien wählen
          </button>
        </div>
      </div>

      {/* Main Quiz Container */}
      <div className="flex-1 flex flex-col px-4 overflow-hidden mt-4 gap-4" style={{ minHeight: 0 }}>
        <div className="flex-1 flex items-stretch justify-center min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full text-white text-xl">Lade Fragen...</div>
          ) : slides.length > 0 ? (
            slides[currentIndex].type === 'intro' ? (
              <IntroSlide
                type={slides[currentIndex].introType!}
                onSwipeLeft={nextQuestion}
                onSwipeRight={prevQuestion}
                animationClass={animationClass}
              />
            ) : (
              <QuizCard
                question={slides[currentIndex].question!}
                onSwipeLeft={nextQuestion}
                onSwipeRight={prevQuestion}
                animationClass={animationClass}
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
          <a 
            href="mailto:hello@relationshipbydesign.de?subject=Feedback%20Open%20Relationship%20Workshop" 
            className="text-white font-normal text-xs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Feedback geben
          </a>
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