import { useEffect, useState } from "react";

const Carousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const images = [
        "/1.png", "/2.png", "/3.png", "/4.png", "/5.png", "/6.png"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.ceil(images.length / 3));
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div className="overflow-hidden relative w-full">
            <div
                className="flex transition-all duration-1000 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {Array.from({ length: Math.ceil(images.length / 3) }).map((_, rowIndex) => (
                    <div key={rowIndex} className="flex-shrink-0 w-full grid grid-cols-3 gap-4">
                        {images.slice(rowIndex * 3, rowIndex * 3 + 3).map((src, index) => (
                            <div key={index} className="w-full">
                                <img
                                    src={src}
                                    alt={`Product ${rowIndex * 3 + index + 1}`}
                                    className="w-full h-64 sm:h-80 md:h-96 lg:h-112 xl:h-128 object-cover"
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {/* Navigation arrows */}
            <button
                onClick={() =>
                    setCurrentIndex((prevIndex) => (prevIndex - 1 + Math.ceil(images.length / 3)) % Math.ceil(images.length / 3))
                }
                className="absolute rounded-full left-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                &lt;
            </button>
            <button
                onClick={() =>
                    setCurrentIndex((prevIndex) => (prevIndex + 1) % Math.ceil(images.length / 3))
                }
                className="absolute rounded-full right-0 top-1/2 transform -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
                &gt;
            </button>
        </div>
    );
};

export default Carousel;