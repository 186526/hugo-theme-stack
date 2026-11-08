/*!
*   Hugo Theme Stack
*
*   @author: Jimmy Cai
*   @website: https://jimmycai.com
*   @link: https://github.com/CaiJimmy/hugo-theme-stack
*/
import menu from './menu';
import createElement from './createElement';
import StackColorScheme from './colorScheme';
import { setupScrollspy } from './scrollspy';
import { setupSmoothAnchors } from './smoothAnchors';
import { setupPaginationJump } from './pagination';
import { setupCodeCopy } from './code-copy';
import Pjax from './pjax';
import { reportPageDetails } from './pageDetails';

function handlePrintChange(event: MediaQueryListEvent | MediaQueryList, forceColorScheme: boolean = false) {
    const html = document.documentElement;
    const serifStylesheet = document.querySelector<HTMLLinkElement>('link[data-print-font]');

    if (event.matches) {
        if (forceColorScheme) html.setAttribute('data-scheme', 'light');
        html.setAttribute('print-scheme', 'enable');
        /* 字体表只在打印媒体下注册 @font-face，?print 仍处于屏幕媒体，需要手动放开 */
        if (serifStylesheet) serifStylesheet.media = 'all';
    } else {
        html.setAttribute('print-scheme', 'disable');
        if (serifStylesheet) serifStylesheet.media = 'print';
    }
}

function checkURLPrintFlags() {
    const params = new URL(window.location.href).searchParams;

    if (params.has('print')) {
        handlePrintChange({ matches: true } as MediaQueryList, true);
    } else {
        handlePrintChange({ matches: false } as MediaQueryList);
    }

    if (params.has('withoutFooter')) {
        const footer = document.querySelector('footer.site-footer') as HTMLElement;
        if (footer) footer.style.display = 'none';
    }
}

function setupPrintListener() {
    const printMedia = window.matchMedia('print');
    printMedia.addEventListener('change', handlePrintChange);
}

let Stack = {
    init: () => {
        /**
         * Bind menu event
         */
        menu();

        const articleContent = document.querySelector('.article-content') as HTMLElement;
        if (articleContent) {
            setupSmoothAnchors();
            setupScrollspy();
            setupCodeCopy();
        }

        setupPaginationJump();

        new StackColorScheme(document.getElementById('dark-mode-toggle')!);

        setupPrintListener();
        checkURLPrintFlags();
    }
}

window.addEventListener('load', () => {
    setTimeout(function () {
        Stack.init();
        new Pjax();
    }, 0);

    setTimeout(reportPageDetails, 3000);
})

declare global {
    interface Window {
        createElement: any;
        Stack: any
    }
}

window.Stack = Stack;
window.createElement = createElement;