import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogPanel,
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Popover,
    PopoverButton,
    PopoverGroup,
    PopoverPanel,
} from '@headlessui/react'
import {
    Bars3Icon,
    XMarkIcon,
    SparklesIcon, HeartIcon, CubeIcon, SquaresPlusIcon, PencilIcon,
    UserIcon,
    Cog6ToothIcon,
    KeyIcon,
    ClockIcon,
    ShoppingCartIcon
} from '@heroicons/react/24/outline'

import { ChevronDownIcon, PhoneIcon, PlayCircleIcon } from '@heroicons/react/20/solid'
import useAuth from '../hooks/useAuth';

const products = [
    { name: 'Engagement Rings', description: 'Stunning diamond rings for your special moment', href: '/engagement-rings', icon: HeartIcon },
    { name: 'Wedding Bands', description: 'Beautiful bands to symbolize your eternal bond', href: '/wedding-bands', icon: SparklesIcon },
    { name: 'Loose Diamonds', description: 'Handpicked certified diamonds in various cuts and carats', href: '/loose-diamonds', icon: CubeIcon },
    { name: 'Collections', description: 'Explore our exclusive diamond jewelry collections', href: '/collections', icon: SquaresPlusIcon },
    { name: 'Custom Designs', description: 'Create your own unique diamond masterpiece', href: '/custom-designs', icon: PencilIcon },
];
const callsToAction = [
    { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
    { name: 'Contact sales', href: '#', icon: PhoneIcon },
]

const Header = () => {
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [cartItemCount, setCartItemCount] = useState(0);
    const defaultImage = '/user.png';

    const profileMenuItems = [
        { name: 'Profile', href: '/profile', icon: UserIcon },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
        { name: 'Change Password', href: '/change-password', icon: KeyIcon },
        { name: 'Order History', href: '/order-history', icon: ClockIcon },
    ];

    useEffect(() => {
        fetch('/api/cart')
            .then(response => response.json())
            .then(data => setCartItemCount(data.cartItems.length))
            .catch(error => console.error('Error fetching cart items:', error));
    }, []);

    return (
        <header className="bg-white">
            <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <a href="/" className="-m-1.5 p-1.5">
                        <span className="sr-only">hiddenscore</span>
                        <img
                            alt=""
                            src="/logo.svg"
                            className="h-8 w-auto"
                        />
                    </a>
                </div>
                <div className="flex items-center gap-4 mx-4">
                    <a href="/cart" className="relative">
                        <ShoppingCartIcon className="h-6 w-6 text-gray-700" />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                {cartItemCount}
                            </span>
                        )}
                    </a>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                    >
                        <span className="sr-only">Open main menu</span>
                        <Bars3Icon aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <PopoverGroup className="hidden lg:flex lg:gap-x-12">
                    <Popover className="relative">
                        <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900">
                            Product
                            <ChevronDownIcon aria-hidden="true" className="size-5 flex-none text-gray-400" />
                        </PopoverButton>

                        <PopoverPanel
                            transition
                            className="absolute top-full -left-8 z-10 mt-3 w-screen max-w-md overflow-hidden rounded-3xl bg-white ring-1 shadow-lg ring-gray-900/5 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                        >
                            <div className="p-4">
                                {products.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-gray-50"
                                    >
                                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                                            <item.icon aria-hidden="true" className="size-6 text-gray-600 group-hover:text-indigo-600" />
                                        </div>
                                        <div className="flex-auto">
                                            <a href={item.href} className="block font-semibold text-gray-900">
                                                {item.name}
                                                <span className="absolute inset-0" />
                                            </a>
                                            <p className="mt-1 text-gray-600">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-gray-900/5 bg-gray-50">
                                {callsToAction.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center justify-center gap-x-2.5 p-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-100"
                                    >
                                        <item.icon aria-hidden="true" className="size-5 flex-none text-gray-400" />
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>

                    <a href="#" className="text-sm/6 font-semibold text-gray-900">
                        Features
                    </a>
                    <a href="#" className="text-sm/6 font-semibold text-gray-900">
                        Marketplace
                    </a>
                    <a href="#" className="text-sm/6 font-semibold text-gray-900">
                        Company
                    </a>
                </PopoverGroup>
                <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    
                    {user ? (
                        <div className="flex items-center gap-2 relative">
                            <Popover className="relative">
                                <PopoverButton className="flex items-center gap-x-1">
                                    <img 
                                        src={user?.picture || defaultImage} 
                                        alt="Profile" 
                                        className="w-8 h-8 rounded-full object-cover border-gray-200 cursor-pointer"
                                    />
                                </PopoverButton>
                                <PopoverPanel
                                    transition
                                    className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                    <div className="p-2">
                                        <div className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                                            <div className="font-medium">{user?.name || 'User'}</div>
                                            <div className="truncate">{user?.email || 'user@example.com'}</div>
                                        </div>
                                        <div className="py-1">
                                            {profileMenuItems.map((item) => (
                                                <a
                                                    key={item.name}
                                                    href={item.href}
                                                    className="flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                                >
                                                    <item.icon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                                    {item.name}
                                                </a>
                                            ))}
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={logout}
                                                className="flex w-full items-center gap-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                            >
                                                <XMarkIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </PopoverPanel>
                            </Popover>
                        </div>
                    ) : (
                        <a href="/login" className="text-sm/6 font-semibold text-gray-900">
                        Log in <span aria-hidden="true">&rarr;</span>
                    </a>
                    )}

                    
                </div>
            </nav>
            <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                <div className="fixed inset-0 z-10" />
                <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">hiddenscore</span>
                            <img
                                alt=""
                                src="/logo.svg"
                                className="h-8 w-auto"
                            />
                        </a>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        >
                            <span className="sr-only">Close menu</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-gray-500/10">
                            <div className="space-y-2 py-6">
                                <Disclosure as="div" className="-mx-3">
                                    <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">
                                        Product
                                        <ChevronDownIcon aria-hidden="true" className="size-5 flex-none group-data-open:rotate-180" />
                                    </DisclosureButton>
                                    <DisclosurePanel className="mt-2 space-y-2">
                                        {[...products, ...callsToAction].map((item) => (
                                            <DisclosureButton
                                                key={item.name}
                                                as="a"
                                                href={item.href}
                                                className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold text-gray-900 hover:bg-gray-50"
                                            >
                                                {item.name}
                                            </DisclosureButton>
                                        ))}
                                    </DisclosurePanel>
                                </Disclosure>
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                >
                                    Features
                                </a>
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                >
                                    Marketplace
                                </a>
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                >
                                    Company
                                </a>
                            </div>
                            <div className="py-6">
                                {user ? (
                                    <div>
                                        <Disclosure>
                                            {({ open }) => (
                                                <>
                                                    <DisclosureButton className="flex w-full items-center gap-2 -mx-3 rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50">
                                                        <img 
                                                            src={user.picture || defaultImage} 
                                                            alt="Profile" 
                                                            className="w-8 h-8 rounded-full object-cover"
                                                        />
                                                        {user?.name || 'User'}
                                                        <ChevronDownIcon
                                                            className={`${
                                                                open ? 'rotate-180 transform' : ''
                                                            } h-5 w-5 text-gray-500 ml-auto`}
                                                        />
                                                    </DisclosureButton>
                                                    <DisclosurePanel className="px-4 py-2 text-sm text-gray-500 space-y-2">
                                                        {profileMenuItems.map((item) => (
                                                            <a
                                                                key={item.name}
                                                                href={item.href}
                                                                className="flex items-center gap-x-2 py-2 text-base/7 text-gray-700 hover:text-gray-900"
                                                            >
                                                                <item.icon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                                                {item.name}
                                                            </a>
                                                        ))}
                                                        <button 
                                                            onClick={logout}
                                                            className="flex items-center gap-x-2 py-2 w-full text-base/7 text-gray-700 hover:text-gray-900"
                                                        >
                                                            <XMarkIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                                                            Logout
                                                        </button>
                                                    </DisclosurePanel>
                                                </>
                                            )}
                                        </Disclosure>
                                    </div>
                                ) : (
                                    <a
                                        href="/login"
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                    >
                                        Log in
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    )
}

export default Header