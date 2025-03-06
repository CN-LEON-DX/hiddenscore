const products = [
    {
        id: 1,
        name: '1 Carat Yellow Diamond Ring',
        href: '#',
        imageSrc: '/ls1.png', 
        imageAlt: "1 Carat Yellow Diamond Ring in white gold.",
        price: '$25,000',
        color: 'Yellow',
    },
    {
        id: 2,
        name: '2 Carat White Diamond Necklace',
        href: '#',
        imageSrc: '/ls2.png',
        imageAlt: "2 Carat White Diamond Necklace on a gold chain.",
        price: '$50,000',
        color: 'White',
    },
    {
        id: 3,
        name: 'Fancy Blue Diamond Earrings',
        href: '#',
        imageSrc: '/ls3.png',
        imageAlt: "Fancy Blue Diamond Earrings in platinum setting.",
        price: '$75,000',
        color: 'Blue',
    },
    {
        id: 4,
        name: '3 Carat Pink Diamond Ring',
        href: '#',
        imageSrc: '/ls4.png',
        imageAlt: "3 Carat Pink Diamond Ring in rose gold.",
        price: '$100,000',
        color: 'Pink',
    },
    {
        id: 5,
        name: 'Heart-Shaped Red Diamond Pendant',
        href: '#',
        imageSrc: '/ls5.png',
        imageAlt: "Heart-Shaped Red Diamond Pendant on a delicate chain.",
        price: '$200,000',
        color: 'Red',
    },
    {
        id: 6,
        name: '1.5 Carat Green Diamond Bracelet',
        href: '#',
        imageSrc: '/ls6.png',
        imageAlt: "1.5 Carat Green Diamond Bracelet in white gold.",
        price: '$150,000',
        color: 'Green',
    },
    {
        id: 7,
        name: '4 Carat Blue-Green Diamond Engagement Ring',
        href: '#',
        imageSrc: '/ls7.png',
        imageAlt: "4 Carat Blue-Green Diamond Engagement Ring with platinum band.",
        price: '$500,000',
        color: 'Blue-Green',
    },
    {
        id: 8,
        name: '5 Carat Pure White Diamond Tiara',
        href: '#',
        imageSrc: '/ls8.png',
        imageAlt: "5 Carat Pure White Diamond Tiara set in platinum.",
        price: '$1,000,000',
        color: 'White',
    },
]

export default function ListProduct() {
    return (
        <div>
            <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Exquisite Diamond Jewelry</h2>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                    {products.map((product) => (
                        <div key={product.id} className="group relative">
                            <img
                                alt={product.imageAlt}
                                src={product.imageSrc}
                                className="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                            />
                            <div className="mt-4 flex justify-between">
                                <div>
                                    <h3 className="text-sm text-gray-700">
                                        <a href="/products/detail">
                                            <span aria-hidden="true" className="absolute inset-0" />
                                            {product.name}
                                        </a>
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">{product.color}</p>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{product.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
