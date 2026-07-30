(() => {
    const language = (navigator.language || "en-US").replace("_", "-").toLowerCase();

    const storefront = (() => {
        if (language.startsWith("zh-hk")) return "hk";
        if (language.startsWith("zh-tw") || language.startsWith("zh-hant")) return "tw";
        if (language.startsWith("zh")) return "cn";
        if (language.startsWith("ja")) return "jp";
        if (language.startsWith("ko")) return "kr";
        if (language.startsWith("en-gb")) return "gb";
        if (language.startsWith("en-au")) return "au";
        if (language.startsWith("en-ca")) return "ca";
        return "us";
    })();

    const appStoreUrl = `https://apps.apple.com/${storefront}/app/monopump/id6763913464`;

    document.querySelectorAll("[data-app-store-link]").forEach((link) => {
        link.href = appStoreUrl;
    });
})();
