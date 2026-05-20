"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import AnimatedSection from '@/components/AnimatedSection';
import NewsArticleModal from '@/components/NewsArticleModal';
import { newsService, type NewsArticle as FSNews } from '@/lib/newsService';

type DisplayArticle = {
  id?: string;
  title: string;
  date: string; // YYYY-MM-DD
  image: string;
  description: string;
  content?: string;
  category: string;
  isEvent?: boolean;
  eventDate?: string; // YYYY-MM-DD
};

export default function NewsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [articles, setArticles] = useState<DisplayArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<DisplayArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await newsService.getAll();
        if (!mounted) return;
        if (items && items.length > 0) {
          const mapped: DisplayArticle[] = items.map((a: FSNews) => {
            // Validate and sanitize image URL
            let imageUrl = a.image || '';
            if (imageUrl && !imageUrl.startsWith('/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
              imageUrl = ''; // Set to empty if invalid
            }
            
            return {
              id: a.id,
              title: a.title,
              date: (a.date as any)?.toDate ? (a.date as any).toDate().toISOString().slice(0,10) : '',
              image: imageUrl,
              description: a.description,
              content: a.content,
              category: a.category,
              isEvent: a.isEvent ?? false,
              eventDate: a.eventDate && (a.eventDate as any)?.toDate ? (a.eventDate as any).toDate().toISOString().slice(0,10) : undefined,
            };
          });
          // Sort: upcoming events first, then by date
          const sorted = mapped.sort((a, b) => {
            const now = new Date();
            const aEventDate = a.isEvent && a.eventDate ? new Date(a.eventDate) : null;
            const bEventDate = b.isEvent && b.eventDate ? new Date(b.eventDate) : null;
            
            // Upcoming events first
            if (aEventDate && aEventDate > now && (!bEventDate || bEventDate <= now)) return -1;
            if (bEventDate && bEventDate > now && (!aEventDate || aEventDate <= now)) return 1;
            
            // Then sort by event date or regular date
            const aSortDate = aEventDate || new Date(a.date);
            const bSortDate = bEventDate || new Date(b.date);
            return bSortDate.getTime() - aSortDate.getTime();
          });
          setArticles(sorted);
        }
      } catch {
        setArticles([
          {
            title: 'Void Announces 1v1 Map Challenge Giveaway',
            date: '2025-08-18',
            image: '/news/wavedashh.png',
            description: 'Along with our new map we are doing another giveaway! Spend at least 30 minutes in our 1v1 map, then post on twitter with proof of you doing so! Then use #void1v1challenge and tag us! For every 30 minutes you get another entry into the giveaway! You can get unlimited entries so get to playing today! Giveaway ends on Saturday, August 23rd.',
            category: 'Fortnite',
          },
          {
            title: 'Void Announces Fortnite Battle Pass Giveaway',
            date: '2025-08-5',
            image: '/news/wavedashh.png',
            description: 'We are thrilled to announce our Fortnite Battle Pass giveaway. For more information scroll down to the bottom of this page and join our discord.',
            category: 'Fortnite',
          },
          {
            title: 'Void Earns in FNCS Grand Finals',
            date: '2025-08-3',
            image: '/news/FNCS.png',
            description: 'We are proud to say that Void Blu went crazy in FNCS Grands and earned over 2500 dollars split across his trio. We want to wish Blu good luck in the next FNCS and we are very proud of him.',
            category: 'Fortnite',
          },
          {
            title: 'Void Blu, Void Drvzy, and Void Fx1ine Qualify to FNCS Grand Finals',
            date: '2025-07-20',
            image: '/news/FNCS.png',
            description: 'We are excited to announce that three of our signings, Blue, Drvzy, and Fx1ine, qualified to FNCS Major 3 Grand Finals! We really wish them the best of luck in winning and qualifying to the FNCS Global Championships in France!',
            category: 'Fortnite',
          },
          {
            title: 'Void Announces Two New Signing',
            date: '2025-07-19',
            image: '/news/wavedashh.png',
            description: 'We are thrilled to announce our new signings for our Fortnite team, Blu and Drvzy!',
            category: 'Fortnite',
          },
          {
            title: 'Community Update: Summer Events',
            date: '2025-06-01',
            image: '/news/wavedashh.png',
            description: 'We hosted several community scrims and giveaways this summer. Thanks to everyone who participated—more events coming soon!',
            category: 'Community',
          },
          {
            title: 'Void Updates Assets',
            date: '2025-06-01',
            image: '/logo.png',
            description: 'Void Esports has updated its branding assets, including a new logo and team colors. Check out our updated look!',
            category: 'Organization',
          },
          {
            title: 'Void Website Released',
            date: '2025-06-01',
            image: '/logo.png',
            description: 'We are excited to announce the launch of our new website, designed to provide a better experience for our fans and community.',
            category: 'Organization',
          },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Handle query parameter to open specific article
  useEffect(() => {
    const articleId = searchParams?.get('id');
    if (articleId && articles.length > 0) {
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setSelectedArticle(article);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, articles]);

  const upcomingEvents = articles.filter(a => a.isEvent && a.eventDate && new Date(a.eventDate) > new Date());
  const regularArticles = articles.filter(a => !a.isEvent || !a.eventDate || new Date(a.eventDate) <= new Date());

  const handleArticleClick = (article: DisplayArticle) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
    // Clear the query parameter when closing modal
    if (searchParams?.get('id')) {
      router.push('/news', { scroll: false });
    }
  };

  return (
    <div className="pt-20 min-h-screen bg-[#1a0a2e]">
      <div className="void-container py-8 sm:py-12">
        <AnimatedSection animationType="fadeIn" delay={100}>
          <h1 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 gradient-text text-center">
            Latest News
          </h1>
        </AnimatedSection>

        {/* Ad Spot - Banner at top of news page */}
        <div className="mb-8">
        </div>
        
        {/* Upcoming Events Section */}
        {upcomingEvents.length > 0 && (
          <AnimatedSection animationType="fadeIn" delay={150}>
            <div className="mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">Upcoming Events</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {upcomingEvents.map((article, index) => (
                  <AnimatedSection key={article.id || article.title} animationType="slideUp" delay={index * 100}>
                    <div 
                      className="void-card group cursor-pointer transition-transform duration-300 hover:-translate-y-1 border-2 border-purple-500/30 relative"
                      onClick={() => handleArticleClick(article)}
                    >
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">
                          Upcoming Event
                        </span>
                      </div>
                      <div className="relative h-64 sm:h-80 mb-4 overflow-hidden rounded-lg">
                        {article.image && (article.image.startsWith('/') || article.image.startsWith('http://') || article.image.startsWith('https://')) ? (
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover transform group-hover:scale-110 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-black flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs sm:text-sm text-gray-400">
                          <span>{article.eventDate || article.date}</span>
                          <span className="px-2 py-1 bg-[#FFFFFF]/20 rounded-full text-[#FFFFFF] text-xs">
                            {article.category}
                          </span>
                        </div>
                        
                        <h2 className="text-xl sm:text-2xl font-bold group-hover:text-[#a2a2a2] transition-colors">
                          {article.title}
                        </h2>
                        
                        <p className="text-sm sm:text-base text-gray-300 line-clamp-3">
                          {article.description}
                        </p>
                        
                        <p className="text-sm sm:text-base text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
                          Click to read more →
                        </p>
                      </div>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </AnimatedSection>
        )}
        
        {/* Ad Spot - Banner between sections */}
        {upcomingEvents.length > 0 && (
          <div className="mb-8">
          </div>
        )}
        
        {/* Regular News Section */}
        <AnimatedSection animationType="fadeIn" delay={200}>
          {upcomingEvents.length > 0 && (
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 gradient-text">Latest News</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {regularArticles.flatMap((article, index) => {
              const items: React.ReactNode[] = [];
              
              // Add ad before article if needed (after every 4th article)
              if (index > 0 && index % 4 === 0) {
                items.push(
                  <div key={`ad-${index}`} className="sm:col-span-2 mb-4">
                  </div>
                );
              }
              
              // Add the article
              items.push(
                <AnimatedSection key={article.id || article.title} animationType="slideUp" delay={index * 100}>
                  <div 
                    className="void-card group cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                    onClick={() => handleArticleClick(article)}
                  >
                    <div className="relative h-64 sm:h-80 mb-4 overflow-hidden rounded-lg">
                      {article.image && (article.image.startsWith('/') || article.image.startsWith('http://') || article.image.startsWith('https://')) ? (
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover transform group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-black flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs sm:text-sm text-gray-400">
                        <span>{article.date}</span>
                        <span className="px-2 py-1 bg-[#FFFFFF]/20 rounded-full text-[#FFFFFF] text-xs">
                          {article.category}
                        </span>
                      </div>
                      
                      <h2 className="text-xl sm:text-2xl font-bold group-hover:text-[#a2a2a2] transition-colors">
                        {article.title}
                      </h2>
                      
                      <p className="text-sm sm:text-base text-gray-300 line-clamp-3">
                        {article.description}
                      </p>
                      
                      <p className="text-sm sm:text-base text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
                        Click to read more →
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              );
              
              return items;
            })}
          </div>
          
          {/* Ad Spot - Banner at bottom of news section */}
          <div className="mt-12">
          </div>
        </AnimatedSection>
      </div>

      {/* News Article Modal */}
      <NewsArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}