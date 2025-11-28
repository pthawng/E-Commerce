import React from 'react';

// Định nghĩa kiểu dữ liệu props để component tái sử dụng được (Clean Code)
interface HeroProps {
  type?: 'local' | 'youtube';
  src: string; // Đường dẫn file hoặc ID Youtube
  poster?: string;
}

export default function HeroSection({ 
  type = 'local', 
  src = '/videos/hero-bg.mp4', 
  poster = '/images/hero-poster.jpg' 
}: HeroProps) {

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* LAYER 0: Poster Image (Fallback)
        Luôn hiện ảnh này trước để user không thấy màn hình đen/trắng khi video đang load
      */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${poster})` }}
      />

      {/* LAYER 1: Video Background Logic */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden">
        {type === 'local' ? (
          // === LOCAL VIDEO ===
          <video
            autoPlay loop muted playsInline
            className="h-full w-full object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : (
          // === YOUTUBE VIDEO ===
          // Kỹ thuật: Phóng to (scale-150) để ẩn các UI controls và logo Youtube
          // Aspect-video giúp giữ tỉ lệ chuẩn
          <div className="absolute top-1/2 left-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 lg:h-[150%] lg:w-[150%]">
             <iframe
              className="h-full w-full object-cover"
              src={`https://www.youtube.com/embed/${src}?autoplay=1&mute=1&controls=0&loop=1&playlist=${src}&start=0&end=50&playsinline=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1`}
              title="Hero Background"
              allow="autoplay; encrypted-media"
              // Quan trọng: pointer-events-none ở cha đã chặn click, nhưng ta thêm -1 cho chắc chắn
              tabIndex={-1} 
            />
          </div>
        )}
      </div>

      {/* LAYER 2: Overlay (Gradient luxury) */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

      {/* LAYER 3: Content với Animation Stagger */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center text-white">
        
        {/* Title: Xuất hiện đầu tiên */}
        <h1 className="animate-fade-up opacity-0 font-serif text-5xl font-medium tracking-wide drop-shadow-lg md:text-7xl lg:text-8xl">
          An Enchanted Season
        </h1>
        
        {/* Description: Xuất hiện chậm hơn 1000ms */}
        <p className="animate-fade-up delay-1000 opacity-0 mt-6 max-w-2xl text-lg font-light text-white/90 md:text-xl">
          The Maison’s icon of luck is poetically unveiled amidst the forest
        </p>

        {/* Button: Xuất hiện chậm hơn 300ms */}
        <div className="animate-fade-up delay-300 opacity-0 mt-10">
          <button className="group relative border border-white px-8 py-3 text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:bg-white hover:text-black">
            Explore This Snowy Universe
            {/* Hiệu ứng line chạy dưới chân (đã tối ưu) */}
            <span className="absolute bottom-0 left-0 h-[1px] w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
          </button>
        </div>

      </div>
    </section>
  );
}