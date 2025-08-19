import { useState, useRef } from 'react';

interface IntroSlideProps {
  type: 'welcome' | 'description';
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  animationClass?: string;
}

export function IntroSlide({ type, onSwipeLeft, onSwipeRight, animationClass = '' }: IntroSlideProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minSwipeDistance = 50;

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

      {/* Main Content */}
      <div className="h-full flex flex-col justify-center px-8 relative">
        {type === 'welcome' ? (
          <>
            {/* Main title - vertically and horizontally centered */}
            <div className="flex-1 flex items-center justify-center">
              <h1 
                className="text-3xl md:text-4xl lg:text-4xl font-bold text-foreground text-center leading-tight"
                style={{ fontFamily: 'Kokoro, serif', fontWeight: 'bold', fontStyle: 'italic' }}
              >
                Offene Beziehung: Wie gehen wir das richtig an?
              </h1>
            </div>
            
            {/* Bottom text */}
            <div className="pb-8">
              <p 
                className="text-xs text-foreground text-center"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
              >
                Swipe um weiter zu navigieren
              </p>
            </div>
          </>
        ) : (
          /* Description slide */
          <div className="flex-1 flex items-center justify-start">
            <p 
              className="text-foreground text-left leading-relaxed"
              style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
            >
              In einer monogamen Beziehung herrschen allgemein bekannte universelle Regeln. Wohingegen es für offenen Beziehungen keinen Standard gibt – ihr gestaltet eure Regeln selbst, so wie es zu euch passt. Dieses Kartenspiel unterstützt euch dabei, ins Gespräch zu kommen: über eure Wünsche, Motivation, Ängste, Bedürfnisse und Grenzen. Zwischendurch erhaltet ihr Impulse, die Nähe schaffen und eure Verbindung stärken. So entdeckt ihr Schritt für Schritt, ob sich eine offene Beziehung für euch richtig anfühlt und wie ihr sie gestalten wollt. Die Fragen sind zufällig angeordnet, wenn ihr Thema für Thema vorgehen möchtet könnt ihr die Filterfunktion nutzen. Seid ehrlich zu euch selbst, bleibt euch treu, hört eurem Partner zu und respektiert dessen Meinung, auch wenn sie gegensätzlich ist. Ihr solltet gemeinsam agieren und das tun, was für euch als Team am besten ist.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}