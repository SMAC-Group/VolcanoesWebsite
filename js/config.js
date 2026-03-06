// Centralized configuration — edit this file to customize the app.
// Switch backend to 'remote' and set apiUrl to convert to a dynamic site.

export const CONFIG = {
    // 'static' = CSV files + localStorage | 'remote' = REST API backend
    backend: 'static',
    apiUrl: null, // e.g. 'https://api.volcaninfos.fr/v1'

    // Default axis selection (must match CSV column names)
    defaultAxes: { x: 'T_C', y: 'P_kbar', z: 'SiO2_Cpx' },

    // Contact for data contributions
    contactEmail: 'contact@volcaninfos.fr',

    // localStorage limits
    maxCacheSizeKB: 5120, // 5 MB

    // Visual theme (aligned with docs/examples/volcano_viz.html)
    theme: {
        bg: '#0a0c10',
        bgPanel: '#111318',
        bgPlot: '#0d1017',
        text: '#e8e4dc',
        muted: '#6b7280',
        accent: '#e85d2f',
        accent2: '#f0a050',
        purple: '#7c5cbf',
        teal: '#2ab8a0',
        userColor: '#7cdb50',
        border: '#252932',
        gridColor: '#1e2330',
        fontHead: "'Syne', sans-serif",
        fontMono: "'Space Mono', monospace",
    },

    // Cluster colors (cycled if more groups than colors)
    clusterColors: [
        '#e85d2f', '#7c5cbf', '#2ab8a0', '#f0a050',
        '#c06040', '#a070d0', '#40b898', '#c0a0e0',
        '#e0c040', '#60a0e0', '#e07080', '#80d060',
    ],
};
