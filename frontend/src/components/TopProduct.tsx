import { useEffect, useRef } from 'react';
import { CloudArrowUpIcon, LockClosedIcon, ServerIcon } from '@heroicons/react/20/solid';

const features = [
    {
        name: 'Natural Yellow Diamonds.',
        description:
            'Our yellow diamonds are 100% natural, offering vibrant color and brilliance for the ultimate luxury.',
        icon: CloudArrowUpIcon,
    },
    {
        name: 'Certified Quality.',
        description: 'Certified by the most trusted gemological labs like GIA, ensuring authenticity and value.',
        icon: LockClosedIcon,
    },
    {
        name: 'Exclusive Designs.',
        description: 'Available in custom designs, from engagement rings to bespoke jewelry pieces.',
        icon: ServerIcon,
    },
];

export default function TopProduct() {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.6; // Slow down the video to 50% of the normal speed
        }
    }, []);

    return (
        <div className="overflow-hidden py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                    <div className="lg:pt-4 lg:pr-8">
                        <div className="lg:max-w-lg">
                            <h2 className="text-base font-semibold text-yellow-600">Yellow Diamonds</h2>
                            <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                                Luxury and Brilliance, Redefined
                            </p>
                            <p className="mt-6 text-lg text-gray-600">
                                Discover the elegance of our 100% natural yellow diamonds, certified for quality and available in exclusive designs.
                            </p>
                            <p className="mt-6 text-lg text-gray-600">
                                **Price**: Starting at **$10,000 USD** for a 1-carat diamond.
                            </p>
                            <dl className="mt-10 max-w-xl space-y-8 text-base text-gray-600 lg:max-w-none">
                                {features.map((feature) => (
                                    <div key={feature.name} className="relative pl-9">
                                        <dt className="inline font-semibold text-gray-900">
                                            <feature.icon aria-hidden="true" className="absolute top-1 left-1 size-5 text-yellow-600" />
                                            {feature.name}
                                        </dt>{' '}
                                        <dd className="inline">{feature.description}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <a href="#order" className="rounded-md bg-yellow-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500">
                                    Order Now
                                </a>
                                <a href="#details" className="text-sm font-semibold text-yellow-600 leading-6">
                                    See More Details <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="relative w-[48rem] max-w-none rounded-xl ring-1 shadow-xl ring-gray-400/10 sm:w-[57rem] md:-ml-4 lg:-ml-0">
                        <video
                            ref={videoRef}
                            autoPlay
                            loop
                            muted
                            className="absolute inset-0 h-full w-full object-cover rounded-xl"
                        >
                            <source src="/top_diamond_sale.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </div>
        </div>
    );
}