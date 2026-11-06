import gallery from './gallery';

type PhotoSwipeModule = {
    default: any;
};

type PhotoSwipeOptions = {
    style: string;
    core: string;
    lightbox: string;
};

declare global {
    interface Window {
        PhotoSwipeConfig?: PhotoSwipeOptions;
    }
}

let lightbox: { destroy: () => void } | null = null;
let loaded: Promise<{ PhotoSwipeLightbox: any; core: any }> | null = null;

const loadStyle = (href: string) => {
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
        return;
    }

    const styleTag = document.createElement('link');
    styleTag.rel = 'stylesheet';
    styleTag.href = href;
    document.head.appendChild(styleTag);
};

const loadModules = (options: PhotoSwipeOptions) => {
    if (!loaded) {
        loaded = Promise.all([
            import(options.lightbox) as Promise<PhotoSwipeModule>,
            import(options.core) as Promise<PhotoSwipeModule>,
        ]).then(([lightboxModule, coreModule]) => ({
            PhotoSwipeLightbox: lightboxModule.default,
            core: coreModule.default,
        }));
    }

    return loaded;
};

const setupPhotoSwipe = async (options: PhotoSwipeOptions) => {
    const articleContent = document.querySelector('.article-content');
    const shouldLoad = articleContent && (
        articleContent.querySelectorAll('figure').length > 0 ||
        articleContent.querySelectorAll('img.gallery-image').length > 0
    );

    if (!shouldLoad) {
        return;
    }

    gallery(articleContent);

    const { PhotoSwipeLightbox, core } = await loadModules(options);
    loadStyle(options.style);

    lightbox?.destroy();
    lightbox = new PhotoSwipeLightbox({
        gallerySelector: '.article-content',
        childSelector: 'figure a.image-link',
        pswpModule: () => core,
    });
    lightbox.init();
};

export { setupPhotoSwipe };

if (window.PhotoSwipeConfig) {
    setupPhotoSwipe(window.PhotoSwipeConfig);
}
