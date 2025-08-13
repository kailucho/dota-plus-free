export const rankOptions = (() => {
    // Solo tiers (sin subniveles 1-5)
    const tiers = [
        "Herald",
        "Guardian",
        "Crusader",
        "Archon",
        "Legend",
        "Ancient",
        "Divine",
        "Immortal",
    ];
    return tiers.map((t) => ({ label: t, value: t.toLowerCase() }));
})();
