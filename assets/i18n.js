(() => {
    const translations = window.MONOPUMP_TRANSLATIONS || {};
    const supportedLocales = [
        { code: "en", label: "English", htmlLang: "en" },
        { code: "zh-Hans", label: "简体中文", htmlLang: "zh-Hans" },
        { code: "zh-Hant", label: "繁體中文", htmlLang: "zh-Hant" },
        { code: "ja", label: "日本語", htmlLang: "ja" },
        { code: "ko", label: "한국어", htmlLang: "ko" },
        { code: "fr", label: "Français", htmlLang: "fr" },
        { code: "de", label: "Deutsch", htmlLang: "de" },
        { code: "es", label: "Español", htmlLang: "es" },
        { code: "pt", label: "Português", htmlLang: "pt" },
        { code: "ar", label: "العربية", htmlLang: "ar" }
    ];
    const supportedCodes = new Set(supportedLocales.map((locale) => locale.code));
    const storageKey = "monopump.websiteLanguage";

    const normalizeLocale = (value) => {
        const language = String(value || "").replace("_", "-").toLowerCase();
        if (language.startsWith("zh-hant") || language.startsWith("zh-tw") || language.startsWith("zh-hk")) {
            return "zh-Hant";
        }
        if (language.startsWith("zh")) return "zh-Hans";
        if (language.startsWith("ja")) return "ja";
        if (language.startsWith("ko")) return "ko";
        if (language.startsWith("fr")) return "fr";
        if (language.startsWith("de")) return "de";
        if (language.startsWith("es")) return "es";
        if (language.startsWith("pt")) return "pt";
        if (language.startsWith("ar")) return "ar";
        if (language.startsWith("en")) return "en";
        return null;
    };

    const readStoredLocale = () => {
        try {
            return localStorage.getItem(storageKey);
        } catch {
            return null;
        }
    };

    const writeStoredLocale = (locale) => {
        try {
            localStorage.setItem(storageKey, locale);
        } catch {
            // Language selection still works for the current page when storage is unavailable.
        }
    };

    const params = new URLSearchParams(window.location.search);
    const requestedLocale = normalizeLocale(params.get("lang"));
    const storedLocale = normalizeLocale(readStoredLocale());
    const browserLocale = (navigator.languages || [navigator.language])
        .map(normalizeLocale)
        .find(Boolean);
    const activeLocale = requestedLocale || storedLocale || browserLocale || "en";
    const activeConfig = supportedLocales.find((locale) => locale.code === activeLocale) || supportedLocales[0];
    const dictionary = translations[activeLocale] || {};

    document.documentElement.lang = activeConfig.htmlLang;
    document.documentElement.dir = activeLocale === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.locale = activeLocale;
    writeStoredLocale(activeLocale);

    const normalizedText = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const translate = (value) => dictionary[normalizedText(value)] || null;

    window.MonopumpI18n = {
        locale: activeLocale,
        t: (value) => translate(value) || value
    };

    const replaceTextNode = (node) => {
        const translated = translate(node.nodeValue);
        if (!translated) return;

        const leadingWhitespace = node.nodeValue.match(/^\s*/)?.[0] || "";
        const trailingWhitespace = node.nodeValue.match(/\s*$/)?.[0] || "";
        node.nodeValue = `${leadingWhitespace}${translated}${trailingWhitespace}`;
    };

    const translateDocument = () => {
        if (activeLocale === "en") return;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return normalizedText(node.nodeValue)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT;
                }
            }
        );

        const textNodes = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode);
        textNodes.forEach(replaceTextNode);

        document.querySelectorAll("[alt], [aria-label], [title], [placeholder]").forEach((element) => {
            ["alt", "aria-label", "title", "placeholder"].forEach((attribute) => {
                if (!element.hasAttribute(attribute)) return;
                const translated = translate(element.getAttribute(attribute));
                if (translated) element.setAttribute(attribute, translated);
            });
        });

        const translatedTitle = translate(document.title);
        if (translatedTitle) document.title = translatedTitle;

        document.querySelectorAll("meta[name='description'], meta[property='og:title'], meta[property='og:description']").forEach((meta) => {
            const translated = translate(meta.content);
            if (translated) meta.content = translated;
        });
    };

    const localizedUrl = (url, locale) => {
        const localized = new URL(url, window.location.href);
        localized.searchParams.set("lang", locale);
        return localized;
    };

    const updateInternalLinks = () => {
        document.querySelectorAll("a[href]").forEach((link) => {
            const rawHref = link.getAttribute("href");
            if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
                return;
            }

            const url = new URL(rawHref, window.location.href);
            if (url.origin !== window.location.origin || !url.pathname.endsWith(".html")) return;
            link.href = localizedUrl(url, activeLocale).toString();
        });
    };

    const updateDocumentUrls = () => {
        const currentUrl = localizedUrl(window.location.href, activeLocale);
        if (params.get("lang") !== activeLocale) {
            history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
        }

        const canonical = document.querySelector("link[rel='canonical']");
        if (canonical) canonical.href = currentUrl.toString();

        document.querySelectorAll("link[data-i18n-alternate]").forEach((link) => link.remove());
        supportedLocales.forEach((locale) => {
            const alternate = document.createElement("link");
            alternate.rel = "alternate";
            alternate.hreflang = locale.htmlLang;
            alternate.href = localizedUrl(window.location.href, locale.code).toString();
            alternate.dataset.i18nAlternate = "";
            document.head.appendChild(alternate);
        });

        const fallback = document.createElement("link");
        fallback.rel = "alternate";
        fallback.hreflang = "x-default";
        fallback.href = localizedUrl(window.location.href, "en").toString();
        fallback.dataset.i18nAlternate = "";
        document.head.appendChild(fallback);
    };

    const createLanguageSwitcher = () => {
        const wrapper = document.createElement("div");
        wrapper.className = "language-switcher";

        const label = document.createElement("label");
        label.className = "language-switcher-label";
        label.htmlFor = "website-language";
        label.textContent = translate("Website language") || "Website language";

        const select = document.createElement("select");
        select.id = "website-language";
        select.className = "language-switcher-select";
        select.setAttribute("aria-label", label.textContent);

        supportedLocales.forEach((locale) => {
            const option = document.createElement("option");
            option.value = locale.code;
            option.textContent = locale.label;
            option.selected = locale.code === activeLocale;
            select.appendChild(option);
        });

        select.addEventListener("change", () => {
            const nextLocale = supportedCodes.has(select.value) ? select.value : "en";
            writeStoredLocale(nextLocale);
            window.location.assign(localizedUrl(window.location.href, nextLocale).toString());
        });

        wrapper.append(label, select);
        document.body.appendChild(wrapper);
    };

    translateDocument();
    updateInternalLinks();
    updateDocumentUrls();
    createLanguageSwitcher();

    window.dispatchEvent(new CustomEvent("monopump:localechange", {
        detail: { locale: activeLocale }
    }));
})();
