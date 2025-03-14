import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const NotificationSuccess = ({ message = "Successfully saved!", duration = 3000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed top-4 right-4 z-50 flex items-center
                 bg-white shadow-lg rounded-lg
                 border border-green-200
                 py-3 px-4
                 animate-slide-in
                 max-w-xs w-full sm:max-w-sm md:max-w-md lg:max-w-lg"
        >
            <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
            <span className="text-white font-medium">
                {message}
            </span>
        </div>
    );
};

export default NotificationSuccess;