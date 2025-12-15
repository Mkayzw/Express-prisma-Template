import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'Express + Prisma Boilerplate',
    description: 'Production-ready Express.js API with Prisma ORM, TypeScript, and more',
    base: '/Express-prisma-Template/',

    themeConfig: {
        logo: '/logo.svg',

        nav: [
            { text: 'Guide', link: '/guide/' },
            { text: 'API Reference', link: '/api/' },
            { text: 'GitHub', link: 'https://github.com/Mkayzw/Express-prisma-Template' }
        ],

        sidebar: {
            '/guide/': [
                {
                    text: 'Getting Started',
                    items: [
                        { text: 'Introduction', link: '/guide/' },
                        { text: 'Quick Start', link: '/guide/quick-start' },
                        { text: 'Configuration', link: '/guide/configuration' },
                    ]
                },
                {
                    text: 'Core Features',
                    items: [
                        { text: 'Authentication', link: '/guide/authentication' },
                        { text: 'Database', link: '/guide/database' },
                        { text: 'Caching', link: '/guide/caching' },
                        { text: 'Background Jobs', link: '/guide/jobs' },
                    ]
                },
                {
                    text: 'Production',
                    items: [
                        { text: 'Deployment', link: '/guide/deployment' },
                        { text: 'Monitoring', link: '/guide/monitoring' },
                    ]
                }
            ],
            '/api/': [
                {
                    text: 'API Reference',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        { text: 'Authentication', link: '/api/auth' },
                        { text: 'Users', link: '/api/users' },
                        { text: 'Jobs', link: '/api/jobs' },
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/Mkayzw/Express-prisma-Template' }
        ],

        footer: {
            message: 'Released under the MIT License.',
        }
    }
})
