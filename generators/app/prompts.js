'use strict';

module.exports = [
    {
        type: 'list',
        name: 'target',
        message: 'Que tipo de aplicativo você quer criar?',
        choices: [
            {
                value: 'web',
                name: 'Web app',
                checked: true
            },
            {
                value: 'mobile',
                name: 'Mobile app'
            }
        ]
    },
    {
        type: 'input',
        name: 'appName',
        message: 'Qual é o nome do seu aplicativo?'
    },
    {
        type: 'input',
        name: 'appDescription',
        message: 'Qual é a descrição do seu aplicativo?'
    },
    {
        type: 'confirm',
        name: 'pwa',
        message: 'Você quer um aplicativo da web progressivo(PWA)? (com manifest.json e service worker)',
        default: true,
        when: props => props.target && props.target.includes('web')
    },
    {
        type: 'list',
        name: 'request',
        message: 'Que tipo de login você quer criar?',
        choices: [
            {
                value: 'login',
                name: 'Login simples',
                checked: true
            },
            {
                value: 'identityServer',
                name: 'Login IdentityServer4'
            }
        ]
    },
    {
        type: 'confirm',
        name: 'angulartics',
        message: 'Você quer suporte Analytics?',
        default: true
    },
    {
        type: 'list',
        name: 'analyticsProvider',
        message: 'Qual provedor de análise você está usando?',
        choices: [
            {
                value: 'ga',
                name: 'Google Analytics'
            },
            {
                value: 'gtm',
                name: 'Google Tag Manager'
            }
        ],
        when: props => props.angulartics,
        default: 'ga'
    },
    {
        type: 'input',
        name: 'googleAnalyticsAccount',
        message: 'Qual é a sua conta do Google Analytics (por exemplo, UA-1234567-1)?',
        when: props => props.angulartics && props.analyticsProvider === 'ga'
    },
    {
        type: 'confirm',
        name: 'hotjar',
        message: 'Você quer suporte Hotjar?',
        default: true
    },
    {
        type: 'input',
        name: 'hotjarAccount',
        message: 'Qual é a sua conta ID do Hotjar (por exemplo, 1234567)?',
        when: props => props.hotjar
    }
];
