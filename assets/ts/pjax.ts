declare global {
    interface window {
        "pjax-api": {
            Pjax: any
        };
    }
}
declare global {
    interface Window {
        NProgress: {
            inc: () => void;
            done: () => void;
        };
    }
}


export default class Pjax {
    public pjaxInstance: any;
    constructor() {
        if (window["pjax-api"] == undefined) {
            console.error("pjax-api lib not loaded.");
            return;
        }
        this.init();

    }
    init() {
        this.pjaxInstance = new window["pjax-api"].Pjax(
            {
                areas: [
                    'body'
                ],
                update: {
                    ignores: {
                        extension: '[href^="chrome-extension://"]',
                        security: '[src*=".scr.kaspersky-labs.com/"]',
                        header: 'header',
                        socialMenu: '.social-menu',
                        footer: 'footer',
                    },
                }
            }
        );
        window.addEventListener('pjax:load', () => {
            window.Stack.reset();
        });
        window.addEventListener("pjax:fetch", () => { window.NProgress.inc(); });
        document.addEventListener("pjax:ready", () => { window.NProgress.done(); });
    }
}