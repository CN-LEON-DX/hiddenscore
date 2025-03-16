import videoSource from "../assets/diamon.mp4";
import { Helmet } from 'react-helmet';
import ListProduct from "../components/ListProduct";

const Home = () => {
    return (
        <>
            <Helmet>
                <title>Home - V Diamond</title>
            </Helmet>
            <div>

            </div>
                <div className="relative h-screen w-full overflow-hidden">
                    {/* Video Background */}
                    <video
                        className="absolute top-0 left-0 min-h-full min-w-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                    >
                        <source src={videoSource} type="video/mp4" />
                    </video>

                    {/* Dark overlay to make text more readable */}
                    <div className="absolute top-0 left-0 h-full w-full bg-black/50"></div>

                    {/* Content overlay */}
                    <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
                        <div className="text-center px-4">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
                                Your Diamond Your Perfect
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-white">
                                Our diamonds are certified and affordably priced. Let us bring you the finest gems
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <a href="/products" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                                    View Products
                                </a>
                                <a href="#" className="text-sm font-semibold text-white leading-6">
                                    Learn more <span aria-hidden="true">→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Featured Products Section */}
                <div className="mt-8">
                    <ListProduct />
                </div>
        </>
    );
}

export default Home;