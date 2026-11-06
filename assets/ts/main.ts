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

function handlePrintChange(event: MediaQueryListEvent | MediaQueryList, forceColorScheme: boolean = false) {
    const html = document.documentElement;

    if (event.matches) {
        if (forceColorScheme) html.setAttribute('data-scheme', 'light');
        html.setAttribute('print-scheme', 'enable');
    } else {
        html.setAttribute('print-scheme', 'disable');
    }
}

function checkURLPrintFlags() {
    const params = new URL(window.location.href).searchParams;

    if (params.has('print')) {
        handlePrintChange({ matches: true } as MediaQueryList, true);
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
    }, 0);
})

declare global {
    interface Window {
        createElement: any;
        Stack: any
    }
}

window.Stack = Stack;
window.createElement = createElement;