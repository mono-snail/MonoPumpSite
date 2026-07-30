(() => {
    const storefrontForLanguage = (value) => {
        const language = String(value || "").replace("_", "-").toLowerCase();
        if (language.startsWith("zh-hk")) return "hk";
        if (language.startsWith("zh-tw") || language.startsWith("zh-hant")) return "tw";
        if (language.startsWith("zh")) return "cn";
        if (language.startsWith("ja")) return "jp";
        if (language.startsWith("ko")) return "kr";
        if (language.startsWith("fr")) return "fr";
        if (language.startsWith("de")) return "de";
        if (language.startsWith("es")) return "es";
        if (language.startsWith("pt")) return "pt";
        if (language.startsWith("ar")) return "sa";
        if (language.startsWith("en-gb")) return "gb";
        if (language.startsWith("en-au")) return "au";
        if (language.startsWith("en-ca")) return "ca";
        return "us";
    };

    const selectedLanguage = () => {
        const params = new URLSearchParams(window.location.search);
        const queryLanguage = params.get("lang");
        if (queryLanguage) return queryLanguage;

        try {
            const storedLanguage = localStorage.getItem("monopump.websiteLanguage");
            if (storedLanguage) return storedLanguage;
        } catch {
            // Fall back to the document or browser locale when storage is unavailable.
        }

        return document.documentElement.dataset.locale
            || document.documentElement.lang
            || navigator.language
            || "en-US";
    };

    const updateLinks = (language = selectedLanguage()) => {
        const storefront = storefrontForLanguage(language);
        const appStoreUrl = `https://apps.apple.com/${storefront}/app/monopump/id6763913464`;

        document.querySelectorAll("[data-app-store-link]").forEach((link) => {
            link.href = appStoreUrl;
        });
    };

    updateLinks();
    window.addEventListener("monopump:localechange", (event) => {
        updateLinks(event.detail?.locale);
    });
})();
