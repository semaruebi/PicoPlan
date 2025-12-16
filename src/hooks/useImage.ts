import { useState, useEffect } from 'react';
import { getImageFromDB } from '../utils/imageDb';

export const useImage = (localImageId?: string, fallbackUrl?: string) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!localImageId) {
            setImageUrl(fallbackUrl || null);
            return;
        }

        let isMounted = true;

        const fetchImage = async () => {
            const url = await getImageFromDB(localImageId);
            if (isMounted) {
                if (url) {
                    setImageUrl(url);
                } else {
                    setImageUrl(fallbackUrl || null);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
        };
    }, [localImageId, fallbackUrl]);

    return imageUrl;
};
